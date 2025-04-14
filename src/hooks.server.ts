import { PrismaClient } from '@prisma/client';
import { handleRequest, prisma } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { redirect } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // Inicializa o cliente Prisma
  event.locals.db = prisma;
  
  // Configura a autenticação
  event.locals.auth = handleRequest(event);

  // Proteger rotas que requerem autenticação
  if (event.url.pathname.startsWith("/faq") || event.url.pathname === "/") {
    try {
      const session = await event.locals.auth.validate();
      if (!session) {
        throw redirect(302, "/login");
      }
    } catch (error) {
      console.error("Erro de autenticação:", error);
      throw redirect(302, "/login");
    }
  }

  const response = await resolve(event);
  return response;
}; 