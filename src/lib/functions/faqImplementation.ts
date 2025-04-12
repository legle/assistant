import { PrismaClient, type FAQ as PrismaFAQ, type Tag as PrismaTag } from '@prisma/client';
import type { FAQEntry } from './faq';

// Singleton do PrismaClient para evitar múltiplas conexões
declare global {
    var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

interface LanguageConfig {
    stopWords: Set<string>;
    commonCorrections: { [key: string]: string };
    relatedTerms: { [key: string]: string[] };
}

// Configurações específicas de idioma movidas para um módulo separado
const languageConfigs: { [lang: string]: LanguageConfig } = {
    'pt': {
        stopWords: new Set([
            'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
            'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
            'em', 'que', 'é', 'esse', 'esta', 'este', 'tal',
            'ele', 'ela', 'isso', 'isto', 'aquilo', 'este', 'esta',
            'esse', 'essa', 'como'
        ]),
        commonCorrections: {
            'funsiona': 'funciona',
            'funciona': 'funciona',
            'funcion': 'funciona',
            'funsion': 'funciona',
            'interaje': 'interage',
            'interag': 'interage',
            'enterag': 'interage',
            'enteraj': 'interage'
        },
        relatedTerms: {
            'funciona': ['interage', 'trabalha', 'opera', 'executa'],
            'interage': ['funciona', 'trabalha', 'conecta', 'comunica'],
            'bookworm': ['sistema', 'ferramenta', 'aplicação', 'programa']
        }
    },
    'en': {
        stopWords: new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about',
            'into', 'over', 'after', 'is', 'it', 'its', 'this', 'that',
            'these', 'those', 'he', 'she', 'they', 'we', 'you', 'how'
        ]),
        commonCorrections: {
            'funcionality': 'functionality',
            'funcion': 'function',
            'interacts': 'interact',
            'interacting': 'interact'
        },
        relatedTerms: {
            'function': ['work', 'operate', 'run', 'execute'],
            'interact': ['function', 'work', 'connect', 'communicate'],
            'bookworm': ['system', 'tool', 'application', 'program']
        }
    }
};

// Função para detectar o idioma do texto (implementação básica)
function detectLanguage(text: string): 'pt' | 'en' {
    // Conta palavras específicas de cada idioma para fazer uma estimativa
    const ptIndicators = ['de', 'da', 'do', 'das', 'dos', 'como', 'que', 'é'];
    const enIndicators = ['the', 'of', 'to', 'in', 'is', 'how', 'what', 'why'];
    
    const words = text.toLowerCase().split(/\s+/);
    let ptCount = 0;
    let enCount = 0;
    
    words.forEach(word => {
        if (ptIndicators.includes(word)) ptCount++;
        if (enIndicators.includes(word)) enCount++;
    });
    
    return ptCount >= enCount ? 'pt' : 'en';
}

// Função para normalizar texto independente de idioma
function normalizeText(text: string, lang: 'pt' | 'en'): string {
    const config = languageConfigs[lang];
    
    const normalized = text
        .toLowerCase()
        // Remove acentos (útil para qualquer idioma que use acentos)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Remove pontuação (universal)
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        // Remove espaços extras (universal)
        .replace(/\s+/g, ' ')
        .trim();
    
    // Remove stopwords específicas do idioma
    return normalized
        .split(' ')
        .filter(word => !config.stopWords.has(word))
        .join(' ');
}

// Função para corrigir erros comuns específicos do idioma
function correctCommonTypos(word: string, lang: 'pt' | 'en'): string {
    const config = languageConfigs[lang];
    return config.commonCorrections[word] || word;
}

// Função para expandir termos relacionados específicos do idioma
function expandRelatedTerms(word: string, lang: 'pt' | 'en'): string[] {
    const config = languageConfigs[lang];
    const correctedWord = correctCommonTypos(word, lang);
    const related = config.relatedTerms[correctedWord] || [];
    return [correctedWord, ...related];
}

