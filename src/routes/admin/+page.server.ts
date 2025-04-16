import {DataParser, Performance} from "$lib/server/import";
import type { ComposerInterface, ImportPerformanceInterface } from '$lib/server/common';
import { fail } from '@sveltejs/kit';

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    const isAuthenticated =  !!pafeAuth;

    return {isAuthenticated: isAuthenticated}
}

export const actions = {
    add: async ({request}) => {
        const formData = await request.formData();
        if (formData.has('bigtext')) {
            const csvData = formData.get('bigtext')
            const concertSeries = formData.get('concert-series')
            const importedData = new DataParser()
            if ( csvData != null && concertSeries != null ) {
                await importedData.initialize(csvData.toString(), "CSV", concertSeries.toString())
                if (importedData.failedImports.length > 0) {
                    return fail(500, { error: JSON.stringify(importedData.failedImports) });
                }
            }
        } else {
            const composerPieceOne: ComposerInterface = {
                printed_name: formData.get('composer-name-piece-1'),
                years_active: formData.get('composer-years-piece-1')
            }

            let composerPieceTwo: ComposerInterface
            if ( formData.has('musical-piece-2')
              && formData.has('composer-name-piece-2')
              && formData.has('composer-years-piece-2')
            ) {
                composerPieceTwo = {
                    printed_name: formData.get('composer-name-piece-2'),
                    years_active: formData.get('composer-years-piece-2')
                }
            }

            const imported: ImportPerformanceInterface = {
                class_name: formData.get('class'),
                performer: formData.get('performer-name'),
                lottery: formData.get('lottery'),
                email: formData.get('performer-email'),
                phone: formData.get('performer-phone'),
                accompanist: formData.get('accompanist'),
                instrument: formData.get('instrument'),
                piece_1: formData.get('musical-piece-1'),
                composer_1: composerPieceOne,
                piece_2: formData.get('musical-piece-2'),
                composer_2: composerPieceTwo,
                concert_series: formData.get('concert-series')
            }
            const singlePerformance: Performance = new Performance()
            try {
                await singlePerformance.initialize(imported)
            } catch (e) {
                return fail(500, { error: (e as Error).message });
            }
        }
    },
};
