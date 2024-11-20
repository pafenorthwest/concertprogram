import { json } from '@sveltejs/kit';
import {auth_code} from '$env/static/private';

export async function POST({ request }) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        // remove first 6 chars 'Basic ' and trim whitespace
        const submittedAuthCode = authHeader.slice(6).trim();

        if (submittedAuthCode !== auth_code) {
            return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json(); // Parse the JSON body of the request

        // Process the data as needed
        const responseMessage = `Received message with size: ${data.message.length}`;

        return json({ status: 'success', message: responseMessage });
    } catch {
        return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
    }
}

export async function GET(event) {
    const performances = {'tag': 'big fat nothing'}

    return json(performances);
}