// Função auxiliar para calcular similaridade entre strings
function calculateSimilarity(str1: string, str2: string, lang: 'pt' | 'en'): number {
    const s1 = normalizeText(str1, lang);
    const s2 = normalizeText(str2, lang);
    
    // Divide em palavras
    const words1 = s1.split(' ').map(w => w.trim()).filter(w => w.length > 0);
    const words2 = s2.split(' ').map(w => w.trim()).filter(w => w.length > 0);
    
    // Expande cada palavra com seus termos relacionados
    const expandedWords1 = new Set(words1.flatMap(w => expandRelatedTerms(w, lang)));
    const expandedWords2 = new Set(words2.flatMap(w => expandRelatedTerms(w, lang)));
    
    // Se há sobreposição significativa entre os conjuntos expandidos
    const intersection = new Set([...expandedWords1].filter(x => expandedWords2.has(x)));
    const union = new Set([...expandedWords1, ...expandedWords2]);
    
    // Calcula similaridade base usando coeficiente de Jaccard
    let similarity = intersection.size / union.size;
    
    // Aumenta a similaridade se houver palavras exatamente iguais
    const exactMatches = words1.filter(w => words2.includes(w)).length;
    if (exactMatches > 0) {
        similarity += 0.2 * (exactMatches / Math.max(words1.length, words2.length));
    }
    
    // Aumenta a similaridade se uma string contém a outra
    if (s1.includes(s2) || s2.includes(s1)) {
        similarity += 0.3;
    }
    
    // Limita o resultado entre 0 e 1
    return Math.min(1, similarity);
}

export async function searchFAQ(query: string, tags?: string[]) {
    try {
        // Detecta o idioma da query
        const lang = detectLanguage(query);
        
        // Primeiro, busca todas as FAQs que possam ser relevantes
        const faqs = await prisma.fAQ.findMany({
            where: {
                AND: [
                    tags ? {
                        tags: {
                            some: {
                                name: {
                                    in: tags
                                }
                            }
                        }
                    } : {}
                ]
            },
            include: {
                tags: true
            }
        });

        // Filtra e ordena os resultados por similaridade
        const results = faqs
            .map(faq => {
                // Detecta o idioma da FAQ para comparação apropriada
                const faqLang = detectLanguage(faq.question);
                return {
                    ...faq,
                    similarity: Math.max(
                        calculateSimilarity(query, faq.question, faqLang),
                        // Dá um peso menor para matches no corpo da resposta
                        calculateSimilarity(query, faq.answer, faqLang) * 0.8
                    )
                };
            })
            .filter(faq => faq.similarity > 0.2)
            .sort((a, b) => b.similarity - a.similarity)
            .map(faq => ({
                ...faq,
                tags: faq.tags.map(tag => tag.name),
                created_at: faq.created_at.toISOString(),
                updated_at: faq.updated_at.toISOString()
            }));

        return results;
    } catch (error) {
        console.error('Error searching FAQ:', error);
        throw new Error('Failed to search FAQs');
    }
}

export async function addFAQ(question: string, answer: string, tags: string[] = []) {
    try {
        const faq = await prisma.fAQ.create({
            data: {
                question,
                answer,
                tags: {
                    connectOrCreate: tags.map(tag => ({
                        where: { name: tag },
                        create: { name: tag }
                    }))
                }
            },
            include: {
                tags: true
            }
        });

        return {
            success: true,
            data: {
                ...faq,
                tags: faq.tags.map(tag => tag.name),
                created_at: faq.created_at.toISOString(),
                updated_at: faq.updated_at.toISOString()
            }
        };
    } catch (error) {
        console.error('Error adding FAQ:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Falha ao adicionar pergunta frequente'
        };
    }
}

export async function updateFAQ(id: string, data: Partial<FAQEntry>) {
    try {
        const { tags, ...updateData } = data;
        
        const faq = await prisma.fAQ.update({
            where: { id },
            data: {
                ...updateData,
                ...(tags && {
                    tags: {
                        set: [], // Remove todas as tags existentes
                        connectOrCreate: tags.map(tag => ({
                            where: { name: tag },
                            create: { name: tag }
                        }))
                    }
                })
            },
            include: {
                tags: true
            }
        });

        return {
            ...faq,
            tags: faq.tags.map(tag => tag.name),
            created_at: faq.created_at.toISOString(),
            updated_at: faq.updated_at.toISOString()
        };
    } catch (error) {
        console.error('Error updating FAQ:', error);
        throw new Error('Falha ao atualizar pergunta frequente');
    }
}

export async function listFAQ(options: { tags?: string[], limit?: number, offset?: number } = {}) {
    try {
        const { tags, limit = 100, offset = 0 } = options;

        const faqs = await prisma.fAQ.findMany({
            where: tags ? {
                tags: {
                    some: {
                        name: {
                            in: tags
                        }
                    }
                }
            } : undefined,
            include: {
                tags: true
            },
            take: limit,
            skip: offset,
            orderBy: {
                created_at: 'desc'
            }
        });

        return faqs.map(faq => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            tags: faq.tags.map(tag => tag.name),
            created_at: faq.created_at.toISOString(),
            updated_at: faq.updated_at.toISOString()
        }));
    } catch (error) {
        console.error('Error listing FAQs:', error);
        throw new Error('Failed to list FAQs');
    }
}

