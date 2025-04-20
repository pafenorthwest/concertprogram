export function convertToEpochAge(value) {
	const currentYear = new Date().getFullYear();
	return currentYear - value;
}