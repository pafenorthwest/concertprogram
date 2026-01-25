import { env } from '$env/dynamic/private';

function toBoolean(value: string | undefined): boolean {
	if (!value) {
		return false;
	}
	return value === 'true' || value === '1' || value.toLowerCase() === 'yes';
}

export const featureFlags = {
	performancePieceSelfService: toBoolean(env.FEATURE_PERFORMANCE_PIECE_SELF_SERVICE)
};
