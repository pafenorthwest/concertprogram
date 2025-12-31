import pkg from 'pg';
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
				fields = 'id, full_name, years_active, role, notes';
				break;
			case 'accompanist':
				fields = 'id, full_name';
				break;
			case 'performer':
				fields = 'id, full_name, email, phone, epoch, instrument';
				break;
			case 'musical_piece':
				fields =
					'id, printed_name, first_contributor_id, all_movements, second_contributor_id, third_contributor_id';
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

export async function lookupByDetails(
	performerLastName: string,
	age: number,
	composer: string
): Promise<PerformerSearchResultsInterface | null> {
	const birthYear = calcEpochAge(age);

	try {
		const connection = await pool.connect();
		// order by Concerto comes first followed by EastSide
		// if you are in the concerto playoff can't also perform in EastSide artists concert
		const searchQuery =
			'SELECT performer.id, performer.full_name as performer_name, \n' +
			'class_lottery.lottery as lottery_code, \n' +
			'musical_piece.printed_name as musical_piece,  performance.concert_series, \n' +
			'performance.id as performance_id, \n' +
			'performance.duration as performance_duration, \n' +
			'performance.comment as performance_comment \n' +
			'FROM performer \n' +
			'JOIN performance ON performance.performer_id = performer.id \n' +
			'JOIN class_lottery ON performance.class_name = class_lottery.class_name \n' +
			'JOIN performance_pieces ON performance_pieces.performance_id = performance.id \n' +
			'JOIN musical_piece ON musical_piece.id = performance_pieces.musical_piece_id \n' +
			'JOIN contributor ON musical_piece.first_contributor_id = contributor.id \n' +
			"WHERE performer.full_name like '%" +
			performerLastName +
			"' \n" +
			"  AND (LOWER(contributor.full_name) LIKE '%" +
			composer.toLowerCase() +
			"' OR LOWER(contributor.notes) = '" +
			composer.toLowerCase() +
			"') \n" +
			'  AND performer.epoch = ' +
			birthYear +
			' \n' +
			'  AND performance.year =' +
			year() +
			' \n' +
			'  ORDER BY performance.concert_series ASC';

		const dbResult = await connection.query(searchQuery);
		connection.release();

		if (dbResult.rowCount != null && dbResult.rowCount > 0) {
			return {
				status: 'OK',
				performer_id: dbResult.rows[0].id,
				performer_name: dbResult.rows[0].performer_name,
				musical_piece: dbResult.rows[0].musical_piece,
				lottery_code: dbResult.rows[0].lottery_code,
				concert_series: dbResult.rows[0].concert_series,
				performance_id: dbResult.rows[0].performance_id,
				performance_duration: dbResult.rows[0].performance_duration,
				performance_comment: dbResult.rows[0].performance_comment
			};
		} else {
			return null;
		}
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
	}
}

