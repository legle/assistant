/// <reference types="node" />

import { json } from '@sveltejs/kit';
import type { RequestHandler, RequestEvent } from './$types';
import { env } from '$env/dynamic/private';
import { faqFunctions } from '$lib/functions/faq';
import { searchFAQ, addFAQ, updateFAQ, listFAQ, deleteFAQ, findFAQToDelete, confirmDeleteFAQ, deleteFAQByText } from '$lib/functions/faqImplementation';

type FunctionName = 'search_faq' | 'add_faq' | 'update_faq' | 'list_faq' | 'delete_faq' | 'find_faq_to_delete' | 'confirm_delete_faq' | 'delete_faq_by_text';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    tags: string[];
}

interface APISuccessResponse {
    success: boolean;
    data: any;
    message: string;
}

interface APIErrorResponse {
    success: boolean;
    error: string;
}

type APIResponse = APISuccessResponse | APIErrorResponse;

function debugLog(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}][DEBUG] ${message}:`, JSON.stringify(data, null, 2));
    } else {
        console.log(`[${timestamp}][DEBUG] ${message}`);
    }
}

function faqLog(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}][FAQ] ${message}:`, JSON.stringify(data, null, 2));
    } else {
        console.log(`[${timestamp}][FAQ] ${message}`);
    }
}

function handleError(error: unknown): APIErrorResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
        success: false,
        error: errorMessage
    };
}

function handleSuccess(data: any, message: string = ''): APISuccessResponse {
    return {
        success: true,
        data,
        message
    };
}

function filterFAQsByTags(faq: FAQ, index: number, tags: string[]): boolean {
    if (!tags || tags.length === 0) return true;
    return tags.every(tag => faq.tags.includes(tag));
}

