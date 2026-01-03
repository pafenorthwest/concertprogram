import { pool } from '$lib/server/db';
import type { AuthRole } from '$lib/server/session';
import { fail, redirect } from '@sveltejs/kit';

const VALID_ROLES: AuthRole[] = ['Admin', 'ConcertMaster', 'MusicEditor', 'DivisionChair'];

function requireAdmin(locals: App.Locals) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	if (locals.user.role !== 'Admin') {
		throw redirect(303, '/landing?unauthorized=1');
	}
}

function normalizeEmail(email: unknown): string {
	return (typeof email === 'string' ? email : '').trim().toLowerCase();
}

function validateRole(role: unknown): role is AuthRole {
	return typeof role === 'string' && VALID_ROLES.includes(role as AuthRole);
}

export const load = async ({ locals }) => {
	requireAdmin(locals);

	const client = await pool.connect();
	try {
		const result = await client.query<{ id: number; email: string; role: AuthRole }>(
			`SELECT id, email, role
			 FROM authorized_user
			 ORDER BY email ASC`
		);

		return {
			users: result.rows,
			roles: VALID_ROLES
		};
	} finally {
		client.release();
	}
};

export const actions = {
	create: async ({ request, locals }) => {
		requireAdmin(locals);
		const formData = await request.formData();
		const email = normalizeEmail(formData.get('email'));
		const role = formData.get('role');

		if (!email) {
			return fail(400, { message: 'Email is required.' });
		}
		if (!validateRole(role)) {
			return fail(400, { message: 'Invalid role.' });
		}

		const client = await pool.connect();
		try {
			const result = await client.query(
				`INSERT INTO authorized_user (email, role)
				 VALUES ($1, $2)
				 ON CONFLICT (email) DO NOTHING
				 RETURNING id`,
				[email, role]
			);

			if (result.rowCount === 0) {
				return fail(400, { message: 'Email already exists.' });
			}

			return { success: true };
		} finally {
			client.release();
		}
	},
	update: async ({ request, locals }) => {
		requireAdmin(locals);
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const role = formData.get('role');

		if (!Number.isInteger(id)) {
			return fail(400, { message: 'Invalid id.' });
		}
		if (!validateRole(role)) {
			return fail(400, { message: 'Invalid role.' });
		}

		const client = await pool.connect();
		try {
			const result = await client.query(
				`UPDATE authorized_user
				 SET role = $1
				 WHERE id = $2`,
				[role, id]
			);

			if (result.rowCount === 0) {
				return fail(404, { message: 'User not found.' });
			}

			return { success: true };
		} finally {
			client.release();
		}
	},
	delete: async ({ request, locals }) => {
		requireAdmin(locals);
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id)) {
			return fail(400, { message: 'Invalid id.' });
		}

		const client = await pool.connect();
		try {
			const result = await client.query(
				`DELETE FROM authorized_user
				 WHERE id = $1`,
				[id]
			);

			if (result.rowCount === 0) {
				return fail(404, { message: 'User not found.' });
			}

			return { success: true };
		} finally {
			client.release();
		}
	}
};
