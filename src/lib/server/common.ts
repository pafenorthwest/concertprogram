import {applyAction, deserialize} from "$app/forms";
import {invalidateAll} from "$app/navigation";

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

export function formatFieldNames(input: string): string {
    return input
        .split('_') // Split the string by underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' '); // Join the words with spaces
}

export function isNonEmptyString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