export const POST: RequestHandler = async ({ request }) => {
    const apiKey = env.OPENAI_API_KEY;
    const baseUrl = env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    
    if (!apiKey) {
        console.error('OPENAI_API_KEY não encontrada nas variáveis de ambiente');
        return json({ error: 'OPENAI_API_KEY não está configurada' }, { status: 500 });
    }

    try {
        const { messages } = await request.json();
        let currentMessages = [...messages];
        let tokensIn = 0;
        let tokensOut = 0;

        // Função para estimar tokens (aproximação mais precisa)
        function estimateTokens(text: string): number {
            if (!text) return 0;
            
            // Regras básicas de tokenização do GPT:
            // 1. Palavras comuns são geralmente 1 token
            // 2. Palavras longas podem ser divididas em subpalavras
            // 3. Pontuação e espaços são tokens separados
            // 4. Números são divididos em dígitos
            
            // Divide o texto em tokens aproximados
            const words = text.split(/\b/);
            let estimate = 0;
            
            for (const word of words) {
                if (!word.trim()) continue; // Ignora espaços em branco
                
                if (word.length <= 4) {
                    // Palavras curtas geralmente são 1 token
                    estimate += 1;
                } else {
                    // Palavras longas são divididas aproximadamente a cada 4 caracteres
                    estimate += Math.ceil(word.length / 4);
                }
                
                // Adiciona tokens para pontuação e espaços
                if (word.match(/[.,!?;:]/)) estimate += 1;
            }
            
            return Math.max(1, estimate); // Garante pelo menos 1 token
        }

        // Conta tokens de entrada
        for (const msg of currentMessages) {
            if (msg.content) tokensIn += estimateTokens(msg.content);
            // Adiciona tokens para metadados (role, etc)
            tokensIn += 4;
        }

        // Verifica se a última mensagem é do usuário
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (lastMessage.role === 'user') {
            debugLog('Recebida mensagem do usuário, buscando na FAQ primeiro', lastMessage);
            
            // Busca na FAQ usando a mensagem do usuário como query
            try {
                const faqResults = await searchFAQ(lastMessage.content);
                if (faqResults && faqResults.length > 0) {
                    // Encontrou resultados na FAQ
                    faqLog('Encontradas respostas na FAQ', faqResults);
                    
                    // Adiciona os resultados da FAQ ao contexto
                    currentMessages.push({
                        role: 'system',
                        content: `Encontrei algumas respostas relevantes na nossa FAQ. Por favor, priorize essas informações na sua resposta:\n\n${
                            faqResults.map(faq => `Pergunta: ${faq.question}\nResposta: ${faq.answer}`).join('\n\n')
                        }`
                    });
                } else {
                    faqLog('Nenhuma resposta encontrada na FAQ');
                    // Adiciona instrução para dar uma resposta genérica
                    currentMessages.push({
                        role: 'system',
                        content: 'Não encontrei respostas específicas na nossa FAQ para esta pergunta. Por favor, forneça uma resposta genérica, mas sugira que o usuário faça perguntas mais específicas se precisar de informações detalhadas.'
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar na FAQ:', error);
            }
        }

        debugLog('Initial messages', currentMessages);

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: currentMessages,
                functions: faqFunctions,
                function_call: 'auto',
                stream: true
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API error:', error);
            throw new Error(error.error?.message || 'Falha ao se comunicar com a OpenAI');
        }

        const reader = response.body?.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        let currentFunction: FunctionName | null = null;
        let currentArguments = '';
        let buffer = '';

        const headers = new Headers({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Tokens-In': tokensIn.toString(),
            'X-Tokens-Out': '0' // Inicializa com zero
        });

        return new Response(
            new ReadableStream({
                async start(controller) {
                    try {
                        if (!reader) {
                            throw new Error('Stream não disponível');
                        }

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                if (buffer.trim()) {
                                    debugLog('Processing final buffer', buffer);
                                    try {
                                        const message = buffer.replace(/^data: /, '');
                                        const parsed = JSON.parse(message);
                                        if (parsed.choices[0].delta?.content) {
                                            const content = parsed.choices[0].delta.content;
                                            tokensOut += estimateTokens(content);
                                            controller.enqueue(encoder.encode(content));
                                        }
                                    } catch (error) {
                                        console.error('Error processing final buffer:', error);
                                    }
                                }
                                headers.set('X-Tokens-Out', tokensOut.toString());
                                break;
                            }

                            const chunk = decoder.decode(value);
                            buffer += chunk;
                            debugLog('Received chunk', { chunk, bufferLength: buffer.length });

                            // Processa linhas completas do buffer
                            let newlineIndex;
                            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                                const line = buffer.slice(0, newlineIndex).trim();
                                buffer = buffer.slice(newlineIndex + 1);

                                if (!line || line === 'data: [DONE]') {
                                    debugLog('Empty line or done marker, skipping');
                                    continue;
                                }

                                // Ignora linhas de evento
                                if (line === 'event:') {
                                    debugLog('Event line, skipping');
                                    continue;
                                }

                                if (!line.startsWith('data: ')) {
                                    debugLog('Unexpected line format', { line, bufferState: buffer });
                                    continue;
                                }

                                const message = line.replace(/^data: /, '');
                                try {
                                    const parsed = JSON.parse(message);
                                    
                                    // Verifica se há choices e se não está vazio
                                    if (!parsed.choices || parsed.choices.length === 0) {
                                        debugLog('No choices in message, skipping', parsed);
                                        continue;
                                    }

                                    const delta = parsed.choices[0].delta;
                                    if (!delta) {
                                        debugLog('No delta in choice, skipping', parsed.choices[0]);
                                        continue;
                                    }

                                    if (delta.function_call) {
                                        if (delta.function_call.name) {
                                            currentFunction = delta.function_call.name as FunctionName;
                                            currentArguments = '';
                                            debugLog('Starting function call', { function: currentFunction });
                                        }

                                        if (delta.function_call.arguments) {
                                            currentArguments += delta.function_call.arguments;
                                            debugLog('Accumulating arguments', { currentArguments });
                                        }

                                        // Verifica se é o último chunk da chamada de função
                                        if (parsed.choices[0].finish_reason === 'function_call' || 
                                            (delta.function_call.arguments && delta.function_call.arguments.endsWith('}'))) {
                                            debugLog('Function call complete', { 
                                                function: currentFunction, 
                                                arguments: currentArguments 
                                            });

                                            try {
                                                const args = JSON.parse(currentArguments);
                                                let result;

                                                debugLog('Executing function', { 
                                                    function: currentFunction, 
                                                    args 
                                                });

                                                // Adiciona a chamada da função às mensagens antes de executá-la
                                                const functionCall = {
                                                    role: 'assistant',
                                                    content: null,
                                                    function_call: {
                                                        name: currentFunction,
                                                        arguments: currentArguments
                                                    }
                                                };
                                                currentMessages.push(functionCall);
                                                debugLog('Added function call to messages', functionCall);

                                                switch (currentFunction) {
                                                    case 'search_faq':
                                                        result = await searchFAQ(args.query, args.tags);
                                                        break;
                                                    case 'add_faq':
                                                        faqLog('=== Iniciando adição de FAQ ===');
                                                        faqLog('Argumentos recebidos', args);
                                                        
                                                        result = await addFAQ(args.question, args.answer, args.tags);
                                                        faqLog('Resultado da adição', result);

                                                        if (!result.success) {
                                                            const errorMessage = `Erro ao adicionar FAQ: ${result.error}`;
                                                            faqLog('ERRO na adição', { error: result.error });
                                                            
                                                            // Adiciona mensagem de erro ao histórico
                                                            const errorFunctionMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify({ error: errorMessage })
                                                            };
                                                            currentMessages.push(errorFunctionMessage);
                                                            faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                            
                                                            controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                        } else {
                                                            faqLog('FAQ adicionado com sucesso');
                                                            
                                                            // Adiciona o resultado bem sucedido ao histórico
                                                            const successMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify(result.data)
                                                            };
                                                            currentMessages.push(successMessage);
                                                            faqLog('Mensagem de sucesso adicionada ao histórico', successMessage);

                                                            // Envia mensagem de sucesso para o usuário
                                                            const successResponse = `FAQ adicionado com sucesso!\nPergunta: ${args.question}\n`;
                                                            controller.enqueue(encoder.encode(successResponse));

                                                            // Atualiza result para conter apenas os dados para o próximo processamento
                                                            result = result.data;
                                                        }
                                                        
                                                        faqLog('=== Finalizando adição de FAQ ===');
                                                        break;
                                                    case 'update_faq':
                                                        result = await updateFAQ(args.id, args);
                                                        break;
                                                    case 'list_faq':
                                                        faqLog('=== Iniciando listagem de FAQ ===');
                                                        faqLog('Argumentos recebidos', args);
                                                        
                                                        try {
                                                            result = await listFAQ(args);
                                                            faqLog('Resultado da listagem', result);

                                                            // Adiciona o resultado ao histórico
                                                            const listMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify(result)
                                                            };
                                                            currentMessages.push(listMessage);
                                                            faqLog('Mensagem de listagem adicionada ao histórico', listMessage);

                                                            // Se não houver FAQs, envia uma mensagem apropriada
                                                            if (result.length === 0) {
                                                                const emptyMessage = 'Nenhuma FAQ encontrada.\n';
                                                                controller.enqueue(encoder.encode(emptyMessage));
                                                            } else {
                                                                // Envia uma confirmação do número de FAQs encontradas
                                                                const countMessage = `Encontradas ${result.length} FAQs.\n`;
                                                                controller.enqueue(encoder.encode(countMessage));
                                                            }
                                                            
                                                            faqLog('Listagem concluída com sucesso');
                                                        } catch (error) {
                                                            const errorMessage = `Erro ao listar FAQs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                                                            faqLog('ERRO na listagem', { error });
                                                            
                                                            // Adiciona mensagem de erro ao histórico
                                                            const errorFunctionMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify({ error: errorMessage })
                                                            };
                                                            currentMessages.push(errorFunctionMessage);
                                                            faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                            
                                                            controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            throw error;
                                                        }
                                                        
                                                        faqLog('=== Finalizando listagem de FAQ ===');
                                                        break;
                                                    case 'delete_faq':
                                                        faqLog('=== Iniciando remoção de FAQ ===');
                                                        faqLog('Argumentos recebidos', args);
                                                        
                                                        try {
                                                            result = await deleteFAQ(args.id);
                                                            faqLog('Resultado da remoção', result);

                                                            // Adiciona o resultado bem sucedido ao histórico
                                                            const successMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify({ success: true })
                                                            };
                                                            currentMessages.push(successMessage);
                                                            faqLog('Mensagem de sucesso adicionada ao histórico', successMessage);

                                                            // Envia mensagem de sucesso para o usuário
                                                            const successResponse = `FAQ removido com sucesso!\n`;
                                                            controller.enqueue(encoder.encode(successResponse));

                                                            // Atualiza result para conter apenas os dados para o próximo processamento
                                                            result = { success: true };
                                                            
                                                            faqLog('FAQ removido com sucesso');
                                                        } catch (error) {
                                                            const errorMessage = `Erro ao remover FAQ: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                                                            faqLog('ERRO na remoção', { error });
                                                            
                                                            // Adiciona mensagem de erro ao histórico
                                                            const errorFunctionMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify({ error: errorMessage })
                                                            };
                                                            currentMessages.push(errorFunctionMessage);
                                                            faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                            
                                                            controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            throw error;
                                                        }
                                                        
                                                        faqLog('=== Finalizando remoção de FAQ ===');
                                                        break;
                                                    case 'find_faq_to_delete':
                                                        faqLog('=== Iniciando busca de FAQ para remoção ===');
                                                        faqLog('Argumentos recebidos', args);
                                                        
                                                        try {
                                                            result = await findFAQToDelete(args.question_text);
                                                            faqLog('Resultado da busca', result);

                                                            if (!result.success) {
                                                                const errorMessage = `Erro ao buscar FAQ: ${result.error}`;
                                                                faqLog('ERRO na busca', { error: result.error });
                                                                
                                                                const errorFunctionMessage = {
                                                                    role: 'function',
                                                                    name: currentFunction,
                                                                    content: JSON.stringify({ error: errorMessage })
                                                                };
                                                                currentMessages.push(errorFunctionMessage);
                                                                faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                                
                                                                controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            } else {
                                                                const faqs = result.data;
                                                                const successMessage = {
                                                                    role: 'function',
                                                                    name: currentFunction,
                                                                    content: JSON.stringify(faqs)
                                                                };
                                                                currentMessages.push(successMessage);
                                                                faqLog('Mensagem de sucesso adicionada ao histórico', successMessage);

                                                                // Envia uma mensagem para o usuário com as FAQs encontradas
                                                                if (faqs.length === 1) {
                                                                    const faq = faqs[0];
                                                                    const foundMessage = `Encontrei esta FAQ:\n\nPergunta: ${faq.question}\nResposta: ${faq.answer}\n\nVocê confirma que deseja removê-la? (Responda com sim ou não)\n`;
                                                                    controller.enqueue(encoder.encode(foundMessage));
                                                                } else {
                                                                    const foundMessage = `Encontrei ${faqs.length} FAQs:\n\n${faqs.map((faq, index) => `${index + 1}. Pergunta: ${faq.question}\nResposta: ${faq.answer}\n`).join('\n')}\nQual delas você deseja remover? (Indique o número)\n`;
                                                                    controller.enqueue(encoder.encode(foundMessage));
                                                                }
                                                            }
                                                            
                                                            faqLog('Busca concluída com sucesso');
                                                        } catch (error) {
                                                            const errorMessage = `Erro ao buscar FAQ: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                                                            faqLog('ERRO na busca', { error });
                                                            
                                                            const errorFunctionMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify({ error: errorMessage })
                                                            };
                                                            currentMessages.push(errorFunctionMessage);
                                                            faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                            
                                                            controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            throw error;
                                                        }
                                                        
                                                        faqLog('=== Finalizando busca de FAQ para remoção ===');
                                                        break;
                                                    case 'confirm_delete_faq':
                                                        faqLog('=== Iniciando confirmação de remoção de FAQ ===');
                                                        faqLog('Argumentos recebidos', args);
                                                        
                                                        try {
                                                            if (!args.confirmed) {
                                                                const cancelMessage = 'Remoção cancelada pelo usuário.';
                                                                faqLog('Remoção cancelada', { confirmed: false });
                                                                
                                                                const cancelFunctionMessage = {
                                                                    role: 'function',
                                                                    name: currentFunction,
                                                                    content: JSON.stringify({ success: false, message: cancelMessage })
                                                                };
                                                                currentMessages.push(cancelFunctionMessage);
                                                                controller.enqueue(encoder.encode(cancelMessage + '\n'));
                                                                break;
                                                            }

                                                            result = await confirmDeleteFAQ(args.id, args.confirmed);
                                                            faqLog('Resultado da confirmação', result);

                                                            if (!result.success) {
                                                                const errorMessage = `Erro ao confirmar remoção: ${result.error}`;
                                                                faqLog('ERRO na confirmação', { error: result.error });
                                                                
                                                                const errorFunctionMessage = {
                                                                    role: 'function',
                                                                    name: currentFunction,
                                                                    content: JSON.stringify({ error: errorMessage })
                                                                };
                                                                currentMessages.push(errorFunctionMessage);
                                                                faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                                
                                                                controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            } else {
                                                                const successMessage = {
                                                                    role: 'function',
                                                                    name: currentFunction,
                                                                    content: JSON.stringify(result.data)
                                                                };
                                                                currentMessages.push(successMessage);
                                                                faqLog('Mensagem de sucesso adicionada ao histórico', successMessage);

                                                                const successResponse = `FAQ removida com sucesso!\n`;
                                                                controller.enqueue(encoder.encode(successResponse));
                                                            }
                                                            
                                                            faqLog('Confirmação concluída com sucesso');
                                                        } catch (error) {
                                                            const errorMessage = `Erro ao confirmar remoção: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                                                            faqLog('ERRO na confirmação', { error });
                                                            
                                                            const errorFunctionMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify({ error: errorMessage })
                                                            };
                                                            currentMessages.push(errorFunctionMessage);
                                                            faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                            
                                                            controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            throw error;
                                                        }
                                                        
                                                        faqLog('=== Finalizando confirmação de remoção de FAQ ===');
                                                        break;
                                                    case 'delete_faq_by_text':
                                                        faqLog('=== Iniciando remoção de FAQ por texto ===');
                                                        faqLog('Argumentos recebidos', args);
                                                        
                                                        try {
                                                            result = await deleteFAQByText(args.question_text);
                                                            faqLog('Resultado da operação', result);

                                                            if (!result.success) {
                                                                const errorMessage = result.error;
                                                                faqLog('ERRO na operação', { error: result.error });
                                                                
                                                                const errorFunctionMessage = {
                                                                    role: 'function',
                                                                    name: currentFunction,
                                                                    content: JSON.stringify({ error: errorMessage })
                                                                };
                                                                currentMessages.push(errorFunctionMessage);
                                                                faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                                
                                                                controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            } else {
                                                                const successMessage = {
                                                                    role: 'function',
                                                                    name: currentFunction,
                                                                    content: JSON.stringify(result)
                                                                };
                                                                currentMessages.push(successMessage);
                                                                faqLog('Mensagem de sucesso adicionada ao histórico', successMessage);

                                                                controller.enqueue(encoder.encode(result.message + '\n'));
                                                            }
                                                            
                                                            faqLog('Operação concluída');
                                                        } catch (error) {
                                                            const errorMessage = `Erro ao remover FAQ: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                                                            faqLog('ERRO na operação', { error });
                                                            
                                                            const errorFunctionMessage = {
                                                                role: 'function',
                                                                name: currentFunction,
                                                                content: JSON.stringify({ error: errorMessage })
                                                            };
                                                            currentMessages.push(errorFunctionMessage);
                                                            faqLog('Mensagem de erro adicionada ao histórico', errorFunctionMessage);
                                                            
                                                            controller.enqueue(encoder.encode(errorMessage + '\n'));
                                                            throw error;
                                                        }
                                                        
                                                        faqLog('=== Finalizando remoção de FAQ por texto ===');
                                                        break;
                                                }

                                                debugLog('Function result', result);

                                                // Faz uma nova chamada ao ChatGPT com o resultado da função
                                                faqLog('Iniciando chamada de follow-up', currentMessages);
                                                const followUpResponse = await fetch(`${baseUrl}/chat/completions`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${apiKey}`
                                                    },
                                                    body: JSON.stringify({
                                                        model: 'gpt-4-turbo-preview',
                                                        messages: currentMessages,
                                                        stream: true
                                                    })
                                                });

                                                if (!followUpResponse.ok) {
                                                    throw new Error('Falha ao processar resultado da função');
                                                }

                                                const followUpReader = followUpResponse.body?.getReader();
                                                if (!followUpReader) {
                                                    throw new Error('Stream de resposta não disponível');
                                                }

                                                let followUpBuffer = '';

                                                while (true) {
                                                    const { done, value } = await followUpReader.read();
                                                    if (done) {
                                                        if (followUpBuffer.trim()) {
                                                            debugLog('Processing final follow-up buffer', followUpBuffer);
                                                            try {
                                                                const message = followUpBuffer.replace(/^data: /, '');
                                                                const parsed = JSON.parse(message);
                                                                if (parsed.choices[0].delta?.content) {
                                                                    controller.enqueue(encoder.encode(parsed.choices[0].delta.content));
                                                                }
                                                            } catch (error) {
                                                                console.error('Error processing final follow-up buffer:', error);
                                                            }
                                                        }
                                                        break;
                                                    }

                                                    const followUpChunk = decoder.decode(value);
                                                    followUpBuffer += followUpChunk;
                                                    debugLog('Received follow-up chunk', { 
                                                        chunk: followUpChunk, 
                                                        bufferLength: followUpBuffer.length 
                                                    });

                                                    let newlineIndex;
                                                    while ((newlineIndex = followUpBuffer.indexOf('\n')) !== -1) {
                                                        const line = followUpBuffer.slice(0, newlineIndex).trim();
                                                        followUpBuffer = followUpBuffer.slice(newlineIndex + 1);

                                                        if (!line || line === 'data: [DONE]') continue;

                                                        if (!line.startsWith('data: ')) {
                                                            debugLog('Unexpected follow-up line format', { 
                                                                line, 
                                                                bufferState: followUpBuffer 
                                                            });
                                                            continue;
                                                        }

                                                        try {
                                                            const followUpData = JSON.parse(line.replace(/^data: /, ''));
                                                            if (followUpData.choices[0].delta?.content) {
                                                                controller.enqueue(encoder.encode(followUpData.choices[0].delta.content));
                                                            }
                                                        } catch (error) {
                                                            console.error('Error parsing follow-up chunk:', error);
                                                        }
                                                    }
                                                }

                                            } catch (error) {
                                                console.error('Erro ao executar função:', error);
                                                controller.enqueue(encoder.encode(
                                                    `Erro ao executar função ${currentFunction}: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n`
                                                ));
                                            }

                                            currentFunction = null;
                                            currentArguments = '';
                                        }
                                    } else if (delta?.content) {
                                        const tokens = estimateTokens(delta.content);
                                        tokensOut += tokens;
                                        headers.set('X-Tokens-Out', tokensOut.toString());
                                        controller.enqueue(encoder.encode(delta.content));
                                    }
                                } catch (error) {
                                    console.error('Error processing message:', error);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Stream processing error:', error);
                        controller.error(error);
                    } finally {
                        headers.set('X-Tokens-Out', tokensOut.toString());
                        controller.close();
                    }
                }
            }),
            { headers }
        );
    } catch (error) {
        console.error('Request error:', error);
        return json(
            { error: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}; 