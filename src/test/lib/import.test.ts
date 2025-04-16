import {describe, it, assert, expect} from 'vitest';
import {Performance} from "$lib/server/import";
import {
    type ImportMusicalTitleInterface,
    type ImportPerformanceInterface,
    parseMusicalPiece
} from '$lib/server/common';
import {GradeError} from "$lib/server/customExceptions";
import { searchComposer } from '$lib/server/db';

describe('Test Import Code', () => {
    it("should parse music titles with movements", async () => {
        const testTitlesWithMovements: readonly [string, string, string][] = [
            [
                'J.C.Bach Concerto in C minor 3rd movement',
                'J.C.Bach Concerto in C minor', '3rd movement'
            ],
            [
                'Pelléas et Mélisande, Op. 80 III. Sicilienne: Allegretto molto moderato',
                'Pelléas et Mélisande, Op. 80','III. Sicilienne: Allegretto molto moderato'
            ],
            [
                ' Sonata for Flute, H. 306 I. Allegro moderato',
                'Sonata for Flute, H. 306','I. Allegro moderato'
            ],
            [
                'Concerto No.4 in D minor, Opus 31, 1st movement',
                'Concerto No.4 in D minor, Opus 31', '1st movement'
            ]
        ]

        const results = testTitlesWithMovements.map(entry => parseMusicalPiece(entry[0]))

        assert.isAbove(results.length, 0, 'Expected results from parsedMusicPieces and found none')
        results.forEach((musicalPiece, index) => {

            assert.equal(musicalPiece.titleWithoutMovement, testTitlesWithMovements[index][1], 'Expected titles to match')

            assert.equal(musicalPiece.movements!, testTitlesWithMovements[index][2], 'Expected movements to match')
        })
    })
    it("should parse music titles with out movements", async () => {
        const testTitlesWithOutMovements: readonly [string, string, null][] = [
            [
                'Bolero',
                'Bolero',null
            ],
            [
                'Prelude & Fugue in B minor',
                'Prelude & Fugue in B minor',null
            ],
            [
                'Sonata in F minor, D. 625',
                'Sonata in F minor, D. 625',null
            ],
            [
                ' Caprice Basque, Opus 24',
                'Caprice Basque, Opus 24',null
            ],
            [
                ' Piano Sonata No. 3 in F minor, Op. 14',
                'Piano Sonata No. 3 in F minor, Op. 14',null
            ]
        ]

        const results = testTitlesWithOutMovements.map(entry => parseMusicalPiece(entry[0]))
        assert.isAbove(results.length, 0, 'Expected results from parsedMusicPieces and found none')
        results.forEach(musicalPiece => {
            assert.isAbove(musicalPiece.titleWithoutMovement.length, 5, 'Music title of length 12 or more')
            assert.isNull(musicalPiece.movements, 'Expected no movement')
        })
    })

    it("should insert single performance", async () => {

        const musicalTitle: ImportMusicalTitleInterface = {
            title: 'J.C.Bach Concerto in C minor 3rd movement',
            composers: [
                { name: 'Johann Christian Bach', yearsActive: 'none'}
            ]
        }

        const imported: ImportPerformanceInterface = {
            class_name: 'CC.P-4.A',
            performer: 'Nymphodoros Sýkorová',
            age: "6",
            lottery: "12345",
            email: 'QFnl@example.com',
            phone: '999-555-4444',
            accompanist: 'Zhi, Zhou',
            instrument: 'Cello',
            musical_piece: [musicalTitle],
            concert_series: 'Eastside'
        }
        const singlePerformance: Performance = new Performance()
        await singlePerformance.initialize(imported)
        await singlePerformance.delete()

        assert.isDefined(singlePerformance.musical_piece_1,'Expected musical piece to be defined')
        assert.isNotNull(singlePerformance.musical_piece_1.id, 'Expected non null musical_piece id')
        assert.isAbove(singlePerformance.musical_piece_1.id, 0, ' Expected musical piece id positive integer')
        assert.equal(singlePerformance.accompanist?.full_name,'Zhou Zhi','Expected accompanist ')
        assert.equal(singlePerformance.performer.full_name,'Nymphodoros Sýkorová','Expected performer name')
        assert.equal(singlePerformance.performer.email,'QFnl@example.com','Expected performer email')
        assert.isDefined(singlePerformance.composer_1,'Expected first composer to be defined')
        assert.equal(singlePerformance.composer_1.full_name,"Johann Christian Bach",'Expected composer')
    });
    it("should fail parsing grade", async () => {



        const imported: ImportPerformanceInterface = {
            class_name: 'XXXX?????',
            performer: 'Nymphodoros Sýkorová',
            lottery: "12345",
            email: 'QFnl@example.com',
            phone: '999-555-4444',
            accompanist: 'Zhi, Zhou',
            instrument: 'Cello',
            piece_1: 'J.C.Bach Concerto in C minor 3rd movement',
            composer_1: 'Johann Christian Bach',
            piece_2: null,
            composer_2: null,
            concert_series: 'Eastside'
        }

        const composerFromDB = await searchComposer('Johann Christian Bach')

        const singlePerformance: Performance = new Performance()
        try {
            await singlePerformance.initialize(imported)
        } catch (e) {
            expect(e).to.be.an.instanceof(GradeError)
        }
        await singlePerformance.delete()
    });
});