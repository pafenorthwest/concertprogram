import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { pool } from '$lib/server/db';
import { encodeSession, SESSION_COOKIE_NAME, type AuthRole } from '$lib/server/session';
import { handle } from '../../hooks.server';
import { filterNavItemsForRole, NAV_ITEMS } from '$lib/navigation';
import { normalizeRouteId, roleAllowsRoute } from '$lib/authz';
import * as loginModule from '$lib/server/login';
import { actions as loginActions } from '../../routes/login/+page.server';
import { load as verifyEmailLoad } from '../../routes/verify/email/[code]/+page.server';
import {
	actions as adminUserActions,
	load as adminUsersLoad
} from '../../routes/admin/users/+page.server';

type LoginUserRow = {
	id: number;
	email: string;
	code: number;
	first_login_at: Date | null;
	last_login_at: Date | null;
	last_code_sent_at: Date | null;
};

const testEmails = {
	admin: 'auth-admin@test.concertprogram',
	concertMaster: 'auth-cm@test.concertprogram',
	musicEditor: 'auth-editor@test.concertprogram',
	divisionChair: 'auth-chair@test.concertprogram',
	loginUser: 'auth-login-user@test.concertprogram',
	managedUser: 'auth-managed-user@test.concertprogram',
	normalizationUser: 'NormalizeMe@Test.ConcertProgram',
	duplicateUser: 'duplicate-check@test.concertprogram',
	collisionUserA: 'collision-a@test.concertprogram',
	collisionUserB: 'collision-b@test.concertprogram'
};

let currentTime = new Date('2026-01-01T00:00:00Z').getTime();

function advanceTime(minutes = 2) {
	currentTime += minutes * 60_000;
	vi.setSystemTime(new Date(currentTime));
}

function createMockCookies(initial: Record<string, string> = {}) {
	const jar = new Map<string, string>(Object.entries(initial));
	return {
		get: (name: string) => jar.get(name),
		set: (name: string, value: string) => {
			jar.set(name, value);
		},
		delete: (name: string) => {
			jar.delete(name);
		}
	};
}

async function removeLoginUsers(emails: string[]) {
	const client = await pool.connect();
	try {
		await client.query(`DELETE FROM login_user WHERE email = ANY($1::text[])`, [emails]);
	} finally {
		client.release();
	}
}

async function removeAuthorizedUsers(emails: string[]) {
	const client = await pool.connect();
	try {
		await client.query(`DELETE FROM authorized_user WHERE email = ANY($1::text[])`, [emails]);
	} finally {
		client.release();
	}
}

async function upsertAuthorizedUser(email: string, role: AuthRole) {
	const client = await pool.connect();
	try {
		await client.query(
			`INSERT INTO authorized_user (email, role)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`,
			[email.toLowerCase(), role]
		);
	} finally {
		client.release();
	}
}

async function findAuthorizedUser(email: string) {
	const client = await pool.connect();
	try {
		const result = await client.query<{ id: number; email: string; role: AuthRole }>(
			`SELECT id, email, role FROM authorized_user WHERE email = $1`,
			[email]
		);
		return result.rows[0] ?? null;
	} finally {
		client.release();
	}
}

async function findLoginUser(email: string): Promise<LoginUserRow | null> {
	const client = await pool.connect();
	try {
		const result = await client.query<LoginUserRow>(
			`SELECT id, email, code, first_login_at, last_login_at, last_code_sent_at
       FROM login_user
       WHERE email = $1`,
			[email.toLowerCase()]
		);
		return result.rows[0] ?? null;
	} finally {
		client.release();
	}
}

