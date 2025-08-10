import pg from 'pg';
const { QueryArrayResult } = pg;
import { queryTable, deleteById, insertTable } from '$lib/server/db';
import { type AccompanistInterface, formatFieldNames } from '$lib/server/common';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	const isAuthenticated = !!pafeAuth;

	const res = await queryTable('accompanist');
	const columnNames: string[] = res.fields.map((record) => formatFieldNames(record.name));
	return {
		accompanist: res.rows,
		accompanist_fields: columnNames,
		isAuthenticated: isAuthenticated
	};
}

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('accompanistId');
		const rowCount = await deleteById('accompanist', id);

		if (rowCount != null && rowCount > 0) {
			return { status: 200, body: { message: 'Delete successful' } };
		} else {
			return { status: 500, body: { message: 'Delete failed' } };
		}
	},
	add: async ({ request }) => {
		const formData = await request.formData();

		const accompanist: AccompanistInterface = {
			id: null,
			full_name: formData.get('fullName')
		};

		if (!accompanist.full_name) {
			return { status: 400, body: { message: 'Missing Field, Try Again' } };
		} else {
			const result = await insertTable('accompanist', accompanist);
			if (result.rowCount != null && result.rowCount > 0) {
				return { status: 200, body: { message: 'Insert successful' } };
			} else {
				return { status: 500, body: { message: 'Insert failed' } };
			}
		}
	}
};
