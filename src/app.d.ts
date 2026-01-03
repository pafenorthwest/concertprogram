// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AuthSession } from '$lib/server/session';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: AuthSession | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
