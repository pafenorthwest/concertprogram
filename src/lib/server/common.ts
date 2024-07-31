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
    base36Lottery: string;
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
    const base36Lottery = lottery.toString(36).toUpperCase();

    return {lottery, base36Lottery};
}

export function pafe_series(): number {
    const currentYear = new Date().getFullYear();
    return currentYear - 1988;
}

