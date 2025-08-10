import { queryTable, deleteClassLottery, insertClassLottery } from '$lib/server/db';
import { type ClassLotteryInterface, formatFieldNames } from '$lib/server/common';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	const isAuthenticated = !!pafeAuth;

	const res = await queryTable('class_lottery');
	const columnNames: string[] = res.fields.map((record) => formatFieldNames(record.name));
	return {
		classLottery: res.rows,
		class_lottery_fields: columnNames,
		isAuthenticated: isAuthenticated
	};
}

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const class_name = formData.get('class');
		if (class_name != null) {
			const res = await deleteClassLottery(class_name.toString());

			if (res.rowCount != null && res.rowCount > 0) {
				return { status: 200, body: { message: 'Delete successful' } };
			} else {
				return { status: 500, body: { message: 'Delete failed' } };
			}
		}
	},
	add: async ({ request }) => {
		const formData = await request.formData();
		const classLottery: ClassLotteryInterface = {
			class_name: formData.get('class'),
			lottery: formData.get('lottery')
		};

		if (!classLottery.class_name || !classLottery.lottery) {
			return { status: 400, body: { message: 'Missing Field, Try Again' } };
		} else {
			const result = await insertClassLottery(classLottery.class_name, classLottery.lottery);
			if (result.rowCount != null && result.rowCount > 0) {
				return { status: 200, body: { message: 'Insert successful' } };
			} else {
				return { status: 500, body: { message: 'Insert failed' } };
			}
		}
	}
};
