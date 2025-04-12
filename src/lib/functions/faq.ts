export interface FAQEntry {
    id: string;
    question: string;
    answer: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export const faqFunctions = [
    {
        name: "search_faq",
        description: "Busca perguntas frequentes na base de conhecimento usando texto ou tags",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Texto para buscar nas perguntas e respostas"
                },
                tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de tags para filtrar os resultados"
                }
            },
            required: ["query"]
        }
    },
    {
        name: "delete_faq_by_text",
        description: "Encontra e remove uma FAQ baseado no texto da pergunta. Use esta função quando o usuário pedir para remover uma FAQ.",
        parameters: {
            type: "object",
            properties: {
                question_text: {
                    type: "string",
                    description: "Texto da pergunta que se deseja remover"
                }
            },
            required: ["question_text"]
        }
    },
    {
        name: "add_faq",
        description: "Adiciona uma nova pergunta frequente à base de conhecimento",
        parameters: {
            type: "object",
            properties: {
                question: {
                    type: "string",
                    description: "A pergunta a ser adicionada"
                },
                answer: {
                    type: "string",
                    description: "A resposta para a pergunta"
                },
                tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de tags relacionadas à pergunta"
                }
            },
            required: ["question", "answer"]
        }
    },
    {
        name: "list_faq",
        description: "Lista todas as perguntas frequentes, opcionalmente filtradas por tags",
        parameters: {
            type: "object",
            properties: {
                tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de tags para filtrar os resultados"
                },
                limit: {
                    type: "number",
                    description: "Número máximo de resultados a retornar"
                },
                offset: {
                    type: "number",
                    description: "Número de resultados a pular (para paginação)"
                }
            }
        }
    }
]; 