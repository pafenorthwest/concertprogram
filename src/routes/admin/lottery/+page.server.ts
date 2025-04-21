import {selectPerformanceLottery} from "$lib/server/db";
import {displayReformatISODate, formatFieldNames, pafe_series} from "$lib/server/common";

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    const isAuthenticated =  !!pafeAuth;

    const res= await selectPerformanceLottery(pafe_series())

    const columnNames: string[] =  res.fields
      .filter(record => record.name !== "concert_chair_choice")
      .map(record => record.name === "epoch" ? "Age" : formatFieldNames(record.name));
    for (const row of res.rows) {
        if (row.first_choice_time) {
            row.first_choice_time = displayReformatISODate(row.first_choice_time)
        }
    }
    return {performers: res.rows, performer_fields: columnNames, isAuthenticated: isAuthenticated};
}