import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateFAQ, deleteFAQ } from '$lib/functions/faqImplementation';

export const PUT: RequestHandler = async ({ params, request }) => {
    try {
        const { question, answer, tags } = await request.json();
        const faq = await updateFAQ(params.id, { question, answer, tags });
        return json(faq);
    } catch (error) {
        console.error('Error updating FAQ:', error);
        return json({ error: 'Falha ao atualizar FAQ' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        await deleteFAQ(params.id);
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        return json({ error: 'Falha ao remover FAQ' }, { status: 500 });
    }
}; 