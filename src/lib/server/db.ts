import pkg from 'pg';
import type { PoolClient } from 'pg';
const { Pool } = pkg;
import { DATABASE_URL, DB_SSL } from '$env/static/private';
import {
	type AccompanistInterface,
	type ContributorInterface,
	type MusicalPieceInterface,
	type PerformerInterface,
	type PerformanceInterface,
	type PerformanceFilterInterface,
	type PerformancePieceInterface,
	type PerformerSearchResultsInterface,
	year,
	calcEpochAge,
	normalizeContributorRole
} from '$lib/server/common';
import { isNonEmptyString } from '$lib/server/common';

export const pool = new Pool({
	connectionString: DATABASE_URL,
	ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

function normalizeTableName(table: string): string {
	if (table === 'composer') {
		return 'contributor';
	}
	return table;
}
export async function queryTable(table: string, id?: number) {
	const connection = await pool.connect();
	try {
		let fields = '';
		let filter = '';
		let sort = '';
		const tableName = normalizeTableName(table);

		switch (tableName) {
			case 'contributor':
				fields = 'id, full_name, years_active, role, notes, updated_at, updated_by';
				break;
			case 'accompanist':
				fields = 'id, full_name';
				break;
			case 'performer':
				fields = 'id, full_name, email, phone, epoch, instrument';
				break;
			case 'musical_piece':
				fields =
					'id, printed_name, first_contributor_id, all_movements, second_contributor_id, third_contributor_id, imslp_url, comments, flag_for_discussion, discussion_notes, is_not_appropriate, updated_at';
				break;
			case 'concert_times':
				fields = 'id, concert_series, year, concert_number_in_series, start_time';
				break;
			case 'class_lottery':
				fields = 'class_name, lottery';
				break;
		}
		if (id != null) {
			filter = ' WHERE id=' + id;
		} else {
			sort = ' ORDER BY id';
		}

		// tables with no id field
		switch (tableName) {
			case 'class_lottery':
				sort = '';
				break;
		}

		return await connection.query('SELECT ' + fields + ' FROM ' + tableName + filter + sort);
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	} finally {
		connection.release();
	}
}

type PerformanceLookupContext = {
	performer_id: number;
	concert_series: string;
	year: number;
};

async function lookupByPerformanceContext(
	connection: PoolClient,
	context: PerformanceLookupContext,
	fallbackCode?: number
): Promise<PerformerSearchResultsInterface | null> {
	const lookupQuery = `
		WITH performances AS (
			SELECT p.id,
			       p.performer_id,
			       p.class_name,
			       p.concert_series,
			       p.year,
			       p.duration,
			       p.comment,
			       cl.lottery
			  FROM performance p
			  LEFT JOIN class_lottery cl ON cl.class_name = p.class_name
			 WHERE p.performer_id = $1
			   AND LOWER(p.concert_series) = LOWER($2)
			   AND p.year = $3
		),
		primary_perf AS (
			SELECT id, performer_id, concert_series, year, duration, comment, class_name, lottery
			  FROM performances
			 ORDER BY lottery ASC NULLS LAST, id ASC
			 LIMIT 1
		)
		SELECT perf.id AS performer_id,
		       perf.full_name AS performer_name,
		       primary_perf.id AS performance_id,
		       primary_perf.concert_series AS concert_series,
		       primary_perf.duration AS performance_duration,
		       primary_perf.comment AS performance_comment,
		       MIN(performances.lottery) AS primary_class_code,
		       STRING_AGG(DISTINCT performances.class_name, ', ' ORDER BY performances.class_name)
		         AS winner_class_display,
		       STRING_AGG(DISTINCT mp.printed_name, '; ' ORDER BY mp.printed_name)
		         AS musical_piece
		  FROM performances
		  JOIN performer perf ON perf.id = performances.performer_id
		  LEFT JOIN adjudicated_pieces pp ON pp.performance_id = performances.id
		  LEFT JOIN musical_piece mp ON mp.id = pp.musical_piece_id
		  JOIN primary_perf ON primary_perf.performer_id = performances.performer_id
		 GROUP BY perf.id,
		          perf.full_name,
		          primary_perf.id,
		          primary_perf.concert_series,
		          primary_perf.duration,
		          primary_perf.comment;
	`;

	const lookupResult = await connection.query(lookupQuery, [
		context.performer_id,
		context.concert_series,
		context.year
	]);

	if (!lookupResult.rowCount) {
		return null;
	}

	const row = lookupResult.rows[0];
	const primaryClassCode = row.primary_class_code ?? fallbackCode ?? 0;
	const musicalPiece = row.musical_piece ?? '';
	const winnerClassDisplay = row.winner_class_display ?? '';

	return {
		status: 'OK',
		performer_id: row.performer_id,
		performer_name: row.performer_name,
		musical_piece: musicalPiece,
		lottery_code: primaryClassCode,
		primary_class_code: primaryClassCode,
		winner_class_display: winnerClassDisplay,
		concert_series: row.concert_series,
		performance_id: row.performance_id,
		performance_duration: row.performance_duration,
		performance_comment: row.performance_comment
	};
}

async function resolveLookupContextByCode(
	connection: PoolClient,
	code: number,
	lookupYear: number
): Promise<PerformanceLookupContext | null> {
	const contextQuery = `
		SELECT p.performer_id,
		       p.concert_series,
		       p.year
		  FROM performance p
		  JOIN class_lottery cl ON p.class_name = cl.class_name
		 WHERE cl.lottery = $1
		   AND p.year = $2
		 LIMIT 1;
	`;

	const contextResult = await connection.query(contextQuery, [code, lookupYear]);
	if (!contextResult.rowCount) {
		return null;
	}

	return contextResult.rows[0] as PerformanceLookupContext;
}

async function resolveLookupContextByDetails(
	connection: PoolClient,
	performerLastName: string,
	age: number,
	composer: string,
	lookupYear: number
): Promise<PerformanceLookupContext | null> {
	const birthYear = calcEpochAge(age);
	const performerPattern = `%${performerLastName}`;
	const composerPattern = `%${composer}`;

	const contextQuery = `
		SELECT performer.id AS performer_id,
		       performance.concert_series,
		       performance.year
		  FROM performer
		  JOIN performance ON performance.performer_id = performer.id
		  JOIN adjudicated_pieces ON adjudicated_pieces.performance_id = performance.id
		  JOIN musical_piece ON musical_piece.id = adjudicated_pieces.musical_piece_id
		  JOIN contributor ON musical_piece.first_contributor_id = contributor.id
		 WHERE performer.full_name ILIKE $1
		   AND (
		     LOWER(contributor.full_name) LIKE LOWER($2)
		     OR LOWER(contributor.notes) = LOWER($3)
		   )
		   AND performer.epoch = $4
		   AND performance.year = $5
		 ORDER BY performance.concert_series ASC
		 LIMIT 1;
	`;

	const contextResult = await connection.query(contextQuery, [
		performerPattern,
		composerPattern,
		composer,
		birthYear,
		lookupYear
	]);

	if (!contextResult.rowCount) {
		return null;
	}

	return contextResult.rows[0] as PerformanceLookupContext;
}

export async function lookupByDetails(
	performerLastName: string,
	age: number,
	composer: string
): Promise<PerformerSearchResultsInterface | null> {
	try {
		const connection = await pool.connect();
		try {
			const lookupYear = year();
			const context = await resolveLookupContextByDetails(
				connection,
				performerLastName,
				age,
				composer,
				lookupYear
			);
			if (!context) {
				return null;
			}

			return await lookupByPerformanceContext(connection, context);
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function lookupByCode(code: string): Promise<PerformerSearchResultsInterface | null> {
	try {
		const connection = await pool.connect();
		try {
			const lookupCode = Number.parseInt(code, 10);
			if (!Number.isInteger(lookupCode)) {
				return null;
			}

			const lookupYear = year();
			const context = await resolveLookupContextByCode(connection, lookupCode, lookupYear);
			if (!context) {
				return null;
			}

			return await lookupByPerformanceContext(connection, context, lookupCode);
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function mergePerformancePiecesForPerformerSeries(
	performerId: number,
	concertSeries: string,
	scheduleYear: number
): Promise<void> {
	const connection = await pool.connect();
	try {
		const performancesResult = await connection.query(
			`SELECT p.id,
              cl.lottery
         FROM performance p
         LEFT JOIN class_lottery cl ON cl.class_name = p.class_name
        WHERE p.performer_id = $1
          AND LOWER(p.concert_series) = LOWER($2)
          AND p.year = $3
        ORDER BY cl.lottery ASC NULLS LAST, p.id ASC`,
			[performerId, concertSeries, scheduleYear]
		);

		// Case 4: 0 or undefined -> no-op
		if (!performancesResult.rowCount || performancesResult.rowCount < 1) {
			return;
		}

		const primaryPerformanceId = performancesResult.rows[0].id;

		// Case 3: exactly 1 -> backfill only if performance_pieces is empty; never delete
		if (performancesResult.rowCount === 1) {
			const existingPiecesResult = await connection.query(
				`SELECT 1
           FROM performance_pieces
          WHERE performance_id = $1
          LIMIT 1`,
				[primaryPerformanceId]
			);

			// Strictly "empty" means no rows at all.
			if (existingPiecesResult.rowCount && existingPiecesResult.rowCount > 0) {
				return;
			}

			// Backfill from adjudicated_pieces for the primary performance
			await connection.query(
				`INSERT INTO performance_pieces (performance_id, musical_piece_id, movement)
         SELECT $1, merged.musical_piece_id, merged.movement
           FROM (
             SELECT ap.musical_piece_id,
                    MAX(ap.movement) AS movement
               FROM adjudicated_pieces ap
              WHERE ap.performance_id = $1
                AND ap.is_merged = false
              GROUP BY ap.musical_piece_id
           ) AS merged
         ON CONFLICT (performance_id, musical_piece_id)
         DO UPDATE SET movement = EXCLUDED.movement`,
				[primaryPerformanceId]
			);

			return;
		}

		// Case 1/2: rowCount >= 2 -> reset + fresh merge
		const allPerformanceIds: number[] = performancesResult.rows
			.map((r) => r.id)
			.filter((id) => id != null);

		const secondaryPerformanceIds: number[] = allPerformanceIds.slice(1);

		// Defensive: if somehow no secondaries, nothing to merge
		if (secondaryPerformanceIds.length === 0) {
			return;
		}

		// 1) Reset performance_pieces for BOTH primary + secondary performances
		await connection.query(
			`DELETE FROM performance_pieces
        WHERE performance_id = ANY($1)`,
			[allPerformanceIds]
		);

		// 2) Reset adjudicated_pieces merge flags for involved performances
		await connection.query(
			`UPDATE adjudicated_pieces
          SET is_merged = false
        WHERE performance_id = ANY($1)`,
			[allPerformanceIds]
		);

		// 3) Fresh merge into primary from adjudicated_pieces across ALL involved performances
		//    (primary + secondaries), grouped by musical_piece_id with MAX(movement)
		await connection.query(
			`INSERT INTO performance_pieces (performance_id, musical_piece_id, movement)
       SELECT $1, merged.musical_piece_id, merged.movement
         FROM (
           SELECT ap.musical_piece_id,
                  MAX(ap.movement) AS movement
             FROM adjudicated_pieces ap
            WHERE ap.performance_id = ANY($2)
              AND ap.is_merged = false
            GROUP BY ap.musical_piece_id
         ) AS merged
       ON CONFLICT (performance_id, musical_piece_id)
       DO UPDATE SET movement = EXCLUDED.movement`,
			[primaryPerformanceId, allPerformanceIds]
		);

		// 4) Mark secondaries as merged (primary remains unmerged)
		await connection.query(
			`UPDATE adjudicated_pieces
          SET is_merged = true
        WHERE performance_id = ANY($1)`,
			[secondaryPerformanceIds]
		);
	} finally {
		connection.release();
	}
}

export async function deleteById(table: string, id: number): Promise<number | null> {
	try {
		const connection = await pool.connect();

		const result = await connection.query(
			'DELETE FROM ' + normalizeTableName(table) + ' WHERE id = ' + id
		);

		// Release the connection back to the pool
		connection.release();

		return result.rowCount;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function isContributorReferenced(contributorId: number): Promise<boolean> {
	const connection = await pool.connect();
	try {
		const result = await connection.query(
			`SELECT 1
			 FROM musical_piece
			 WHERE first_contributor_id = $1
			    OR second_contributor_id = $1
			    OR third_contributor_id = $1
			 LIMIT 1`,
			[contributorId]
		);
		return (result.rowCount ?? 0) > 0;
	} finally {
		connection.release();
	}
}

export async function insertTable(
	table: string,
	data: ContributorInterface | AccompanistInterface | MusicalPieceInterface | PerformerInterface
) {
	try {
		const connection = await pool.connect();

		let inputCols = '';
		let inputVals = '';
		const return_id = true;
		const tableName = normalizeTableName(table);

		switch (tableName) {
			case 'contributor': {
				const role = normalizeContributorRole((data as ContributorInterface).role);
				inputCols = '(full_name, years_active, role)';
				inputVals =
					"('" +
					(data as ContributorInterface).full_name.replaceAll("'", "''").trim() +
					"', '" +
					(data as ContributorInterface).years_active +
					"', '" +
					role +
					"')";
				// add notes
				if (isNonEmptyString((data as ContributorInterface).notes)) {
					inputCols = inputCols.slice(0, -1) + ', notes)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as ContributorInterface).notes.replaceAll("'", "''").trim() +
						"')";
				}
				// return id
				break;
			}
			case 'accompanist':
				inputCols = '(full_name)';
				inputVals =
					"('" + (data as AccompanistInterface).full_name.replaceAll("'", "''").trim() + "')";
				// return id
				break;
			case 'performer':
				inputCols = '(full_name, epoch, instrument)';
				inputVals =
					"('" +
					(data as PerformerInterface).full_name.replaceAll("'", "''").trim() +
					"', " +
					(data as PerformerInterface).epoch +
					", '" +
					(data as PerformerInterface).instrument +
					"')";
				// add email
				if (
					(data as PerformerInterface).email != null &&
					isNonEmptyString((data as PerformerInterface).email)
				) {
					inputCols = inputCols.slice(0, -1) + ', email)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as PerformerInterface).email.replaceAll("'", "''").trim() +
						"')";
				}
				// add phone
				if (
					(data as PerformerInterface).phone != null &&
					isNonEmptyString((data as PerformerInterface).phone)
				) {
					inputCols = inputCols.slice(0, -1) + ', phone)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as PerformerInterface).phone.replaceAll("'", "''").trim() +
						"')";
				}
				// return id
				break;
			case 'musical_piece':
				inputCols = '(printed_name, first_contributor_id, flag_for_discussion, is_not_appropriate)';
				inputVals =
					"('" +
					(data as MusicalPieceInterface).printed_name.replaceAll("'", "''").trim() +
					"', '" +
					(data as MusicalPieceInterface).first_contributor_id +
					"', " +
					((data as MusicalPieceInterface).flag_for_discussion === true) +
					', ' +
					((data as MusicalPieceInterface).is_not_appropriate === true) +
					')';
				// add movements
				if (
					(data as MusicalPieceInterface).all_movements != null &&
					(data as MusicalPieceInterface).all_movements
				) {
					inputCols = inputCols.slice(0, -1) + ', all_movements)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).all_movements.replaceAll("'", "''").trim() +
						"')";
				}
				// add another composer
				if (
					(data as MusicalPieceInterface).second_contributor_id !== null &&
					(data as MusicalPieceInterface).second_contributor_id !== undefined &&
					(data as MusicalPieceInterface).second_contributor_id !== ''
				) {
					inputCols = inputCols.slice(0, -1) + ', second_contributor_id)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).second_contributor_id +
						"')";
				}
				if (
					(data as MusicalPieceInterface).third_contributor_id !== null &&
					(data as MusicalPieceInterface).third_contributor_id !== undefined &&
					(data as MusicalPieceInterface).third_contributor_id !== ''
				) {
					inputCols = inputCols.slice(0, -1) + ', third_contributor_id)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).third_contributor_id +
						"')";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).imslp_url)) {
					inputCols = inputCols.slice(0, -1) + ', imslp_url)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).imslp_url.replaceAll("'", "''").trim() +
						"')";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).comments)) {
					inputCols = inputCols.slice(0, -1) + ', comments)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).comments.replaceAll("'", "''").trim() +
						"')";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).discussion_notes)) {
					inputCols = inputCols.slice(0, -1) + ', discussion_notes)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).discussion_notes.replaceAll("'", "''").trim() +
						"')";
				}
				//return id
				break;
		}

		let insertSQL = 'INSERT INTO ' + tableName + ' ' + inputCols + ' VALUES ' + inputVals;
		if (return_id) {
			insertSQL = insertSQL + ' RETURNING id';
		}

		const result = await connection.query(insertSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function insertPerformance(
	data: PerformanceInterface,
	performer_id: number,
	order: number | null,
	comment: string | null,
	warm_up_room_name: string | null,
	warm_up_room_start: Date | null,
	warm_up_room_end: Date | null
) {
	try {
		const connection = await pool.connect();
		const chairOverride = data.chair_override === true;

		let cols = 'performer_id, concert_series, class_name, year, instrument, chair_override';
		let vals =
			performer_id +
			", '" +
			data.concert_series +
			"', '" +
			data.class +
			"', " +
			data.year +
			", '" +
			data.instrument +
			"', " +
			chairOverride;

		if (order != null) {
			cols = cols + ', order';
			vals = vals + ', ' + order;
		}
		if (data.duration != null) {
			cols = cols + ', duration';
			vals = vals + ', ' + data.duration;
		}
		if (data.accompanist_id != null) {
			cols = cols + ', accompanist_id';
			vals = vals + ', ' + data.accompanist_id;
		}
		if (comment != null && comment != '') {
			cols = cols + ', comment';
			vals = vals + ", '" + comment + "'";
		}
		if (warm_up_room_name != null) {
			cols = cols + ', warm_up_room_name';
			vals = vals + ", '" + warm_up_room_name + "'";
		}
		if (warm_up_room_start != null) {
			cols = cols + ', warm_up_room_start';
			vals = vals + ", '" + warm_up_room_start.toTimeString() + "'";
		}
		if (warm_up_room_end != null) {
			cols = cols + ', warm_up_room_end';
			vals = vals + ", '" + warm_up_room_end.toTimeString() + "'";
		}

		cols = '(' + cols + ')';
		vals = '(' + vals + ')';

		const insertSQL = 'INSERT INTO PERFORMANCE ' + cols + ' VALUES ' + vals + 'RETURNING id';
		const result = await connection.query(insertSQL);

		// Release the connection back to the pool
		connection.release();
		return result;
	} catch (error) {
		console.error('Error executing insertPerformance:', error);
		throw error;
	}
}

export async function updateConcertPerformance(
	performanceId: number,
	duration: number,
	comment: string | null
): Promise<bool> {
	try {
		const connection = await pool.connect();
		let setSQL = 'SET duration = ' + duration;
		if (comment != null) {
			setSQL = setSQL + ", comment = '" + comment + "'";
		}
		const updateSQL = 'UPDATE performance ' + setSQL + ' WHERE performance.id = ' + performanceId;
		const result = await connection.query(updateSQL);

		// Release the connection back to the pool
		connection.release();

		if (result.rowCount != 0) {
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error executing insertPerformance:', error);
		throw error;
	}
}

export async function updatePerformance(
	data: PerformanceInterface,
	performer_id: number,
	order: number | null,
	comment: string | null,
	warm_up_room_name: string | null,
	warm_up_room_start: Date | null,
	warm_up_room_end: Date | null
) {
	try {
		const connection = await pool.connect();
		const chairOverride = data.chair_override === true;
		const hasChairOverride = typeof data.chair_override === 'boolean';

		let setCols =
			'performer_id = ' +
			performer_id +
			", concert_series = '" +
			data.concert_series +
			"', class_name = '" +
			data.class +
			"', year = " +
			data.year +
			", instrument = '" +
			data.instrument +
			"'";

		if (order != null) {
			setCols = setCols + ', order = ' + order;
		}
		if (data.duration != null) {
			setCols = setCols + ', duration = ' + data.duration;
		}
		if (data.accompanist_id != null) {
			setCols = setCols + ', accompanist_id = ' + data.accompanist_id;
		}
		if (comment != null && comment != '') {
			setCols = setCols + ", comment = '" + comment + "'";
		}
		if (warm_up_room_name != null) {
			setCols = setCols + ", warm_up_room_name = '" + warm_up_room_name + "'";
		}
		if (warm_up_room_start != null) {
			setCols = setCols + ", warm_up_room_start = '" + warm_up_room_start.toTimeString() + "'";
		}
		if (warm_up_room_end != null) {
			setCols = setCols + ", warm_up_room_end = '" + warm_up_room_end.toTimeString() + "'";
		}
		if (hasChairOverride) {
			setCols = setCols + ', chair_override = ' + chairOverride;
		}

		const updateSQL = 'UPDATE PERFORMANCE SET ' + setCols + ' WHERE performance.id = ' + data.id;
		const result = await connection.query(updateSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing insertPerformance:', error);
		throw error;
	}
}

export async function updateById(
	table: string,
	data: ContributorInterface | AccompanistInterface | MusicalPieceInterface | PerformerInterface
) {
	try {
		const connection = await pool.connect();

		let setCols = '';
		const tableName = normalizeTableName(table);

		switch (tableName) {
			case 'contributor': {
				const role = normalizeContributorRole((data as ContributorInterface).role);
				// don't wipe out data
				if (
					!(
						isNonEmptyString((data as ContributorInterface).full_name) &&
						isNonEmptyString((data as ContributorInterface).years_active)
					)
				) {
					return null;
				}
				setCols = setCols + " full_name = '" + (data as ContributorInterface).full_name + "'";
				setCols =
					setCols + ", years_active = '" + (data as ContributorInterface).years_active + "'";
				setCols = setCols + ", role = '" + role + "'";
				if (isNonEmptyString((data as ContributorInterface).notes)) {
					setCols = setCols + ", notes = '" + (data as ContributorInterface).notes + "' ";
				}
				setCols = setCols + ', updated_at = NOW()';
				break;
			}
			case 'accompanist': {
				// don't wipe out data
				if (!isNonEmptyString((data as AccompanistInterface).full_name)) {
					return null;
				}
				setCols = "full_name = '" + (data as AccompanistInterface).full_name + "'";
				break;
			}
			case 'performer': {
				// don't wipe out data
				if (
					!(
						isNonEmptyString((data as PerformerInterface).full_name) &&
						isNonEmptyString((data as PerformerInterface).instrument) &&
						(data as PerformerInterface).epoch != null
					)
				) {
					return null;
				}
				setCols = "full_name = '" + (data as PerformerInterface).full_name + "'";
				setCols = setCols + ", instrument = '" + (data as PerformerInterface).instrument + "'";
				setCols = setCols + ', epoch = ' + (data as PerformerInterface).epoch + ' ';
				if (isNonEmptyString((data as PerformerInterface).email)) {
					setCols = setCols + ", email = '" + (data as PerformerInterface).email + "' ";
				}
				if (isNonEmptyString((data as PerformerInterface).phone)) {
					setCols = setCols + ", phone = '" + (data as PerformerInterface).phone + "' ";
				}
				break;
			}
			case 'musical_piece': {
				// don't wipe out data
				if (
					!isNonEmptyString((data as MusicalPieceInterface).printed_name) ||
					(data as MusicalPieceInterface).first_contributor_id == null
				) {
					return null;
				}
				setCols =
					"printed_name = '" +
					(data as MusicalPieceInterface).printed_name.replaceAll("'", "''").trim() +
					"'";
				setCols =
					setCols +
					", first_contributor_id = '" +
					(data as MusicalPieceInterface).first_contributor_id +
					"'";
				if (isNonEmptyString((data as MusicalPieceInterface).all_movements)) {
					setCols =
						setCols +
						", all_movements = '" +
						(data as MusicalPieceInterface).all_movements.replaceAll("'", "''").trim() +
						"' ";
				}
				if (
					(data as MusicalPieceInterface).second_contributor_id !== null &&
					(data as MusicalPieceInterface).second_contributor_id !== undefined &&
					(data as MusicalPieceInterface).second_contributor_id !== ''
				) {
					setCols =
						setCols +
						", second_contributor_id = '" +
						(data as MusicalPieceInterface).second_contributor_id +
						"' ";
				}
				if (
					(data as MusicalPieceInterface).third_contributor_id !== null &&
					(data as MusicalPieceInterface).third_contributor_id !== undefined &&
					(data as MusicalPieceInterface).third_contributor_id !== ''
				) {
					setCols =
						setCols +
						", third_contributor_id = '" +
						(data as MusicalPieceInterface).third_contributor_id +
						"' ";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).imslp_url)) {
					setCols =
						setCols +
						", imslp_url = '" +
						(data as MusicalPieceInterface).imslp_url.replaceAll("'", "''").trim() +
						"' ";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).comments)) {
					setCols =
						setCols +
						", comments = '" +
						(data as MusicalPieceInterface).comments.replaceAll("'", "''").trim() +
						"' ";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).discussion_notes)) {
					setCols =
						setCols +
						", discussion_notes = '" +
						(data as MusicalPieceInterface).discussion_notes.replaceAll("'", "''").trim() +
						"' ";
				}
				const flagForDiscussion =
					(data as MusicalPieceInterface).flag_for_discussion === true ? 'true' : 'false';
				const isNotAppropriate =
					(data as MusicalPieceInterface).is_not_appropriate === true ? 'true' : 'false';
				setCols = setCols + ', flag_for_discussion = ' + flagForDiscussion;
				setCols = setCols + ', is_not_appropriate = ' + isNotAppropriate;
				setCols = setCols + ', updated_at = NOW()';
				break;
			}
		}

		const updateSQL = 'UPDATE ' + tableName + ' SET ' + setCols + ' WHERE id=' + data.id;
		const result = await connection.query(updateSQL);

		// Release the connection back to the pool
		connection.release();

		return result.rowCount;
	} catch (error) {
		console.error('Error executing updateById:', error);
		throw error;
	}
}

export async function insertPerformancePieceMap(performancePieceMap: PerformancePieceInterface) {
	try {
		const connection = await pool.connect();

		const isMerged = performancePieceMap.is_merged === true ? 'true' : 'false';
		let insertSQL = 'INSERT INTO adjudicated_pieces ';
		if (performancePieceMap.movement != null) {
			insertSQL = insertSQL + '(performance_id, musical_piece_id, movement, is_merged) ';
			insertSQL =
				insertSQL +
				'VALUES (' +
				performancePieceMap.performance_id +
				', ' +
				performancePieceMap.musical_piece_id +
				", '" +
				performancePieceMap.movement +
				"', " +
				isMerged +
				' )';
		} else {
			insertSQL = insertSQL + '(performance_id, musical_piece_id, is_merged) ';
			insertSQL =
				insertSQL +
				'VALUES (' +
				performancePieceMap.performance_id +
				', ' +
				performancePieceMap.musical_piece_id +
				', ' +
				isMerged +
				' )';
		}
		const result = await connection.query(insertSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function deletePerformancePieceMap(
	performancePieceMap: PerformancePieceInterface,
	deleteAll: boolean = false
) {
	try {
		const connection = await pool.connect();

		let deleteSQL =
			'DELETE FROM adjudicated_pieces where performance_id = ' + performancePieceMap.performance_id;

		if (!deleteAll) {
			deleteSQL = deleteSQL + ' AND musical_piece_id = ' + performancePieceMap.musical_piece_id;
		}

		const result = await connection.query(deleteSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function deletePerformancePieceByPerformanceId(performance_id: number) {
	try {
		const connection = await pool.connect();

		const deleteSQL = 'DELETE FROM adjudicated_pieces where performance_id = ' + performance_id;
		const result = await connection.query(deleteSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function updatePerformancePieceMap(performancePieceMap: PerformancePieceInterface) {
	const deleteAll: boolean = true;
	await deletePerformancePieceMap(performancePieceMap, deleteAll);
	await insertPerformancePieceMap(performancePieceMap);
}

export async function getClassLottery(class_name: string) {
	try {
		const connection = await pool.connect();

		const result = await connection.query(
			'SELECT class_name, lottery' +
				'       FROM class_lottery' +
				"      WHERE class_name = '" +
				class_name +
				"'"
		);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function updateClassLottery(class_name: string, lottery: number) {
	try {
		const connection = await pool.connect();

		const updateSQL =
			'UPDATE class_lottery' +
			'        SET lottery = ' +
			lottery +
			',' +
			'        WHERE class_name = ' +
			class_name;

		const result = await connection.query(updateSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function insertClassLottery(class_name: string, lottery: number) {
	try {
		const connection = await pool.connect();

		const insertSQL =
			'INSERT INTO class_lottery' +
			'        (class_name, lottery) ' +
			"        VALUES ('" +
			class_name +
			"', " +
			lottery +
			')';

		const result = await connection.query(insertSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function deleteClassLottery(class_name: string) {
	try {
		const connection = await pool.connect();

		const deleteSQL = "DELETE FROM class_lottery WHERE class_name = '" + class_name + "'";

		const result = await connection.query(deleteSQL);

		// Release the connection back to the pool
		connection.release();
		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function queryPerformances(filters?: PerformanceFilterInterface) {
	/**
	 *     id: number | null;
	 *     musical_piece: string;
	 *     movement: string
	 *     composer: string - first composer could be several
	 *     composer_years_active: string -first composer could be several
	 *     composer2: string - mostly empty
	 *     composer2_years_active: string - mostly empty
	 *     composer3: string - almost always empty
	 *     composer3_years_active: string -s almost always empty
	 *     accompanist: string;
	 *     duration: number;
	 *     comment: string;
	 *     instrument: string | null;
	 *     performance_order: number default 100;
	 *     concert_series: string (Eastside | Concerto Playoff);
	 *     year: number of years of pafe
	 *
	 */
	try {
		const connection = await pool.connect();

		const fields =
			'performance.id, ' +
			'            musical_piece.printed_name AS musical_piece,\n' +
			'            adjudicated_pieces.movement,\n' +
			'            First.full_name AS composer, First.years_active AS composer_years_active,\n' +
			'            Second.full_name AS composer2, Second.years_active AS composer2_years_active,\n' +
			'            Third.full_name AS composer3, Third.years_active AS composer3_years_active,\n' +
			'            accompanist.full_name AS accompanist,\n' +
			'            performance.duration, performance.comment, performance.instrument,\n' +
			'            performance.performance_order, performance.concert_series, performance.year\n';
		const joins =
			' JOIN adjudicated_pieces ON performance.id = adjudicated_pieces.performance_id\n' +
			'        JOIN musical_piece ON adjudicated_pieces.musical_piece_id = musical_piece.id\n' +
			'        JOIN contributor First ON First.id = musical_piece.first_contributor_id\n' +
			'        LEFT JOIN contributor Second ON Second.id = musical_piece.second_contributor_id\n' +
			'        LEFT JOIN contributor Third ON Third.id = musical_piece.second_contributor_id\n' +
			'        LEFT JOIN accompanist ON performance.accompanist_id = accompanist.id\n';
		const order =
			'ORDER BY performance.year, performance.concert_series, performance.performance_order';

		let queryFilter = '';
		if (typeof filters != 'undefined' && Object.entries(filters).length > 0) {
			queryFilter =
				'WHERE ' +
				Object.entries(filters)
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					.filter(([_, value]) => value !== null) // filter out null values
					.map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value}'` : value}`)
					.join(' and ');
		}
		queryFilter = queryFilter + '\n';

		const result = await connection.query(
			'SELECT ' + fields + ' FROM performance' + joins + queryFilter + order
		);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function queryMusicalPieceByPerformanceId(id: number) {
	try {
		const connection = await pool.connect();
		const querySQL =
			'SELECT performance.id, musical_piece.printed_name, adjudicated_pieces.movement, \n' +
			'one.full_name as composer_one_name, one.years_active as composer_one_years, \n' +
			'two.full_name as composer_two_name, two.years_active as composer_two_years, \n' +
			'three.full_name as composer_three_name, three.years_active as composer_three_years \n' +
			'FROM musical_piece\n' +
			'JOIN adjudicated_pieces ON musical_piece.id = adjudicated_pieces.musical_piece_id\n' +
			'JOIN contributor one ON one.id = musical_piece.first_contributor_id\n' +
			'LEFT JOIN contributor two ON two.id = musical_piece.second_contributor_id\n' +
			'LEFT JOIN contributor three ON three.id = musical_piece.third_contributor_id\n' +
			'JOIN performance ON adjudicated_pieces.performance_id = performance.id\n' +
			'AND performance.id = ' +
			id;

		const result = await connection.query(querySQL);
		connection.release();
		return result;
	} catch (error) {
		console.error('Error executing queryMusicalPieceByPerformanceId', error);
		throw error;
	}
}

export async function queryPerformanceDetailsById(id: number) {
	try {
		const connection = await pool.connect();
		const querySQL =
			'SELECT performance.performer_id, performer.full_name as performer_full_name, \n' +
			'performance.instrument, performer.epoch, accompanist.full_name as accompanist_name, \n' +
			'performance.duration, performance.comment \n' +
			'FROM performance \n' +
			'JOIN performer ON performance.performer_id = performer.id \n' +
			'LEFT JOIN accompanist ON performance.accompanist_id = accompanist.id \n' +
			'WHERE performance.id = ' +
			id;
		const result = await connection.query(querySQL);
		connection.release();
		return result;
	} catch (error) {
		console.error('Error executing queryPerformanceDetailsById', error);
		throw error;
	}
}

export async function searchContributor(composer_name: string, role: string) {
	try {
		const connection = await pool.connect();
		const normalizedRole = normalizeContributorRole(role);

		const searchSQL =
			'SELECT id, full_name, years_active, role, notes ' +
			'FROM contributor ' +
			"WHERE (full_name = '" +
			composer_name +
			"' OR LOWER(notes) = '" +
			composer_name.toLowerCase() +
			"') " +
			"AND role = '" +
			normalizedRole +
			"'";

		const result = await connection.query(searchSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function searchAccompanist(accompanist: string) {
	try {
		const connection = await pool.connect();

		const searchSQL =
			'SELECT id, full_name ' +
			'FROM accompanist ' +
			"WHERE LOWER(full_name) = '" +
			accompanist.toLowerCase() +
			"'";

		const result = await connection.query(searchSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function searchPerformer(full_name: string, email: string | null, instrument: string) {
	try {
		const connection = await pool.connect();

		let searchSQL =
			'SELECT id, full_name, epoch, email, phone, instrument ' +
			'FROM performer ' +
			"WHERE (LOWER(full_name) = '" +
			full_name.toLowerCase() +
			"' AND instrument = '" +
			instrument +
			"') ";
		if (email != null) {
			searchSQL = searchSQL + " OR (LOWER(email) = '" + email.toLowerCase() + "')";
		}

		const result = await connection.query(searchSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function searchMusicalPiece(printed_name: string, first_contributor_id: number) {
	try {
		const connection = await pool.connect();

		const searchSQL =
			'SELECT id, printed_name, first_contributor_id, all_movements, second_contributor_id, third_contributor_id, imslp_url, comments, flag_for_discussion, discussion_notes, is_not_appropriate, updated_at ' +
			'FROM musical_piece ' +
			"WHERE LOWER(printed_name) = '" +
			printed_name.toLowerCase().replaceAll("'", "''").trim() +
			"' AND first_contributor_id = " +
			first_contributor_id;

		const result = await connection.query(searchSQL);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function searchPerformanceByPerformerAndClass(
	performer_id: number,
	class_name: string,
	concert_series: string,
	year: number
) {
	try {
		const connection = await pool.connect();

		const searchSQL = `
			SELECT
				p.id,
				perf.full_name AS performer_name,
				mp.printed_name AS musical_piece_printed_name,
				p.performer_id,
				p.performance_order,
				p.class_name,
				p.concert_series,
				p.year,
				p.duration,
				p.accompanist_id,
				p.comment,
				p.instrument,
				p.warm_up_room_name,
				p.warm_up_room_start,
				p.warm_up_room_end
			FROM performance p
			JOIN performer perf ON p.performer_id = perf.id
			JOIN adjudicated_pieces pp ON p.id = pp.performance_id
			JOIN musical_piece mp ON pp.musical_piece_id = mp.id
			WHERE p.performer_id = $1
				AND p.class_name = $2
				AND LOWER(p.concert_series) = LOWER($3)
				AND p.year = $4;
			`;

		const result = await connection.query(searchSQL, [
			performer_id,
			class_name,
			concert_series,
			year
		]);

		// Release the connection back to the pool
		connection.release();

		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function selectPerformanceLottery(year: number) {
	try {
		const connection = await pool.connect();

		const searchSQL =
			'SELECT class_lottery.lottery as lookupCode, \n' +
			'performer.full_name as fullName, \n' +
			'performer.epoch,  \n' +
			'performer.instrument, \n' +
			'contributor.full_name as composer, \n' +
			'MAX(CASE WHEN schedule_slot_choice.rank = 1 THEN concert_times.start_time END) as first_choice_time \n' +
			'FROM class_lottery \n' +
			'JOIN performance ON performance.class_name = class_lottery.class_name \n' +
			'JOIN performer ON performer.id = performance.performer_id \n' +
			'JOIN adjudicated_pieces ON performance.id = adjudicated_pieces.performance_id \n' +
			'JOIN musical_piece ON musical_piece.id = adjudicated_pieces.musical_piece_id \n' +
			'JOIN contributor ON musical_piece.first_contributor_id = contributor.id \n' +
			'LEFT JOIN schedule_slot_choice \n' +
			'  ON schedule_slot_choice.performer_id = performer.id \n' +
			' AND schedule_slot_choice.year = performance.year \n' +
			' AND schedule_slot_choice.concert_series = performance.concert_series \n' +
			'LEFT JOIN concert_times ON concert_times.id = schedule_slot_choice.slot_id \n' +
			'WHERE performance.year = ' +
			year +
			' \n' +
			'GROUP BY class_lottery.lottery, performer.full_name, performer.epoch, performer.instrument, contributor.full_name \n' +
			'ORDER BY class_lottery.lottery';

		const result = await connection.query(searchSQL);
		connection.release();
		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function retrievePerformanceByLottery(year: number) {
	try {
		const connection = await pool.connect();

		const querySQL =
			'SELECT performance.id, performance.performer_id, performance.performance_order, \n' +
			'performance.concert_series, performance.year, performance.chair_override, \n' +
			'class_lottery.lottery as lookup_code, \n' +
			'class_lottery.lottery, \n' +
			'ARRAY_AGG(concert_times.id ORDER BY schedule_slot_choice.rank) \n' +
			'    FILTER (WHERE schedule_slot_choice.rank IS NOT NULL AND schedule_slot_choice.not_available = false) as ranked_slot_ids \n' +
			'FROM performance \n' +
			'JOIN class_lottery ON class_lottery.class_name = performance.class_name \n' +
			'LEFT JOIN schedule_slot_choice \n' +
			'  ON schedule_slot_choice.performer_id = performance.performer_id\n' +
			' AND schedule_slot_choice.year = performance.year\n' +
			' AND schedule_slot_choice.concert_series = performance.concert_series\n' +
			'LEFT JOIN concert_times ON concert_times.id = schedule_slot_choice.slot_id \n' +
			'WHERE performance.year = $1 \n' +
			'GROUP BY performance.id, performance.performer_id, performance.performance_order, \n' +
			'performance.concert_series, performance.year, performance.chair_override, class_lottery.lottery \n' +
			'ORDER BY performance.concert_series, class_lottery.lottery';

		const result = await connection.query(querySQL, [year]);

		connection.release();
		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function updateProgramOrder(id: number, concertSeries: string, order: number) {
	try {
		const connection = await pool.connect();

		const updateSQL =
			'UPDATE performance \n' +
			'SET performance_order = ' +
			order +
			', \n' +
			"concert_series = '" +
			concertSeries +
			"' \n" +
			'WHERE id = ' +
			id +
			' \n';

		const result = await connection.query(updateSQL);

		connection.release();
		return result;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function movePerformanceByChair(id: number, concertSeries: string) {
	// moving in and out of waitlist
	try {
		const connection = await pool.connect();

		const updateSQL =
			'UPDATE performance \n' +
			"SET concert_series = '" +
			concertSeries +
			"' \n" +
			'WHERE id = ' +
			id +
			' \n';

		await connection.query(updateSQL);

		connection.release();
		return true;
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}
