import { pool, queryTable, deleteById, insertTable } from '$lib/server/db';
import { type MusicalPieceInterface, formatFieldNames } from '$lib/server/common.ts';
import { divisionTags, pieceCategories } from '$lib/constants/review';
import {
	isValidDivisionTag,
	isValidPieceCategory,
	setPieceCategories,
	setPieceDivisionTags
} from '$lib/server/review';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	const isAuthenticated = !!pafeAuth;
	const toTagArray = (value: unknown): string[] => {
		if (Array.isArray(value)) {
			return value.filter((item): item is string => typeof item === 'string');
		}
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				return Array.isArray(parsed)
					? parsed.filter((item): item is string => typeof item === 'string')
					: [];
			} catch {
				return [];
			}
		}
		return [];
	};

	const res = await queryTable('musical_piece');
	const categoryResult = await pool.query<{
		musical_piece_id: number;
		tags: unknown;
	}>(`SELECT musical_piece_id, jsonb_agg(DISTINCT category) AS tags
		FROM musical_piece_category_map
		GROUP BY musical_piece_id`);
	const divisionResult = await pool.query<{
		musical_piece_id: number;
		tags: unknown;
	}>(`SELECT musical_piece_id, jsonb_agg(DISTINCT division_tag) AS tags
		FROM musical_piece_division_tag
		GROUP BY musical_piece_id`);
	const categoriesByPiece = new Map<number, string[]>();
	for (const row of categoryResult.rows) {
		categoriesByPiece.set(row.musical_piece_id, toTagArray(row.tags));
	}
	const divisionsByPiece = new Map<number, string[]>();
	for (const row of divisionResult.rows) {
		divisionsByPiece.set(row.musical_piece_id, toTagArray(row.tags));
	}
	const musicalPieces = res.rows.map((piece) => {
		const categoryTags = (categoriesByPiece.get(piece.id) ?? []).slice().sort();
		const divisionTagValues = (divisionsByPiece.get(piece.id) ?? []).slice().sort();
		return {
			...piece,
			category_tags: categoryTags,
			division_tags: divisionTagValues,
			category_tag: categoryTags[0] ?? null,
			division_tag: divisionTagValues[0] ?? null
		};
	});
	const columnNames: string[] = res.fields.map((record) => formatFieldNames(record.name));
	return {
		musicalPieces,
		musical_piece_fields: columnNames,
		isAuthenticated: isAuthenticated,
		categoryOptions: pieceCategories,
		divisionOptions: divisionTags
	};
}

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const idValue = formData.get('musicalPieceId');
		const id = idValue ? parseInt(idValue as string, 10) : NaN;
		const rowCount = await deleteById('musical_piece', id);

		if (rowCount != null && rowCount > 0) {
			return { status: 200, body: { message: 'Delete successful' } };
		} else {
			return { status: 500, body: { message: 'Delete failed' } };
		}
	},
	add: async ({ request }) => {
		const formData = await request.formData();
		const toNullableString = (value: FormDataEntryValue | null) => {
			if (value == null) return null;
			const strValue = (value as string).trim();
			return strValue.length ? strValue : null;
		};
		const toNullableNumber = (value: FormDataEntryValue | null) => {
			if (value == null) return null;
			const parsed = parseInt(value as string, 10);
			return Number.isNaN(parsed) ? null : parsed;
		};
		const musicalPiece: MusicalPieceInterface = {
			id: null,
			printed_name: (formData.get('printedName') as string) ?? '',
			first_contributor_id: parseInt(formData.get('firstComposerId') as string, 10),
			all_movements: toNullableString(formData.get('allMovements')),
			second_contributor_id: toNullableNumber(formData.get('secondComposerId')),
			third_contributor_id: toNullableNumber(formData.get('thirdComposerId')),
			imslp_url: toNullableString(formData.get('imslpUrl')),
			comments: toNullableString(formData.get('comments')),
			flag_for_discussion: formData.get('flagForDiscussion') === 'on',
			discussion_notes: toNullableString(formData.get('discussionNotes')),
			is_not_appropriate: formData.get('isNotAppropriate') === 'on'
		};
		const rawCategoryTag = toNullableString(formData.get('categoryTag'));
		const rawDivisionTag = toNullableString(formData.get('divisionTag'));

		if (
			!musicalPiece.printed_name ||
			Number.isNaN(musicalPiece.first_contributor_id) ||
			musicalPiece.first_contributor_id == null
		) {
			return { status: 400, body: { message: 'Missing Field, Try Again' } };
		}
		if (rawCategoryTag && !isValidPieceCategory(rawCategoryTag)) {
			return { status: 400, body: { message: 'Invalid category tag' } };
		}
		if (rawDivisionTag && !isValidDivisionTag(rawDivisionTag)) {
			return { status: 400, body: { message: 'Invalid division tag' } };
		} else {
			const result = await insertTable('musical_piece', musicalPiece);
			if (result.rowCount != null && result.rowCount > 0) {
				const newId = result.rows[0].id as number;
				if (rawCategoryTag) {
					await setPieceCategories(newId, [rawCategoryTag]);
				}
				if (rawDivisionTag) {
					await setPieceDivisionTags(newId, [rawDivisionTag]);
				}
				return { status: 200, body: { message: 'Insert successful' } };
			} else {
				return { status: 500, body: { message: 'Insert failed' } };
			}
		}
	}
};
