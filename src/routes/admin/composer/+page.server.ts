import pg from 'pg';
const { QueryArrayResult } = pg;
import {queryTable, deleteById, insertTable} from "$lib/server/db";
import { type ComposerInterface, formatFieldNames } from '$lib/server/common';

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    const isAuthenticated =  !!pafeAuth;

    const res= await queryTable('composer');
    const columnNames: string[] =  res.fields.map(record => formatFieldNames(record.name));
    return {composers: res.rows, composer_fields: columnNames, isAuthenticated: isAuthenticated};
}

export const actions = {
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('composerId') ? parseInt(formData.get('composerId') as string, 10) : -1;
        const rowCount = await deleteById('composer', id);

        if (rowCount != null && rowCount > 0) {
            return { status: 200, body: { message: 'Delete successful' } };
        } else {
            return { status: 500, body: { message: 'Delete failed' } };
        }
    },
    add: async ({request}) => {
        const formData = await request.formData();
        const composer: ComposerInterface = {
            id: null,
            full_name: formData.get('fullName') as string,
            years_active: formData.get('yearsActive') as string,
            notes: formData.get('notes') as string
        }

        if ( !composer.full_name || !composer.years_active) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const result = await insertTable('composer', composer)
            if (result.rowCount != null && result.rowCount > 0) {
                return { status: 200, body: { message: 'Insert successful' } };
            } else {
                return { status: 500, body: { message: 'Insert failed' } };
            }
        }
    },
};