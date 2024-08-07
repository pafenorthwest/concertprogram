import {redirect} from "@sveltejs/kit";
import {queryPerformances} from "$lib/server/db";
import {formatFieldNames, pafe_series, PerformanceFilter} from "$lib/server/common";

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    if (!pafeAuth) {
        redirect(307, '/');
    }
    const filter: PerformanceFilter = { pafe_series: pafe_series(), concert_series: null }
    const res= await queryPerformances(filter);
    const columnNames: string[] =  res.fields.map(record => formatFieldNames(record.name));
    return {performances: res.rows, performance_fields: columnNames};
}