export async function deleteFAQ(id: string) {
    try {
        await prisma.fAQ.delete({
            where: { id }
        });
        return true;
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        throw new Error('Falha ao remover pergunta frequente');
    }
}

export async function findFAQToDelete(questionText: string) {
    try {
        // Busca FAQs que correspondam ao texto da pergunta usando contains
        const faqs = await prisma.fAQ.findMany({
            where: {
                OR: [
                    {
                        question: {
                            contains: questionText.toLowerCase()
                        }
                    },
                    {
                        question: {
                            contains: questionText.toUpperCase()
                        }
                    },
                    {
                        question: {
                            contains: questionText
                        }
                    }
                ]
            },
            include: {
                tags: true
            }
        });

        if (faqs.length === 0) {
            return {
                success: false,
                error: 'Nenhuma FAQ encontrada com esse texto'
            };
        }

        // Se encontrou mais de uma, retorna todas para o usuário escolher
        const formattedFaqs = faqs.map(faq => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            tags: faq.tags.map(tag => tag.name),
            created_at: faq.created_at.toISOString(),
            updated_at: faq.updated_at.toISOString()
        }));

        const response = {
            success: true,
            data: formattedFaqs,
            message: faqs.length === 1 
                ? `Encontrei esta FAQ:\n\nPergunta: ${formattedFaqs[0].question}\nResposta: ${formattedFaqs[0].answer}\n\nID: ${formattedFaqs[0].id}\n\nVocê confirma que deseja removê-la? (Responda com sim ou não)`
                : `Encontrei ${faqs.length} FAQs:\n\n${formattedFaqs.map((faq, index) => `${index + 1}. [ID: ${faq.id}]\nPergunta: ${faq.question}\nResposta: ${faq.answer}\n`).join('\n')}\nQual delas você deseja remover? (Indique o número)`
        };

        return response;
    } catch (error) {
        console.error('Error finding FAQ to delete:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao buscar FAQ para remoção'
        };
    }
}

export async function confirmDeleteFAQ(id: string, confirmed: boolean) {
    if (!confirmed) {
        return {
            success: false,
            error: 'Remoção cancelada pelo usuário'
        };
    }

    try {
        const faq = await prisma.fAQ.findUnique({
            where: { id },
            include: { tags: true }
        });

        if (!faq) {
            return {
                success: false,
                error: 'FAQ não encontrada'
            };
        }

        await prisma.fAQ.delete({
            where: { id }
        });

        return {
            success: true,
            data: {
                ...faq,
                tags: faq.tags.map(tag => tag.name),
                created_at: faq.created_at.toISOString(),
                updated_at: faq.updated_at.toISOString()
            }
        };
    } catch (error) {
        console.error('Error confirming FAQ deletion:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao confirmar remoção da FAQ'
        };
    }
}

export async function deleteFAQByText(questionText: string) {
    try {
        // Busca FAQs que correspondam ao texto da pergunta
        const faqs = await prisma.fAQ.findMany({
            where: {
                OR: [
                    {
                        question: {
                            contains: questionText.toLowerCase()
                        }
                    },
                    {
                        question: {
                            contains: questionText.toUpperCase()
                        }
                    },
                    {
                        question: {
                            contains: questionText
                        }
                    }
                ]
            },
            include: {
                tags: true
            }
        });

        if (faqs.length === 0) {
            return {
                success: false,
                error: 'Nenhuma FAQ encontrada com esse texto'
            };
        }

        if (faqs.length > 1) {
            return {
                success: false,
                error: `Encontradas ${faqs.length} FAQs com esse texto. Por favor, seja mais específico:\n\n${faqs.map((faq, index) => `${index + 1}. Pergunta: ${faq.question}\nResposta: ${faq.answer}\n`).join('\n')}`
            };
        }

        // Se chegou aqui, encontrou exatamente uma FAQ
        const faq = faqs[0];

        // Remove a FAQ
        await prisma.fAQ.delete({
            where: { id: faq.id }
        });

        return {
            success: true,
            data: {
                ...faq,
                tags: faq.tags.map(tag => tag.name),
                created_at: faq.created_at.toISOString(),
                updated_at: faq.updated_at.toISOString()
            },
            message: `FAQ removida com sucesso:\nPergunta: ${faq.question}`
        };
    } catch (error) {
        console.error('Error deleting FAQ by text:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao remover FAQ'
        };
    }
} 