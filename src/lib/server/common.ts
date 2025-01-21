
export enum Instrument {
    Cello = 'Cello',
    Flute = 'Flute',
    Piano = 'Piano',
    Violin = 'Violin',
    Soprano = 'Soprano',
    Viola = 'Viola',
    Tenor = 'Tenor',
    Clarinet = 'Clarinet',
    Oboe = 'Oboe',
    Bassoon = 'Bassoon',
    Ensemble = 'Ensemble'
}
export function selectInstrument(input: string): Instrument | null {
    input = input.toLowerCase()
    let returnInstrument: Instrument | null = null
    switch(input) {
        case 'cello':
            returnInstrument = Instrument.Cello
            break
        case 'flute':
            returnInstrument = Instrument.Flute
            break
        case 'piano':
            returnInstrument = Instrument.Piano
            break
        case 'violin':
            returnInstrument = Instrument.Violin
            break
        case 'viola':
            returnInstrument = Instrument.Viola
            break
        case 'soprano':
            returnInstrument = Instrument.Soprano
            break
        case 'tenor':
            returnInstrument = Instrument.Tenor
            break
        case 'oboe':
            returnInstrument = Instrument.Oboe
            break
        case 'clarinet':
            returnInstrument = Instrument.Clarinet
            break
        case 'bassoon':
            returnInstrument = Instrument.Bassoon
            break
        case 'Ensemble':
            returnInstrument = Instrument.Ensemble
            break
        default:
            returnInstrument = null
            break
    }
    return returnInstrument;
}

export enum Grade {
    'GradePreto2'='Preschool - 2nd',
    'GradePreto4'='Preschool - 4th',
    'GradePreto6'='Preschool - 6th',
    'GradePreto8'='Preschool - 8th',
    'Grade3to4'='3rd - 4th',
    'Grade3to5'='3rd - 5th',
    'Grade3to8'='3rd - 8th',
    'Grade5to6'='5th - 6th',
    'Grade5to8'='5th - 8th',
    'Grade6to8'='6th - 8th',
    'Grade7to8'='7th - 8th',
    'Grade9to10'='9th - 10th',
    'Grade9to12'='9th - 12th',
    'Grade11to12'='11th - 12th'
}

export function selectGrade(input: string): Grade | null {
    input = input.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/(nd|rd|th)/g,"");
    let returnGrade: Grade | null = null

    switch(input) {
        case 'P-2':
            returnGrade = Grade.GradePreto2
            break
        case 'P-4':
            returnGrade = Grade.GradePreto4
            break
        case 'P-6':
            returnGrade = Grade.GradePreto6
            break
        case 'P-8':
            returnGrade = Grade.GradePreto8
            break
        case '3-4':
            returnGrade = Grade.Grade3to4
            break
        case '3-5':
            returnGrade = Grade.Grade3to5
            break
        case '3-8':
            returnGrade = Grade.Grade3to8
            break
        case '5-6':
            returnGrade = Grade.Grade5to6
            break
        case '5-8':
            returnGrade = Grade.Grade5to8
            break
        case '6-8':
            returnGrade = Grade.Grade6to8
            break
        case '7-8':
            returnGrade = Grade.Grade7to8
            break
        case '9-10':
            returnGrade = Grade.Grade9to10
            break
        case '9-12':
            returnGrade = Grade.Grade9to12
            break
        case '11-12':
            returnGrade = Grade.Grade11to12
            break
    }

    return returnGrade
}

export interface ComposerInterface {
    id: number | null;
    printed_name: string;
    full_name: string;
    years_active: string;
    alias: string;
}

export interface AccompanistInterface {
    id: number | null;
    full_name: string;
}

export interface MusicalPieceInterface {
    id: number | null;
    printed_name: string;
    first_composer_id: number;
    all_movements: string | null;
    second_composer_id: number | null;
    third_composer_id: number | null;
}

export interface PerformerInterface {
    id: number | null;
    full_name: string;
    grade: Grade;
    instrument: Instrument;
    email: string | null;
    phone: string | null;
    created?: boolean;
}

