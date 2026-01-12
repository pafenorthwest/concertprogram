import type { MusicalPieceInterface } from '$lib/server/common';
import { insertTable } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import {
	parseDivisionTags,
	parsePieceCategories,
	setPieceCategories,
	setPieceDivisionTags
} from '$lib/server/review';

export async function POST({ url, request, cookies }) {
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
		if (body.rm_division_tags !== undefined || body.rm_category_tags !== undefined) {
			return json(
				{ status: 'error', reason: 'Tag removal is only supported on update' },
				{ status: 400 }
			);
		}
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
		const { tags: divisionTags, invalid: divisionInvalid } = parseDivisionTags(body.division_tags);
		const { tags: categoryTags, invalid: categoryInvalid } = parsePieceCategories(
			body.category_tags
		);
		const shouldApplyDivisionTags = body.division_tags !== undefined && divisionTags.length > 0;
		const shouldApplyCategoryTags = body.category_tags !== undefined && categoryTags.length > 0;

		const musicalPiece: MusicalPieceInterface = {
			id: null,
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

		if (divisionInvalid.length > 0 || categoryInvalid.length > 0) {
			return json({ status: 'error', reason: 'Invalid tag values' }, { status: 400 });
		}
		if (categoryTags.includes('Not Appropriate') && categoryTags.length > 1) {
			return json(
				{ status: 'error', reason: 'Not Appropriate cannot be combined with other categories' },
				{ status: 400 }
			);
		}
		if (!musicalPiece.printed_name || Number.isNaN(firstContributorId)) {
			return json({ status: 'error', reason: 'Missing Fields' }, { status: 400 });
		} else {
			const result = await insertTable('musical_piece', musicalPiece);
			if (result.rowCount != null && result.rowCount > 0) {
				const newId = result.rows[0].id as number;
				if (shouldApplyDivisionTags) {
					await setPieceDivisionTags(newId, divisionTags);
				}
				if (shouldApplyCategoryTags) {
					await setPieceCategories(newId, categoryTags);
				}
				return json({ id: result.rows[0].id, message: 'Update successful' }, { status: 201 });
			} else {
				return json({ status: 'error', reason: 'Insert Failed' }, { status: 500 });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
