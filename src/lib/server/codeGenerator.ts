export class CodeGenerator {
	/**
	 * Returns a random 6-digit numerical code as a number (e.g., 483920).
	 */
	public static getCode(): number {
		return Math.floor(100000 + Math.random() * 900000);
	}

	/**
	 * Returns a UUID v4-like string.
	 */
	public static getToken(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}
}
