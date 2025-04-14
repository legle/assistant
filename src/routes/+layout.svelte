<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from "$app/navigation";
    import { invalidate } from "$app/navigation";

    let user = $page.data.user;
    let loading = false;

    async function handleLogout(event: Event) {
        event.preventDefault();
        console.log("Iniciando processo de logout");
        
        loading = true;
        try {
            console.log("Enviando requisição para /api/auth/logout");
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            console.log("Resposta recebida:", response.status);
            const data = await response.json();
            console.log("Dados recebidos:", data);

            if (response.ok) {
                console.log("Logout realizado com sucesso");
                // Invalida os dados do usuário
                await invalidate('app:user');
                // Redireciona para a página de login
                await goto("/login");
            } else {
                console.error("Erro ao fazer logout:", data.error);
            }
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        } finally {
            loading = false;
        }
    }

    $: user = $page.data.user;
</script>

<div class="min-h-screen bg-gray-50">
    <!-- Barra de navegação -->
    <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex">
                    <div class="flex-shrink-0 flex items-center">
                        <a 
                            href="/" 
                            class="text-xl font-bold text-indigo-600"
                        >
                            FAQ App
                        </a>
                    </div>
                </div>

                <div class="flex items-center">
                    {#if user}
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                {#if user.image}
                                    <img src={user.image} alt={user.name || "Avatar"} class="h-8 w-8 rounded-full" />
                                {/if}
                                <span class="text-gray-700">{user.name}</span>
                            </div>
                            <form on:submit|preventDefault={handleLogout}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? "Saindo..." : "Sair"}
                                </button>
                            </form>
                        </div>
                    {:else}
                        <div class="space-x-4">
                            <a
                                href="/login"
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Entrar
                            </a>
                            <a
                                href="/register"
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Registrar
                            </a>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </nav>

    <!-- Conteúdo da página -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <slot />
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    :global(.btn-primary) {
        @apply bg-[#6200A3] hover:bg-[#4B0080] text-white;
    }

    :global(.btn-primary-outline) {
        @apply border-[#6200A3] text-[#6200A3] hover:bg-[#6200A3] hover:text-white;
    }

    :global(.text-primary) {
        @apply text-[#6200A3];
    }

    :global(.ring-primary) {
        @apply ring-[#6200A3];
    }
</style> 