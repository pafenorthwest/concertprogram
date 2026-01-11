import { pool } from '$lib/server/db';
import {
	divisionTags,
	pieceCategories,
	type DivisionTag,
	type PieceCategory
} from '$lib/constants/review';
import { isNonEmptyString } from '$lib/server/common';

export interface ReviewQueueItem {
	id: number;
	printed_name: string;
	all_movements: string | null;
	first_contributor_id: number;
	first_contributor_name: string | null;
	second_contributor_id: number | null;
	third_contributor_id: number | null;
	imslp_url: string | null;
	comments: string | null;
	flag_for_discussion: boolean;
	discussion_notes: string | null;
	is_not_appropriate: boolean;
	updated_at: string;
	categories: PieceCategory[];
	division_tags: DivisionTag[];
	is_untagged: boolean;
}

export function isValidDivisionTag(value: unknown): value is DivisionTag {
	return typeof value === 'string' && divisionTags.includes(value as DivisionTag);
}

export function isValidPieceCategory(value: unknown): value is PieceCategory {
	return typeof value === 'string' && pieceCategories.includes(value as PieceCategory);
}

function normalizeTagStrings(values: string[]): string[] {
	return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function dedupeStrings(values: string[]): string[] {
	return Array.from(new Set(values));
}

export function parseDivisionTags(input: unknown): {
	tags: DivisionTag[];
	invalid: string[];
} {
	const parsed = parseTagInputs(input);
	const values = dedupeStrings(normalizeTagStrings(parsed.strings));
	const tags = values.filter(isValidDivisionTag);
	const invalid = parsed.invalid.concat(values.filter((value) => !isValidDivisionTag(value)));
	return { tags, invalid };
}

export function parsePieceCategories(input: unknown): {
	tags: PieceCategory[];
	invalid: string[];
} {
	const parsed = parseTagInputs(input);
	const values = dedupeStrings(normalizeTagStrings(parsed.strings));
	const tags = values.filter(isValidPieceCategory);
	const invalid = parsed.invalid.concat(values.filter((value) => !isValidPieceCategory(value)));
	return { tags, invalid };
}

export function normalizePieceCategories(categories: PieceCategory[]): PieceCategory[] {
	if (categories.includes('Not Appropriate')) {
		return ['Not Appropriate'];
	}
	return categories;
}

export async function getAuthorizedUserId(email: string): Promise<number | null> {
	const client = await pool.connect();
	try {
		const result = await client.query<{ id: number }>(
			`SELECT id FROM authorized_user WHERE email = $1`,
			[email.toLowerCase()]
		);
		if (result.rowCount && result.rowCount > 0) {
			return result.rows[0].id;
		}
		return null;
	} finally {
		client.release();
	}
}

function asStringArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((v): v is string => typeof v === 'string');
	}
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
		} catch {
			return [];
		}
	}
	return [];
}

function describeInvalidTag(value: unknown): string {
	try {
		const serialized = JSON.stringify(value);
		if (serialized !== undefined) {
			return serialized;
		}
	} catch {
		// Fall back to string coercion for non-serializable values.
	}
	return String(value);
}

function parseTagInputs(value: unknown): { strings: string[]; invalid: string[] } {
	const strings: string[] = [];
	const invalid: string[] = [];
	const collect = (entry: unknown) => {
		if (typeof entry === 'string') {
			strings.push(entry);
		} else {
			invalid.push(describeInvalidTag(entry));
		}
	};

	if (Array.isArray(value)) {
		value.forEach(collect);
		return { strings, invalid };
	}

	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				parsed.forEach(collect);
				return { strings, invalid };
			}
		} catch {
			return { strings, invalid };
		}
	}

	return { strings, invalid };
}

export async function fetchReviewQueue(
	reviewerId: number,
	divisionTag: DivisionTag
): Promise<ReviewQueueItem[]> {
	const client = await pool.connect();
	try {
		const result = await client.query<ReviewQueueItem>(
			`SELECT
				mp.id,
				mp.printed_name,
				mp.all_movements,
				mp.first_contributor_id,
				First.full_name AS first_contributor_name,
				mp.second_contributor_id,
				mp.third_contributor_id,
				mp.imslp_url,
				mp.comments,
				mp.flag_for_discussion,
				mp.discussion_notes,
				mp.is_not_appropriate,
				mp.updated_at,
				COALESCE(
				jsonb_agg(DISTINCT mpcm.category) FILTER (WHERE mpcm.category IS NOT NULL),
				'[]'::jsonb
				) AS categories,
				COALESCE(
				jsonb_agg(DISTINCT mpdt.division_tag) FILTER (WHERE mpdt.division_tag IS NOT NULL),
				'[]'::jsonb
				) AS division_tags,
				CASE WHEN tag_count.tag_total IS NULL THEN TRUE ELSE FALSE END AS is_untagged
			FROM musical_piece mp
			LEFT JOIN contributor First
				ON First.id = mp.first_contributor_id
			LEFT JOIN musical_piece_category_map mpcm
				ON mpcm.musical_piece_id = mp.id
			LEFT JOIN musical_piece_division_tag mpdt
				ON mpdt.musical_piece_id = mp.id
			LEFT JOIN (
				SELECT musical_piece_id, COUNT(*) AS tag_total
				FROM musical_piece_division_tag
				GROUP BY musical_piece_id
			) tag_count
				ON tag_count.musical_piece_id = mp.id
			WHERE
				(
					EXISTS (
						SELECT 1 FROM musical_piece_division_tag tagged
						WHERE tagged.musical_piece_id = mp.id
						  AND tagged.division_tag = $2
					)
					OR NOT EXISTS (
						SELECT 1 FROM musical_piece_division_tag tagged
						WHERE tagged.musical_piece_id = mp.id
					)
				)
				AND NOT EXISTS (
					SELECT 1 FROM musical_piece_review mpr
					WHERE mpr.musical_piece_id = mp.id
					  AND mpr.reviewer_id = $1
					  AND mpr.status = 'Complete'
				)
			GROUP BY mp.id, First.full_name, tag_count.tag_total
			ORDER BY mp.printed_name ASC`,
			[reviewerId, divisionTag]
		);
		return result.rows.map((row) => ({
			...row,
			categories: asStringArray(row.categories).filter(isValidPieceCategory),
			division_tags: asStringArray(row.division_tags).filter(isValidDivisionTag),
			is_untagged: Boolean(row.is_untagged)
		}));
	} finally {
		client.release();
	}
}

