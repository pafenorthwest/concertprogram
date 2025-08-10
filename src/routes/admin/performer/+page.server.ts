//import pg from 'pg';
import { deleteById, queryTable } from '$lib/server/db';
import {
	calcEpochAge,
	formatFieldNames,
	type PerformerInterface,
	selectInstrument
} from '$lib/server/common';
import { createPerformer } from '$lib/server/performer';

//const { QueryArrayResult } = pg;

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	const isAuthenticated = !!pafeAuth;

	const res = await queryTable('performer');
	const columnNames: string[] = res.fields.map((record) =>
		record.name === 'epoch' ? 'Age' : formatFieldNames(record.name)
	);
	return { performers: res.rows, performer_fields: columnNames, isAuthenticated: isAuthenticated };
}

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('performerId');
		const rowCount = await deleteById('performer', id);

		if (rowCount != null && rowCount > 0) {
			return { status: 200, body: { message: 'Delete successful' } };
		} else {
			return { status: 500, body: { message: 'Delete failed' } };
		}
	},
	add: async ({ request }) => {
		const formData = await request.formData();
		const instrument = selectInstrument(formData.get('instrument'));
		const birthYear: number = calcEpochAge(parseInt(formData.get('age'), 10));
		if (instrument == null || birthYear == null) {
			return { status: 400, body: { message: 'Bad Instrument or Age Value' } };
		}
		const performer: PerformerInterface = {
			id: null,
			full_name: formData.get('fullName'),
			epoch: birthYear,
			instrument: instrument!,
			email: formData.get('email'),
			phone: formData.get('phone')
		};

		if (!performer.full_name || !performer.instrument) {
			return { status: 400, body: { message: 'Missing Field, Try Again' } };
		} else {
			const new_id = await createPerformer(performer);
			if (new_id != null) {
				return { status: 200, body: { message: 'Insert successful' } };
			} else {
				return { status: 500, body: { message: 'Insert failed' } };
			}
		}
	}
};
