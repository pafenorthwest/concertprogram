import { describe, it, assert, expect } from 'vitest';
import { Performance } from '$lib/server/import';
import {
	type ImportPerformanceInterface
} from '$lib/server/common';

describe('Test Import From JSON', () => {
	it('should insert carter', async () => {
        //const text = '{ "class_name": "QQ.9-10.XE", "performer": "Emma Carter", "age": 12, "lottery": 123, "email": "uFiqpdx@example.com","phone": "999-555-4444","accompanist": "Zhi, Zhou","instrument": "Cello","musical_piece": [ {"title": "Concerto in C minor 3rd movement", "contributors": [ { "name": "Johann Christian Bach", "yearsActive": "None" }  ]  },{ "title": "Scherzo no.2 in B Flat Minor, op.31", "contributors": [  { "name": "Frédéric Chopin", "yearsActive": "None" }  ] } ], "concert_series": "Eastside"}'
        const text = '{"class_name":"11y.b","performer":"Number Two","age":"8","lottery":"123456","instrument":"Flute","concert_series":"Eastside","musical_piece":[{"title":"Over the River Number Two","contributors":[{"name":"Number Two","years_active":"1980 - Current","role":"Copyist","notes":"Web Admin Import"}]}],"accompanist":"Yawen Jie","email":"twoyb@young.com","phone":null}'
        const imported: ImportPerformanceInterface = JSON.parse(text);
        if (!imported.class_name) {
            console.log('Missing Field 400 error')
        } else {
            const singlePerformance: Performance = new Performance();
            try {
                const importResults = await singlePerformance.initialize(imported);
                console.log(`Success perfomerId ${importResults.performerId} performanceId ${importResults.performanceId}`)
                assert.isAbove(importResults.performerId,0,'expected performer ID greater than 0')
            } catch (e) {
                console.log((e as Error).message);
            }
        }
        
    });
});