export async function updateMusicalPieceReviewMetadata(
	musicalPieceId: number,
	payload: {
		printed_name?: string;
		all_movements?: string | null;
		first_contributor_id?: number;
		second_contributor_id?: number | null;
		third_contributor_id?: number | null;
		imslp_url?: string | null;
		comments?: string | null;
		flag_for_discussion?: boolean;
		discussion_notes?: string | null;
		is_not_appropriate?: boolean;
	}
): Promise<number> {
	const updates: string[] = [];
	const values: Array<string | number | boolean | null> = [];

	function pushUpdate(column: string, value: string | number | boolean | null) {
		values.push(value);
		updates.push(`${column} = $${values.length}`);
	}

	if (isNonEmptyString(payload.printed_name)) {
		pushUpdate('printed_name', payload.printed_name.trim());
	}
	if (payload.all_movements !== undefined) {
		pushUpdate('all_movements', payload.all_movements);
	}
	if (typeof payload.first_contributor_id === 'number') {
		pushUpdate('first_contributor_id', payload.first_contributor_id);
	}
	if (payload.second_contributor_id !== undefined) {
		pushUpdate('second_contributor_id', payload.second_contributor_id);
	}
	if (payload.third_contributor_id !== undefined) {
		pushUpdate('third_contributor_id', payload.third_contributor_id);
	}
	if (payload.imslp_url !== undefined) {
		pushUpdate('imslp_url', payload.imslp_url);
	}
	if (payload.comments !== undefined) {
		pushUpdate('comments', payload.comments);
	}
	if (payload.flag_for_discussion !== undefined) {
		pushUpdate('flag_for_discussion', payload.flag_for_discussion);
	}
	if (payload.discussion_notes !== undefined) {
		pushUpdate('discussion_notes', payload.discussion_notes);
	}
	if (payload.is_not_appropriate !== undefined) {
		pushUpdate('is_not_appropriate', payload.is_not_appropriate);
	}

	if (updates.length === 0) {
		return 0;
	}

	values.push(musicalPieceId);
	const updateSql = `UPDATE musical_piece SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`;

	const client = await pool.connect();
	try {
		const result = await client.query(updateSql, values);
		return result.rowCount ?? 0;
	} finally {
		client.release();
	}
}

export async function setPieceCategories(
	musicalPieceId: number,
	categories: PieceCategory[]
): Promise<void> {
	const normalized = normalizePieceCategories(categories);
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(`DELETE FROM musical_piece_category_map WHERE musical_piece_id = $1`, [
			musicalPieceId
		]);
		for (const category of normalized) {
			await client.query(
				`INSERT INTO musical_piece_category_map (musical_piece_id, category) VALUES ($1, $2)`,
				[musicalPieceId, category]
			);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

export async function setPieceDivisionTags(
	musicalPieceId: number,
	tags: DivisionTag[]
): Promise<void> {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(`DELETE FROM musical_piece_division_tag WHERE musical_piece_id = $1`, [
			musicalPieceId
		]);
		for (const tag of tags) {
			await client.query(
				`INSERT INTO musical_piece_division_tag (musical_piece_id, division_tag) VALUES ($1, $2)`,
				[musicalPieceId, tag]
			);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

export async function removePieceCategories(
	musicalPieceId: number,
	categories: PieceCategory[]
): Promise<number> {
	if (categories.length === 0) {
		return 0;
	}
	const client = await pool.connect();
	try {
		const result = await client.query(
			`DELETE FROM musical_piece_category_map WHERE musical_piece_id = $1 AND category = ANY($2)`,
			[musicalPieceId, categories]
		);
		return result.rowCount ?? 0;
	} finally {
		client.release();
	}
}

export async function removePieceDivisionTags(
	musicalPieceId: number,
	tags: DivisionTag[]
): Promise<number> {
	if (tags.length === 0) {
		return 0;
	}
	const client = await pool.connect();
	try {
		const result = await client.query(
			`DELETE FROM musical_piece_division_tag WHERE musical_piece_id = $1 AND division_tag = ANY($2)`,
			[musicalPieceId, tags]
		);
		return result.rowCount ?? 0;
	} finally {
		client.release();
	}
}

export async function markReviewComplete(
	musicalPieceId: number,
	reviewerId: number
): Promise<void> {
	const client = await pool.connect();
	try {
		await client.query(
			`INSERT INTO musical_piece_review (musical_piece_id, reviewer_id, status)
			 VALUES ($1, $2, 'Complete')
			 ON CONFLICT (musical_piece_id, reviewer_id)
			 DO UPDATE SET status = 'Complete', updated_at = NOW()`,
			[musicalPieceId, reviewerId]
		);
	} finally {
		client.release();
	}
}
