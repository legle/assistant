import type { LayoutServerLoad } from "./$types";
import { validateSession } from "$lib/server/auth";

export const load: LayoutServerLoad = async ({ cookies }) => {
  const sessionId = cookies.get("session");
  
  if (!sessionId) {
    return { user: null };
  }

  const session = await validateSession(sessionId);
  
  if (!session) {
    return { user: null };
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      isAdmin: session.user.isAdmin
    }
  };
}; 