import { type MusicalPieceInterface } from '$lib/server/common';
import { deleteById, queryTable, updateById } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import {
	parseDivisionTags,
	parsePieceCategories,
	removePieceCategories,
	removePieceDivisionTags,
	setPieceCategories,
	setPieceDivisionTags
} from '$lib/server/review';

export async function GET({ params }) {
	try {
		const res = await queryTable('musical_piece', params.id);
		if (res.rowCount != 1) {
			return json({ status: 'error', message: 'Not Found' }, { status: 404 });
		}
		return json(res.rows);
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
export async function PUT({ url, params, request, cookies }) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');
	// The origin of the request (protocol + host + port)
	const origin = request.headers.get('origin');
	const appOrigin = `${url.protocol}//${url.host}`;

	// from local app no checks needed
	if (origin !== appOrigin) {
		if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
		}
	}

	try {
		const body = await request.json();
		const toNullableString = (value: unknown) => {
			if (value === null || value === undefined) return null;
			const trimmed = String(value).trim();
			return trimmed.length ? trimmed : null;
		};
		const toNullableNumber = (value: unknown) => {
			if (value === null || value === undefined || value === '') return null;
			const parsed = Number(value);
			return Number.isNaN(parsed) ? null : parsed;
		};
		const toBoolean = (value: unknown) =>
			value === true || value === 'true' || value === '1' || value === 1 || value === 'on';
		const firstContributorId = Number(body.first_contributor_id);
		const id = Number(params.id);
		const { tags: divisionTags, invalid: divisionInvalid } = parseDivisionTags(body.division_tags);
		const { tags: categoryTags, invalid: categoryInvalid } = parsePieceCategories(
			body.category_tags
		);
		const { tags: rmDivisionTags, invalid: rmDivisionInvalid } = parseDivisionTags(
			body.rm_division_tags
		);
		const { tags: rmCategoryTags, invalid: rmCategoryInvalid } = parsePieceCategories(
			body.rm_category_tags
		);
		const hasAddTags = divisionTags.length > 0 || categoryTags.length > 0;
		const hasRemoveCategory = rmCategoryTags.length > 0;
		const hasRemoveDivision = rmDivisionTags.length > 0;
		const shouldApplyDivisionTags = body.division_tags !== undefined && divisionTags.length > 0;
		const shouldApplyCategoryTags = body.category_tags !== undefined && categoryTags.length > 0;
		const shouldRemoveDivisionTags =
			body.rm_division_tags !== undefined && rmDivisionTags.length > 0;
		const shouldRemoveCategoryTags =
			body.rm_category_tags !== undefined && rmCategoryTags.length > 0;
		const musicalPiece: MusicalPieceInterface = {
			id: Number.isNaN(id) ? null : id,
			printed_name: body.printed_name,
			first_contributor_id: firstContributorId,
			all_movements: toNullableString(body.all_movements),
			second_contributor_id: toNullableNumber(body.second_contributor_id),
			third_contributor_id: toNullableNumber(body.third_contributor_id),
			imslp_url: toNullableString(body.imslp_url),
			comments: toNullableString(body.comments),
			flag_for_discussion: toBoolean(body.flag_for_discussion),
			discussion_notes: toNullableString(body.discussion_notes),
			is_not_appropriate: toBoolean(body.is_not_appropriate)
		};
		if (
			divisionInvalid.length > 0 ||
			categoryInvalid.length > 0 ||
			rmDivisionInvalid.length > 0 ||
			rmCategoryInvalid.length > 0
		) {
			return json({ status: 'error', reason: 'Invalid tag values' }, { status: 400 });
		}
		if ((hasRemoveCategory || hasRemoveDivision) && hasAddTags) {
			return json(
				{ status: 'error', reason: 'Removal tags cannot be combined with add tags' },
				{ status: 400 }
			);
		}
		if (categoryTags.includes('Not Appropriate') && categoryTags.length > 1) {
			return json(
				{ status: 'error', reason: 'Not Appropriate cannot be combined with other categories' },
				{ status: 400 }
			);
		}
		if (rmCategoryTags.includes('Not Appropriate')) {
			return json(
				{ status: 'error', reason: 'Not Appropriate cannot be removed' },
				{ status: 400 }
			);
		}
		if (!musicalPiece.printed_name || Number.isNaN(firstContributorId) || musicalPiece.id == null) {
			return { status: 400, body: { message: 'Missing Field, Try Again' } };
		} else {
			const rowCount = await updateById('musical_piece', musicalPiece);
			if (rowCount != null && rowCount > 0) {
				if (shouldApplyDivisionTags) {
					await setPieceDivisionTags(musicalPiece.id, divisionTags);
				}
				if (shouldApplyCategoryTags) {
					await setPieceCategories(musicalPiece.id, categoryTags);
				}
				if (shouldRemoveDivisionTags) {
					await removePieceDivisionTags(musicalPiece.id, rmDivisionTags);
				}
				if (shouldRemoveCategoryTags) {
					await removePieceCategories(musicalPiece.id, rmCategoryTags);
				}
				return json({ id: params.id }, { status: 200, body: { message: 'Update successful' } });
			} else {
				return json({ status: 'error', reason: 'Missing Fields', id: params.id }, { status: 500 });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}

export async function DELETE({ url, params, request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth');
	// The origin of the request (protocol + host + port)
	const origin = request.headers.get('origin');
	const appOrigin = `${url.protocol}//${url.host}`;

	// from local app no checks needed
	if (origin !== appOrigin) {
		if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
		}
	}

	const rowCount = await deleteById('musical_piece', params.id);

	if (rowCount != null && rowCount > 0) {
		return json({ status: 200, body: { message: 'Delete successful' } });
	} else {
		return json({ status: 'error', reason: 'Delete failed' }, { status: 500 });
	}
}
