import {DataParser, Performance} from "$lib/server/import";
import {ImportPerformance} from "$lib/server/common";

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    const isAuthenticated =  !!pafeAuth;

    return {isAuthenticated: isAuthenticated}
}

export const actions = {
    add: async ({request}) => {
        const formData = await request.formData();
        if (formData.has('bigext')) {
            const csvData = formData.get('bigtext')
            const concertSeries = formData.get('concert-series')
            const importedData = new DataParser()
            await importedData.initialize(csvData, "CSV", concertSeries)
        } else {
            const imported: ImportPerformance = {
                class_name: formData.get('class'),
                performer: formData.get('performer-name'),
                email: formData.get('performer-email'),
                phone: formData.get('performer-phone'),
                accompanist: formData.get('accompanist'),
                instrument: formData.get('instrument'),
                piece_1: formData.get('musical-piece-1'),
                piece_2: formData.get('musical-piece-2'),
                concert_series: formData.get('concert-series')
            }
            const singlePerformance: Performance = new Performance()
            await singlePerformance.initialize(imported)
        }
    },
};
