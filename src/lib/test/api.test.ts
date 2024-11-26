import {describe, it, assert, expect} from 'vitest';
import {auth_code} from '$env/static/private';
import {unpackBody} from '$lib/server/common'


describe('Test Accompanist HTTP APIs', () => {
    it('It should create and destroy accompanist', async () => {
        const createResponse = await fetch('http://localhost:5173/api/accompanist/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth_code}`
            },
            body: JSON.stringify({"full_name": "John John"})
        });
        expect(createResponse.status).toBe(200);

        // parse stream to get body
        if (createResponse.body != null) {
            const bodyFromRequest = await unpackBody(createResponse.body);
            // create object from parsed stream to get id of newly created accompanist
            const resultObject = JSON.parse(bodyFromRequest)
            const newId = resultObject.body.id;
            expect(+newId).toBeGreaterThan(0)
            const delResponse = await fetch(`http://localhost:5173/api/accompanist/${newId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth_code}`
                }
            });
            expect(delResponse.status).toBe(200);
        } else {
            assert(false,"unable to parse body of create accompanist request")
        }
    });
    it('It should create and destroy performer', async () => {
        const createResponse = await fetch('http://localhost:5173/api/performer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth_code}`
            },
            body: JSON.stringify({
                "full_name": "John John",
                "instrument": "Cello",
                "grade": "3-5",
                "email": "api-test@delete.me"
            })
        });
        expect(createResponse.status).toBe(200);

        // parse stream to get body
        if (createResponse.body != null) {
            const bodyFromRequest = await unpackBody(createResponse.body);
            // create object from parsed stream to get id of newly created accompanist
            const resultObject = JSON.parse(bodyFromRequest)
            const newId = resultObject.body.id;
            expect(+newId).toBeGreaterThan(0)
            const delResponse = await fetch(`http://localhost:5173/api/performer/${newId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth_code}`
                }
            });
            expect(delResponse.status).toBe(200);
        } else {
            assert(false,"unable to parse body of create accompanist request")
        }
    });
});