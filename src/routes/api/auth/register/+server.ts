import { json } from "@sveltejs/kit";
import { generatePasswordHash, prisma } from "$lib/server/auth";
import type { RequestHandler } from "./$types";
import type { Prisma } from "@prisma/client";

export const POST: RequestHandler = async ({ request }) => {
  console.log("Recebida requisição de registro");
  
  try {
    const body = await request.json();
    console.log("Dados recebidos:", { ...body, password: "[REDACTED]" });
    
    const { email, password, name, image } = body;

    // Validações básicas
    if (!email || !password || !name) {
      console.log("Campos obrigatórios faltando");
      return json({ error: "Email, senha e nome são obrigatórios" }, { status: 400 });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Formato de email inválido");
      return json({ error: "Formato de email inválido" }, { status: 400 });
    }

    // Validar tamanho da senha
    if (password.length < 6) {
      console.log("Senha muito curta");
      return json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    // Verificar se o usuário já existe
    console.log("Verificando se o usuário já existe");
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log("Usuário já existe");
      return json({ error: "Email já cadastrado" }, { status: 400 });
    }

    // Hash da senha
    console.log("Gerando hash da senha");
    const hashedPassword = await generatePasswordHash(password);

    // Criar novo usuário
    console.log("Criando novo usuário");
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: null,
        image: image || null
      }
    });

    console.log("Usuário criado com sucesso:", { id: user.id, email: user.email, name: user.name });
    
    return json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image
      }
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}; 