import {error, json, redirect} from "@sveltejs/kit";
import pg from 'pg';
const { QueryArrayResult } = pg;
import {queryTable, deleteById, insertTable} from "$lib/server/db";
import {Performer, formatFieldNames} from '$lib/server/common.ts'
import {createPerformer} from "$lib/server/performer";

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    if (!pafeAuth) {
        redirect(307, '/');
    }
    const res= await queryTable('performer');
    const columnNames: string[] =  res.fields.map(record => formatFieldNames(record.name));
    return {performers: res.rows, performer_fields: columnNames};
}

export const actions = {
    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('performerId');
        const rowCount = await deleteById('performer', id);

        if (rowCount != null && rowCount > 0) {
            return { status: 200, body: { message: 'Delete successful' } };
        } else {
            return { status: 500, body: { message: 'Delete failed' } };
        }
    },
    add: async ({request}) => {
        const formData = await request.formData();
        const performer: Performer = {
            id: null,
            full_name: formData.get('fullName'),
            instrument: formData.get('instrument'),
            email: formData.get('email'),
            phone: formData.get('phone')
        }

        if ( !performer.full_name || !performer.instrument) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const success = await createPerformer(performer)
            if (success) {
                return { status: 200, body: { message: 'Insert successful' } };
            } else {
                return { status: 500, body: { message: 'Insert failed' } };
            }
        }
    },
};