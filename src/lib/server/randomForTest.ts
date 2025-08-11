export function generateRandomString(length: number = 20): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function generateSixDigitNumber(): number {
	return Math.floor(100000 + Math.random() * 900000);
}
