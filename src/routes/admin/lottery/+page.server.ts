import {seelectPerformerLottery} from "$lib/server/db";
import {formatFieldNames, pafe_series, reformatISODate} from "$lib/server/common";

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    const isAuthenticated =  !!pafeAuth;

    const res= await seelectPerformerLottery(pafe_series())
    const columnNames: string[] =  res.fields.map(record => formatFieldNames(record.name));
    for (const row of res.rows) {
        if (row.first_choice_time) {
            row.first_choice_time = reformatISODate(row.first_choice_time)
        }
    }
    return {performers: res.rows, performer_fields: columnNames, isAuthenticated: isAuthenticated};
}