export interface PerformanceFilterInterface {
    concert_series: string | null;
    pafe_series: number
}

/**
 * Performance can have multiple music pieces
 * mapping in PerformancePieces
 */
export interface PerformanceInterface {
    id: number | null;
    performer_name: string;
    musical_piece: string;
    movements: string | null;
    duration: number | null;
    accompanist_id: number | null;
    concert_series: string;
    pafe_series: number;
    instrument: Instrument;
    created?: boolean;
}

export interface PerformancePieceInterface {
    performance_id: number;
    musical_piece_id: number;
    movement: string | null ;
}

export interface LotteryInterface {
    lottery: number;
    base34Lottery: string;
}

export interface PerformerRankedChoiceInterface {
    performer_id: number;
    concert_series: string;
    pafe_series: number;
    first_choice_time: Date;
    second_choice_time: Date | null;
    third_choice_time: Date | null;
    fourth_choice_time: Date | null;
}

export interface ImportPerformanceInterface {
    class_name: string;
    performer: string;
    email: string;
    phone: string | null;
    accompanist: string | null;
    instrument: string;
    piece_1: string;
    piece_2: string | null;
    concert_series: string | null;
}

export interface PerformerSearchResultsInterface {
    status: 'OK'|'ERROR'|'NOTFOUND';
    performer_id: number;
    performer_name: string;
    musical_piece: string;
    lottery_code: string;
    concert_series: string;
}

export interface EastSideFormInterface {
    rank: number | null;
    notSelected: boolean;
}

export interface ConcertoFormInterface {
    confirmed: boolean;
}

export type ScheduleFormInterface = EastSideFormInterface | ConcertoFormInterface

export function formatFieldNames(input: string): string {
    return input
        .split('_') // Split the string by underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' '); // Join the words with spaces
}

export function isNonEmptyString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

export function generateLottery(): LotteryInterface {
    // Lottery Number at most 4 digit base 34
    const min = 1;
    const max = 1337334;

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

export function displayReformatISODate(isoDate: string): string {
    const date = new Date(isoDate);

    // Format the date
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        hour12: true // Use 12-hour format
    });
}

export function compareReformatISODate(isoDate: string): string {
    const date = new Date(isoDate);

    // Format the date with leading zeros for day and month
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Format time part (HH:mm:ss)
    const timePart = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour time format
    });

    // Combine date and time parts
    return `${month}/${day}/${year}T${timePart}`;
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
    if (base34.length == 3) {
        base34 = 'O' + base34;
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

export function parseMusicalPiece(piece_performed: string): {
    titleWithoutMovement: string;
    movements: string | null;
    composers: string[] | null
} {

    // First split off the composer
    let composers = null
    const titleComposers: string[] = piece_performed.split(' by ').map(item => item.trim())
    // failing here is likely an error
    if (titleComposers.length <= 1) {
        throw new Error('Invalid musical piece, no composer string')
    } else {
        // if composers split and trim
        composers = titleComposers[1].split(/(,|\sand\s)/).map(item => item.trim());
    }

    // Second extract the movement from the remaining string
    const movementPattern = /(.*?)(\b(?:\d+(?:st|nd|rd|th)?\s*[Mm]ovements*|I{1,3}\.\s*[^,]+))$/i;

    const match = titleComposers[0].match(movementPattern);
    if (match) {
        // trim and remove leading and trailing spaces and commas
        return {
            titleWithoutMovement: match[1].replace(/^[ ,]+|[ ,]+$/g, ""),
            movements: match[2] ? match[2].replace(/^[ ,]+|[ ,]+$/g, "") : null,
            composers: composers
        }
    }
    // If no match is found, return the title without modifications
    return {
        titleWithoutMovement: titleComposers[0],
        movements: null,
        composers: composers
    };
}

export async function unpackBody(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder(); // Initialize a TextDecoder for UTF-8 by default
    let result = '';

    while (reader != undefined) {
        const { done, value } = await reader.read(); // Read the stream chunk by chunk
        if (done) break; // Exit the loop if there are no more chunks
        result += decoder.decode(value, { stream: true }); // Decode and append the chunk
    }
    return result
}

