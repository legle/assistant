import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { invalidateSession } from "$lib/server/auth";

export const POST: RequestHandler = async ({ cookies }) => {
  console.log("Recebida requisição de logout");
  
  try {
    const sessionId = cookies.get("session");
    console.log("Session ID:", sessionId);
    
    if (sessionId) {
      console.log("Invalidando sessão");
      await invalidateSession(sessionId);
    }

    // Remove o cookie de sessão independentemente do resultado
    console.log("Removendo cookie de sessão");
    cookies.delete("session", { 
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    console.log("Logout realizado com sucesso");
    return json({ success: true });
  } catch (error) {
    console.error("Erro durante o logout:", error);
    // Ainda assim, remove o cookie
    cookies.delete("session", { 
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    return json({ success: true });
  }
}; 