describe.sequential('Auth and authorization hardening', () => {
	beforeAll(async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(currentTime));
		await removeLoginUsers(Object.values(testEmails));
		await removeAuthorizedUsers(Object.values(testEmails));

		await Promise.all([
			upsertAuthorizedUser(testEmails.admin, 'Admin'),
			upsertAuthorizedUser(testEmails.concertMaster, 'ConcertMaster'),
			upsertAuthorizedUser(testEmails.musicEditor, 'MusicEditor'),
			upsertAuthorizedUser(testEmails.divisionChair, 'DivisionChair'),
			upsertAuthorizedUser(testEmails.loginUser, 'ConcertMaster')
		]);
	});

	afterAll(async () => {
		await removeLoginUsers(Object.values(testEmails));
		await removeAuthorizedUsers(Object.values(testEmails));
		vi.useRealTimers();
	});

	describe('database constraints', () => {
		it('rejects duplicate authorized_user emails', async () => {
			await upsertAuthorizedUser(testEmails.duplicateUser, 'MusicEditor');
			const client = await pool.connect();
			try {
				await expect(
					client.query(`INSERT INTO authorized_user (email, role) VALUES ($1, $2)`, [
						testEmails.duplicateUser,
						'MusicEditor'
					])
				).rejects.toMatchObject({ code: '23505' });
			} finally {
				client.release();
				await removeAuthorizedUsers([testEmails.duplicateUser]);
			}
		});

		it('rejects invalid roles at the database level', async () => {
			const client = await pool.connect();
			try {
				await expect(
					client.query(`INSERT INTO authorized_user (email, role) VALUES ($1, $2)`, [
						'invalid-role@test.concertprogram',
						'NotARole'
					])
				).rejects.toMatchObject({ code: '23514' });
			} finally {
				client.release();
				await removeAuthorizedUsers(['invalid-role@test.concertprogram']);
			}
		});

		it('normalizes login email casing before persisting', async () => {
			const normalizedEmail = testEmails.normalizationUser.toLowerCase();
			await upsertAuthorizedUser(normalizedEmail, 'DivisionChair');
			advanceTime();
			const result = await loginModule.issueLoginCode(testEmails.normalizationUser);
			expect(result.email).toBe(normalizedEmail);

			const loginRow = await findLoginUser(normalizedEmail);
			expect(loginRow?.email).toBe(normalizedEmail);
			await removeLoginUsers([normalizedEmail]);
			await removeAuthorizedUsers([normalizedEmail]);
		});
	});

	describe('login authorization', () => {
		it('returns 401 for unauthorized email submissions', async () => {
			const unauthorizedEmail = 'not-allowed@test.concertprogram';
			const formData = new FormData();
			formData.set('email', unauthorizedEmail);

			const result = await loginActions.login({
				request: new Request('http://localhost/login', { method: 'POST', body: formData }),
				cookies: createMockCookies(),
				url: new URL('http://localhost/login')
			});

			expect((result as { status?: number }).status).toBe(401);
			const loginRow = await findLoginUser(unauthorizedEmail);
			expect(loginRow).toBeNull();
		});

		it('issues a login code for authorized emails and leaves first_login_at unset', async () => {
			const sendSpy = vi.spyOn(loginModule, 'sendVerificationEmail').mockResolvedValue();
			advanceTime();

			const formData = new FormData();
			formData.set('email', testEmails.loginUser);

			const result = await loginActions.login({
				request: new Request('http://localhost/login', { method: 'POST', body: formData }),
				cookies: createMockCookies(),
				url: new URL('http://localhost/login')
			});

			expect((result as { success?: boolean }).success).toBe(true);

			const loginRow = await findLoginUser(testEmails.loginUser);
			expect(loginRow?.email).toBe(testEmails.loginUser);
			expect(loginRow?.first_login_at).toBeNull();
			expect(loginRow?.code).toBeTypeOf('number');
			sendSpy.mockRestore();
		});

		it('sets first_login_at only after verification and creates a session cookie', async () => {
			const existing = await findLoginUser(testEmails.loginUser);
			expect(existing?.code).toBeDefined();

			const cookies = {
				set: vi.fn(),
				get: vi.fn()
			};

			const result = await verifyEmailLoad({
				params: { code: String(existing?.code) },
				cookies,
				url: new URL(
					`https://example.com/verify/email/${existing?.code}?email=${encodeURIComponent(testEmails.loginUser)}`
				)
			});

			expect(result.codeOk).toBe(true);
			expect(result.status).toBe(200);
			expect(cookies.set).toHaveBeenCalledWith(
				SESSION_COOKIE_NAME,
				expect.any(String),
				expect.objectContaining({ httpOnly: true, path: '/' })
			);

			const afterVerify = await findLoginUser(testEmails.loginUser);
			expect(afterVerify?.first_login_at).toBeInstanceOf(Date);
			expect(afterVerify?.last_login_at).toBeInstanceOf(Date);
		});

		it('requires the email to match when verifying a login code', async () => {
			const emailA = testEmails.collisionUserA;
			const emailB = testEmails.collisionUserB;

			await upsertAuthorizedUser(emailA, 'MusicEditor');
			await upsertAuthorizedUser(emailB, 'MusicEditor');

			advanceTime();
			const codeA = (await loginModule.issueLoginCode(emailA)).code;

			advanceTime();
			let codeB = (await loginModule.issueLoginCode(emailB)).code;
			if (codeB === codeA) {
				// Extremely unlikely with 8-digit codes; retry once to ensure distinct values.
				advanceTime();
				codeB = (await loginModule.issueLoginCode(emailB)).code;
			}

			const verifiedA = await loginModule.verifyLoginCode(codeA, emailA);
			expect(verifiedA?.email).toBe(emailA);

			const mismatched = await loginModule.verifyLoginCode(codeA, emailB);
			expect(mismatched).toBeNull();

			await removeLoginUsers([emailA, emailB]);
			await removeAuthorizedUsers([emailA, emailB]);
		});
	});

	describe('session handling and route guards', () => {
		it('populates event.locals from the session cookie', async () => {
			const sessionToken = encodeSession({
				email: testEmails.musicEditor,
				role: 'MusicEditor'
			});
			const url = new URL('http://localhost/admin/musicalpiece');
			const event = {
				url,
				request: new Request(url),
				locals: { session: null, user: null },
				cookies: createMockCookies({ [SESSION_COOKIE_NAME]: sessionToken }),
				route: { id: '/admin/musicalpiece' }
			} as unknown as Parameters<typeof handle>[0]['event'];

			const resolve = vi.fn(async () => new Response('ok'));
			await handle({ event, resolve });

			expect(event.locals.user).toEqual({
				email: testEmails.musicEditor,
				role: 'MusicEditor'
			});
			expect(event.locals.session).toEqual(event.locals.user);
		});

		it('preserves the role across requests', async () => {
			const sessionToken = encodeSession({
				email: testEmails.divisionChair,
				role: 'DivisionChair'
			});
			const url = new URL('http://localhost/admin/class');
			const firstEvent = {
				url,
				request: new Request(url),
				locals: { session: null, user: null },
				cookies: createMockCookies({ [SESSION_COOKIE_NAME]: sessionToken }),
				route: { id: '/admin/class' }
			} as unknown as Parameters<typeof handle>[0]['event'];
			const resolve = vi.fn(async () => new Response('ok'));
			await handle({ event: firstEvent, resolve });
			expect(firstEvent.locals.user?.role).toBe('DivisionChair');

			const secondEvent = {
				...firstEvent,
				url: new URL('http://localhost/admin/composer'),
				request: new Request('http://localhost/admin/composer'),
				route: { id: '/admin/composer' },
				locals: { session: null, user: null }
			};

			await handle({ event: secondEvent as typeof firstEvent, resolve });
			expect(secondEvent.locals.user?.role).toBe('DivisionChair');
		});

		it('allows only permitted routes per role and redirects on violations', async () => {
			const scenarios: { role: AuthRole; allow: string; deny: string }[] = [
				{ role: 'ConcertMaster', allow: '/admin/program', deny: '/admin/users' },
				{ role: 'MusicEditor', allow: '/admin/musicalpiece', deny: '/admin/list' },
				{ role: 'DivisionChair', allow: '/admin/list', deny: '/admin/program' }
			];

			for (const scenario of scenarios) {
				const token = encodeSession({
					email: `case-${scenario.role}@test.concertprogram`,
					role: scenario.role
				});
				const allowEvent = {
					url: new URL(`http://localhost${scenario.allow}`),
					request: new Request(`http://localhost${scenario.allow}`),
					locals: { session: null, user: null },
					cookies: createMockCookies({ [SESSION_COOKIE_NAME]: token }),
					route: { id: scenario.allow }
				} as unknown as Parameters<typeof handle>[0]['event'];

				const allowResolve = vi.fn(async () => new Response('ok'));
				const allowResponse = await handle({ event: allowEvent, resolve: allowResolve });
				expect(allowResponse.status).toBe(200);
				expect(allowResolve).toHaveBeenCalled();

				const denyEvent = {
					...allowEvent,
					url: new URL(`http://localhost${scenario.deny}`),
					request: new Request(`http://localhost${scenario.deny}`),
					route: { id: scenario.deny },
					locals: { session: null, user: null }
				};

				await expect(
					handle({ event: denyEvent as typeof allowEvent, resolve: allowResolve })
				).rejects.toMatchObject({ location: '/landing?unauthorized=1', status: 303 });
			}
		});

		it('allows admins to access any protected route', async () => {
			const token = encodeSession({ email: testEmails.admin, role: 'Admin' });
			const url = new URL('http://localhost/admin/users');
			const event = {
				url,
				request: new Request(url),
				locals: { session: null, user: null },
				cookies: createMockCookies({ [SESSION_COOKIE_NAME]: token }),
				route: { id: '/admin/users' }
			} as unknown as Parameters<typeof handle>[0]['event'];

			const resolve = vi.fn(async () => new Response('ok'));
			const response = await handle({ event, resolve });
			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalled();
		});
	});

	describe('navigation model', () => {
		it('filters nav items to the role allowlist', () => {
			const nav = filterNavItemsForRole('MusicEditor');
			expect(nav.some((item) => item.href === '/landing')).toBe(true);
			const protectedItems = nav.filter((item) => item.requiresAuth);
			for (const item of protectedItems) {
				const routeId = normalizeRouteId(item.routeId ?? item.href);
				expect(routeId).not.toBeNull();
				expect(roleAllowsRoute('MusicEditor', routeId!)).toBe(true);
			}
		});

		it('includes every nav item for admins', () => {
			const nav = filterNavItemsForRole('Admin');
			expect(nav).toHaveLength(NAV_ITEMS.length);
			expect(nav.find((item) => item.href === '/admin/users')).toBeDefined();
		});
	});

	describe('admin users UI actions', () => {
		it('enforces admin-only access and applies CRUD changes immediately', async () => {
			await expect(
				adminUsersLoad({
					locals: { user: { email: testEmails.musicEditor, role: 'MusicEditor' }, session: null }
				} as never)
			).rejects.toMatchObject({ location: '/landing?unauthorized=1', status: 303 });

			const adminLocals = {
				user: { email: testEmails.admin, role: 'Admin' as AuthRole },
				session: { email: testEmails.admin, role: 'Admin' as AuthRole }
			};

			const createForm = new FormData();
			createForm.set('email', testEmails.managedUser.toUpperCase());
			createForm.set('role', 'MusicEditor');
			const createResult = await adminUserActions.create({
				request: new Request('http://localhost/admin/users?/create', {
					method: 'POST',
					body: createForm
				}),
				locals: adminLocals
			});
			expect((createResult as { success?: boolean }).success).toBe(true);

			const created = await findAuthorizedUser(testEmails.managedUser);
			expect(created?.email).toBe(testEmails.managedUser);
			expect(created?.role).toBe('MusicEditor');

			advanceTime();
			const loginCode = await loginModule.issueLoginCode(testEmails.managedUser);
			const loginRow = await findLoginUser(testEmails.managedUser);
			expect(loginRow?.code).toBe(loginCode.code);

			const updateForm = new FormData();
			updateForm.set('id', String(created?.id));
			updateForm.set('role', 'DivisionChair');
			const updateResult = await adminUserActions.update({
				request: new Request('http://localhost/admin/users?/update', {
					method: 'POST',
					body: updateForm
				}),
				locals: adminLocals
			});
			expect((updateResult as { success?: boolean }).success).toBe(true);

			const updated = await findAuthorizedUser(testEmails.managedUser);
			expect(updated?.role).toBe('DivisionChair');

			advanceTime();
			await loginModule.issueLoginCode(testEmails.managedUser);
			const managedUserRow = await findLoginUser(testEmails.managedUser);
			const verifiedUser = await loginModule.verifyLoginCode(
				managedUserRow!.code,
				testEmails.managedUser
			);
			expect(verifiedUser?.role).toBe('DivisionChair');

			const deleteForm = new FormData();
			deleteForm.set('id', String(updated?.id));
			const deleteResult = await adminUserActions.delete({
				request: new Request('http://localhost/admin/users?/delete', {
					method: 'POST',
					body: deleteForm
				}),
				locals: adminLocals
			});
			expect((deleteResult as { success?: boolean }).success).toBe(true);

			await removeAuthorizedUsers([testEmails.managedUser]);
			await removeLoginUsers([testEmails.managedUser]);

			advanceTime();
			await expect(loginModule.issueLoginCode(testEmails.managedUser)).rejects.toBeInstanceOf(
				loginModule.UnauthorizedEmailError
			);
		});
	});
});
