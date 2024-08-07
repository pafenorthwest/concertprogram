import {error, json} from "@sveltejs/kit";
import pg from 'pg';
const { QueryArrayResult } = pg;
import {queryTable, deleteById, insertTable} from "$lib/server/db";
import {Composer, formatFieldNames} from '$lib/server/common.ts'

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
        const id = formData.get('composerId');
        const rowCount = await deleteById('composer', id);

        if (rowCount != null && rowCount > 0) {
            return { status: 200, body: { message: 'Delete successful' } };
        } else {
            return { status: 500, body: { message: 'Delete failed' } };
        }
    },
    add: async ({request}) => {
        const formData = await request.formData();
        const composer: Composer = {
            id: null,
            printed_name: formData.get('printedName'),
            full_name: formData.get('fullName'),
            years_active: formData.get('yearsActive'),
            alias: formData.get('alias')
        }

        if ( !composer.printed_name || !composer.full_name || !composer.years_active) {
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