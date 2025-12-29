export const contributorRoles = [
	'Composer',
	'Copyist',
	'Editor',
	'Arranger',
	'Transcriber',
	'Realizer',
	'Orchestrator'
] as const;

export type ContributorRole = (typeof contributorRoles)[number];

export const defaultContributorRole: ContributorRole = 'Composer';

export function normalizeContributorRole(role: string | null | undefined): ContributorRole {
	if (role != null && contributorRoles.includes(role as ContributorRole)) {
		return role as ContributorRole;
	}
	return defaultContributorRole;
}
