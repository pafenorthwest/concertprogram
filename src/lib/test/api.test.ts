import {describe, it, assert} from 'vitest';
import {AccompanistInterface} from '$lib/server/common'

describe('Test HTTP APIs', () => {
    it("should insert Accompanist", () => {
        let accompanist: AccompanistInterface = {
            id: null,
            full_name: 'API Test Accompanist'
        }

        fetch(`http://localhost:5173/api/accompanist/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accompanist)
        }).then((result) => {
            assert(result.status == 200)
        }).catch((error) => {
            console.log("exception "+error)
            assert(false)
        })
    });
});