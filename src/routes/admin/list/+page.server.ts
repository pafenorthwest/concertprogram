import {queryPerformances} from "$lib/server/db";
import { formatFieldNames, pafe_series, type PerformanceFilterInterface } from '$lib/server/common';

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    const isAuthenticated =  !!pafeAuth;

    const filter: PerformanceFilterInterface = { pafe_series: pafe_series(), concert_series: null }
    const res= await queryPerformances(filter);
    const columnNames: string[] =  res.fields.map(record => formatFieldNames(record.name));
    return {performances: res.rows, performance_fields: columnNames, isAuthenticated: isAuthenticated};
}