import {describe, it, assert} from 'vitest';
import {Performance} from "$lib/server/import";
import {ImportPerformance, parseMusicalPiece} from "$lib/server/common";

describe('Test Import Code', () => {
    it("should parse music titles with movements", async () => {
        const testTitlesWithMovements: readonly [string, string, string, string][] = [
            [
                'J.C.Bach Concerto in C minor 3rd movement by Johann Christian Bach',
                'J.C.Bach Concerto in C minor', '3rd movement', 'Johann Christian Bach'
            ],
            [
                'Pelléas et Mélisande, Op. 80 III. Sicilienne: Allegretto molto moderato by Gabriel Fauré',
                'Pelléas et Mélisande, Op. 80','III. Sicilienne: Allegretto molto moderato','Gabriel Fauré'
            ],
            [
                ' Sonata for Flute, H. 306 I. Allegro moderato by Bohuslav Martinu',
                'Sonata for Flute, H. 306','I. Allegro moderato','Bohuslav Martinu'
            ]
        ]

        const results = testTitlesWithMovements.map(entry => parseMusicalPiece(entry[0]))

        assert.isAbove(results.length, 0, 'Expected results from parsedMusicPieces and found none')
        console.log('has results')
        results.forEach((musicalPiece, index) => {
            console.log(musicalPiece)

            assert.equal(musicalPiece.titleWithoutMovement, testTitlesWithMovements[index][1], 'Expected titles to match')
            console.log(`title ${musicalPiece.titleWithoutMovement} should match ${testTitlesWithMovements[index][1]}`)

            assert.equal(musicalPiece.movements!, testTitlesWithMovements[index][2], 'Expected movements to match')
            console.log(`movements ${musicalPiece.movements} should match ${testTitlesWithMovements[index][2]}`)

            assert.isNotNull(musicalPiece.composers, 'Expected composers to not be null and failed')
            console.log('composers is not null')
            assert.equal(musicalPiece.composers?.[0] ,  testTitlesWithMovements[index][3],'Expected composer to match')
            console.log(`composer ${musicalPiece.composers?.[0]} should match ${testTitlesWithMovements[index][3]}`)
        })
    })
    it("should parse music titles with out movements", async () => {
        const testTitlesWithOutMovements: readonly [string, string, null, string][] = [
            [
                'Bolero by Emile Pessard',
                'Bolero',null,'Emile Pessard'
            ],
            [
                'Prelude & Fugue in B minor by Johann Sebastian Bach',
                'Prelude & Fugue in B minor',null,'Johann Sebastian Bach'
            ],
            [
                'Sonata in F minor, D. 625 by Franz Schubert',
                'Sonata in F minor, D. 625',null,'Franz Schubert'
            ],
            [
                ' Caprice Basque, Opus 24 by Pablo de Sarasate',
                'Caprice Basque, Opus 24',null,'Pablo de Sarasate'
            ],
            [
                ' Piano Sonata No. 3 in F minor, Op. 14 by Robert Schumann',
                'Piano Sonata No. 3 in F minor, Op. 14',null,'Robert Schumann'
            ]
        ]

        const results = testTitlesWithOutMovements.map(parseMusicalPiece)
        assert.isAbove(results.length, 0, 'Expected results from parsedMusicPieces and found none')
        console.log('Music Pieces with no movements has results')
        results.forEach(musicalPiece => {
            assert.isNotNull(musicalPiece.composers, 'Expected composers to not be null and failed')
            console.log('composer not null')
            assert.isNotNull(musicalPiece.composers?.[0], 'Expected composer 1 is not null')
            console.log(`Expected composer 1 is not null ${musicalPiece.composers?.[0]}`)
            assert.isAbove(musicalPiece.titleWithoutMovement.length, 5, 'Music title of length 12 or more')
            console.log(`matched title ${musicalPiece.titleWithoutMovement}`)
            assert.isNull(musicalPiece.movements, 'Expected no movement')
            console.log(`matched null movements`)
        })
    })
    it("should insert single performance", async () => {
        const imported: ImportPerformance = {
            class_name: 'CC.P-4.A',
            performer: 'Nymphodoros Sýkorová',
            email: 'QFnl@example.com',
            phone: '999-555-4444',
            accompanist: 'Zhi, Zhou',
            instrument: 'Cello',
            piece_1: 'J.C.Bach Concerto in C minor 3rd movement by Johann Christian Bach',
            piece_2: null,
            concert_series: 'Eastside'
        }
        const singlePerformance: Performance = new Performance()
        await singlePerformance.initialize(imported)
        await singlePerformance.delete()

        assert(singlePerformance.musical_piece_1.id > 0)
        assert(singlePerformance.accompanist?.full_name == 'Zhou Zhi')
        assert(singlePerformance.performer.full_name == 'Nymphodoros Sýkorová')
        assert(singlePerformance.performer.email = 'QFnl@example.com')
        assert(singlePerformance.composer_1.full_name = "Johann Christian Bach")

    });
});