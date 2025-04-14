import { PrismaClient } from "@prisma/client";
import { Argon2id } from "oslo/password";
import { dev } from "$app/environment";

const prisma = new PrismaClient();

// Função para gerar hash de senha
export const generatePasswordHash = async (password: string) => {
  return await new Argon2id().hash(password);
};

// Função para validar senha
export const validatePassword = async (password: string, hash: string | null) => {
  console.log("Validando senha");
  if (!hash) {
    console.log("Hash não fornecido");
    return false;
  }
  try {
    console.log("Verificando hash com Argon2id");
    const isValid = await new Argon2id().verify(hash, password);
    console.log("Resultado da validação:", isValid);
    return isValid;
  } catch (error) {
    console.error("Erro ao validar senha:", error);
    return false;
  }
};

// Função para criar uma sessão
export const createSession = async (userId: string) => {
  console.log("Criando sessão para o usuário:", userId);
  const sessionId = crypto.randomUUID();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // Sessão válida por 7 dias

  try {
    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        expires
      }
    });
    console.log("Sessão criada com sucesso:", sessionId);
    return sessionId;
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    throw error;
  }
};

// Função para validar uma sessão
export const validateSession = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session) return null;
  if (session.expires < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return null;
  }

  return session;
};

// Função para invalidar uma sessão
export const invalidateSession = async (sessionId: string) => {
  console.log("Invalidando sessão:", sessionId);
  try {
    // Primeiro verifica se a sessão existe
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      console.log("Sessão não encontrada");
      return;
    }

    await prisma.session.delete({
      where: { id: sessionId }
    });
    console.log("Sessão invalidada com sucesso");
  } catch (error) {
    console.error("Erro ao invalidar sessão:", error);
    // Não lança o erro, apenas loga
    console.error("Detalhes do erro:", error);
  }
};

// Função para lidar com requisições de autenticação
export const handleRequest = (event: any) => {
  return {
    validate: async () => {
      const sessionId = event.cookies.get("session");
      if (!sessionId) return null;
      
      const session = await validateSession(sessionId);
      return session;
    }
  };
};

// Exporta o cliente Prisma
export { prisma }; 