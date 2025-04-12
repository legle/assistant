import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listFAQ, addFAQ } from '$lib/functions/faqImplementation';

export const GET: RequestHandler = async () => {
    try {
        const faqs = await listFAQ({ limit: 100 }); // Listar até 100 FAQs por padrão
        return json(faqs);
    } catch (error) {
        console.error('Error listing FAQs:', error);
        return json({ error: 'Falha ao listar FAQs' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { question, answer, tags } = await request.json();
        
        if (!question || !answer) {
            return json(
                { error: 'Pergunta e resposta são obrigatórios' },
                { status: 400 }
            );
        }

        const faq = await addFAQ(question, answer, tags);
        return json(faq);
    } catch (error) {
        console.error('Error creating FAQ:', error);
        return json({ error: 'Falha ao criar FAQ' }, { status: 500 });
    }
}; 