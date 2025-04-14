import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validatePassword, createSession, prisma } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  console.log("Recebida requisição de login");
  
  try {
    const body = await request.json();
    console.log("Dados recebidos:", { ...body, password: "[REDACTED]" });
    
    const { email, password } = body;

    console.log("Buscando usuário com email:", email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log("Usuário não encontrado");
      return json({ error: "Usuário não encontrado" }, { status: 400 });
    }

    console.log("Validando senha");
    const validPassword = await validatePassword(password, user.password);
    if (!validPassword) {
      console.log("Senha incorreta");
      return json({ error: "Senha incorreta" }, { status: 400 });
    }

    console.log("Criando sessão para o usuário:", user.id);
    const sessionId = await createSession(user.id);
    
    // Define o cookie de sessão
    console.log("Definindo cookie de sessão");
    cookies.set("session", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    console.log("Login realizado com sucesso");
    return json({ success: true });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}; 