export async function lookupByCode(code: string): Promise<PerformerSearchResultsInterface | null> {
	try {
		const connection = await pool.connect();
		// order by Concerto comes first followed by EastSide
		// if you are in the concerto playoff can't also perform in EastSide artists concert
		const searchQuery =
			'SELECT performer.id, performer.full_name as performer_name, \n' +
			'class_lottery.lottery as lottery_code, \n' +
			'musical_piece.printed_name as musical_piece, performance.concert_series, \n' +
			'performance.id as performance_id, \n' +
			'performance.duration as performance_duration, \n' +
			'performance.comment as performance_comment \n' +
			'FROM performer \n' +
			'JOIN performance ON performance.performer_id = performer.id \n' +
			'JOIN class_lottery on performance.class_name = class_lottery.class_name \n' +
			'JOIN performance_pieces ON performance_pieces.performance_id = performance.id \n' +
			'JOIN musical_piece ON musical_piece.id = performance_pieces.musical_piece_id \n' +
			'WHERE class_lottery.lottery = ' +
			code +
			' \n' +
			'  AND performance.year =' +
			year() +
			' \n' +
			'  ORDER BY performance.concert_series ASC';

		const dbResult = await connection.query(searchQuery);
		connection.release();

		if (dbResult.rowCount != null && dbResult.rowCount > 0) {
			return {
				status: 'OK',
				performer_id: dbResult.rows[0].id,
				performer_name: dbResult.rows[0].performer_name,
				musical_piece: dbResult.rows[0].musical_piece,
				lottery_code: dbResult.rows[0].lottery_code,
				concert_series: dbResult.rows[0].concert_series,
				performance_id: dbResult.rows[0].performance_id,
				performance_duration: dbResult.rows[0].performance_duration,
				performance_comment: dbResult.rows[0].performance_comment
			};
		} else {
			return null;
		}
	} catch (error) {
		console.error('Error executing query:', error);
		throw error;
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
				inputCols = '(printed_name, first_contributor_id)';
				inputVals =
					"('" +
					(data as MusicalPieceInterface).printed_name.replaceAll("'", "''").trim() +
					"', '" +
					(data as MusicalPieceInterface).first_contributor_id +
					"')";
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
				if (isNonEmptyString((data as MusicalPieceInterface).second_contributor_id)) {
					inputCols = inputCols.slice(0, -1) + ', second_contributor_id)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).second_contributor_id +
						"')";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).third_contributor_id)) {
					inputCols = inputCols.slice(0, -1) + ', third_contributor_id)';
					inputVals =
						inputVals.slice(0, -1) +
						", '" +
						(data as MusicalPieceInterface).third_contributor_id +
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

		let cols = 'performer_id, concert_series, class_name, year, instrument';
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
			"'";

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

		let setCols =
			'performer_id = ' +
			performer_id +
			", concert_series = '" +
			data.concert_series +
			", class_name = '" +
			data.class +
			', year = ' +
			data.year +
			", instrument = '" +
			data.instrument;

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
				break;
			}
			case 'accompanist':
				// don't wipe out data
				if (!isNonEmptyString((data as AccompanistInterface).full_name)) {
					return null;
				}
				setCols = "full_name = '" + (data as AccompanistInterface).full_name + "'";
				break;
			case 'performer':
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
			case 'musical_piece':
				// don't wipe out data
				if (
					!isNonEmptyString((data as MusicalPieceInterface).printed_name) &&
					!isNonEmptyString((data as MusicalPieceInterface).first_contributor_id)
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
				if (isNonEmptyString((data as MusicalPieceInterface).second_contributor_id)) {
					setCols =
						setCols +
						", second_contributor_id = '" +
						(data as MusicalPieceInterface).second_contributor_id +
						"' ";
				}
				if (isNonEmptyString((data as MusicalPieceInterface).third_contributor_id)) {
					setCols =
						setCols +
						", third_contributor_id = '" +
						(data as MusicalPieceInterface).third_contributor_id +
						"' ";
				}
				break;
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

		let insertSQL = 'INSERT INTO performance_pieces ';
		if (performancePieceMap.movement != null) {
			insertSQL = insertSQL + '(performance_id, musical_piece_id, movement) ';
			insertSQL =
				insertSQL +
				'VALUES (' +
				performancePieceMap.performance_id +
				', ' +
				performancePieceMap.musical_piece_id +
				", '" +
				performancePieceMap.movement +
				"' )";
		} else {
			insertSQL = insertSQL + '(performance_id, musical_piece_id) ';
			insertSQL =
				insertSQL +
				'VALUES (' +
				performancePieceMap.performance_id +
				', ' +
				performancePieceMap.musical_piece_id +
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
			'DELETE FROM performance_pieces where performance_id = ' + performancePieceMap.performance_id;

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

		const deleteSQL = 'DELETE FROM performance_pieces where performance_id = ' + performance_id;
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
			'            performance_pieces.movement,\n' +
			'            First.full_name AS composer, First.years_active AS composer_years_active,\n' +
			'            Second.full_name AS composer2, Second.years_active AS composer2_years_active,\n' +
			'            Third.full_name AS composer3, Third.years_active AS composer3_years_active,\n' +
			'            accompanist.full_name AS accompanist,\n' +
			'            performance.duration, performance.comment, performance.instrument,\n' +
			'            performance.performance_order, performance.concert_series, performance.year\n';
		const joins =
			' JOIN performance_pieces ON performance.id = performance_pieces.performance_id\n' +
			'        JOIN musical_piece ON performance_pieces.musical_piece_id = musical_piece.id\n' +
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
			'SELECT performance.id, musical_piece.printed_name, performance_pieces.movement, \n' +
			'one.full_name as composer_one_name, one.years_active as composer_one_years, \n' +
			'two.full_name as composer_two_name, two.years_active as composer_two_years, \n' +
			'three.full_name as composer_three_name, three.years_active as composer_three_years \n' +
			'FROM musical_piece\n' +
			'JOIN performance_pieces ON musical_piece.id = performance_pieces.musical_piece_id\n' +
			'JOIN contributor one ON one.id = musical_piece.first_contributor_id\n' +
			'LEFT JOIN contributor two ON two.id = musical_piece.second_contributor_id\n' +
			'LEFT JOIN contributor three ON three.id = musical_piece.third_contributor_id\n' +
			'JOIN performance ON performance_pieces.performance_id = performance.id\n' +
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
			'SELECT id, printed_name, first_contributor_id, all_movements, second_contributor_id, third_contributor_id ' +
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

export async function searchPerformanceByPerformer(
	performer_id: number,
	concert_series: string,
	year: number
) {
	try {
		const connection = await pool.connect();

		const searchSQL =
			'SELECT performance.id, performer.full_name as performer_name, \n' +
			'musical_piece.printed_name as musical_piece_printed_name, \n' +
			'performance.performer_id, performance.performance_order, \n' +
			'performance.concert_series, performance.year, performance.duration, performance.accompanist_id, \n' +
			'performance.comment, performance.instrument, warm_up_room_name, warm_up_room_start, warm_up_room_end \n' +
			'FROM performance \n' +
			'JOIN performance_pieces ON performance.id = performance_pieces.performance_id \n' +
			'JOIN musical_piece ON performance_pieces.musical_piece_id = musical_piece.id \n' +
			'JOIN performer ON performance.performer_id = performer.id \n' +
			'WHERE performer_id = ' +
			performer_id +
			'\n   ' +
			"    AND LOWER(concert_series) = '" +
			concert_series.toLowerCase() +
			"' \n" +
			'    AND year = ' +
			year;

		const result = await connection.query(searchSQL);

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
			'JOIN performance_pieces ON performance.id = performance_pieces.performance_id \n' +
			'JOIN musical_piece ON musical_piece.id = performance_pieces.musical_piece_id \n' +
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
			'performance.concert_series, performance.year, class_lottery.lottery as lookup_code, \n' +
			'class_lottery.lottery, \n' +
			'ARRAY_AGG(concert_times.concert_number_in_series ORDER BY schedule_slot_choice.rank) \n' +
			'    FILTER (WHERE schedule_slot_choice.rank IS NOT NULL) as ranked_slots \n' +
			'FROM performance \n' +
			'JOIN class_lottery ON class_lottery.class_name = performance.class_name \n' +
			'LEFT JOIN schedule_slot_choice \n' +
			'  ON schedule_slot_choice.performer_id = performance.performer_id\n' +
			' AND schedule_slot_choice.year = performance.year\n' +
			' AND schedule_slot_choice.concert_series = performance.concert_series\n' +
			'LEFT JOIN concert_times ON concert_times.id = schedule_slot_choice.slot_id \n' +
			'WHERE performance.year = ' +
			year +
			'\n' +
			'GROUP BY performance.id, performance.performer_id, performance.performance_order, \n' +
			'performance.concert_series, performance.year, class_lottery.lottery \n' +
			'ORDER BY performance.concert_series, class_lottery.lottery';

		const result = await connection.query(querySQL);

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
