import {describe, it, expect} from 'vitest';
import {auth_code} from '$env/static/private';


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
        const reader = createResponse.body?.getReader(); // Get the stream reader
        const decoder = new TextDecoder(); // Initialize a TextDecoder for UTF-8 by default
        let result = '';

        while (reader != undefined) {
            const { done, value } = await reader.read(); // Read the stream chunk by chunk
            if (done) break; // Exit the loop if there are no more chunks
            result += decoder.decode(value, { stream: true }); // Decode and append the chunk
        }

        // create object from parsed stream to get id of newly created accompanist
        const resultObject = JSON.parse(result)
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

    });
});