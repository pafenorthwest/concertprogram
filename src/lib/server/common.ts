export interface Composer {
    id: number | null;
    printed_name: string;
    full_name: string;
    years_active: string;
    alias: string;
}

export interface Accompanist {
    id: number | null;
    full_name: string;
}

export interface MusicalPiece {
    id: number | null;
    printed_name: string;
    first_composer_id: number;
    all_movements: string | null;
    second_composer_id: number | null;
    third_composer_id: number | null;
}

export interface Performer {
    id: number | null;
    full_name: string;
    instrument: string;
    email: string | null;
    phone: string | null;
}

/**
 * Performance can have multiple music pieces
 * Not represented in this data structure
 * Would simply call Performance insert multiple times with performance id
 */
export interface Performance {
    id: number | null;
    performer_name: string;
    musical_piece: string;
    movements: string;
    duration: number | null;
    accompanist_id: number | null;
    concert_series: string;
    pafe_series: number;
    instrument: string;
}

export interface Lottery {
    lottery: number;
    base34Lottery: string;
}

export interface PerformerRankedChoice {
    performer_id: number;
    concert_series: string;
    pafe_series: number;
    first_choice_time: Date;
    second_choice_time: Date | null;
    third_choice_time: Date | null;
    fourth_choice_time: Date | null;
}

export function formatFieldNames(input: string): string {
    return input
        .split('_') // Split the string by underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' '); // Join the words with spaces
}

export function isNonEmptyString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

export function generateLottery(): Lottery {
    // Lottery Number at most 4 digit base 36
    const min = 1;
    const max = 1679615;

    // 0.3% chance of collision for 100 random numbers
    const lottery = Math.floor(Math.random() * (max - min + 1)) + min;
    // convert to base 36 string
    const base34Lottery = decimalToBase34(lottery);

    return {lottery, base34Lottery};
}

export function pafe_series(): number {
    const currentYear = new Date().getFullYear();
    return currentYear - 1988;
}

// Initialize base 34 chars.
// All Zeros are 'O'
// ALL Ones are 'I'
const BASE34_CHARACTERS = 'O23456789ABCDEFGHIJKLMNPQRSTUVWXYZ';
const CHAR_TO_VALUE: { [key: string]: number } = {};

for (let i = 0; i < BASE34_CHARACTERS.length; i++) {
    CHAR_TO_VALUE[BASE34_CHARACTERS[i]] = i;
}
export function decimalToBase34(num: number): string {
    if (num === 0) return 'O';
    let base34 = '';
    while (num > 0) {
        const remainder = num % 34;
        base34 = BASE34_CHARACTERS[remainder] + base34;
        num = Math.floor(num / 34);
    }
    return base34;
}

export function base34ToDecimal(base34: string): number {
    let num = 0;
    for (let i = 0; i < base34.length; i++) {
        num = num * 34 + CHAR_TO_VALUE[base34[i]];
    }
    return num;
}



