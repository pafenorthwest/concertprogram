import { queryTable, deleteById, insertTable } from '$lib/server/db';
import { type MusicalPieceInterface, formatFieldNames } from '$lib/server/common.ts';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	const isAuthenticated = !!pafeAuth;

	const res = await queryTable('musical_piece');
	const columnNames: string[] = res.fields.map((record) => formatFieldNames(record.name));
	return {
		musicalPieces: res.rows,
		musical_piece_fields: columnNames,
		isAuthenticated: isAuthenticated
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

		if (
			!musicalPiece.printed_name ||
			Number.isNaN(musicalPiece.first_contributor_id) ||
			musicalPiece.first_contributor_id == null
		) {
			return { status: 400, body: { message: 'Missing Field, Try Again' } };
		} else {
			const result = await insertTable('musical_piece', musicalPiece);
			if (result.rowCount != null && result.rowCount > 0) {
				return { status: 200, body: { message: 'Insert successful' } };
			} else {
				return { status: 500, body: { message: 'Insert failed' } };
			}
		}
	}
};
