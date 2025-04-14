<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from "$app/navigation";
    import { invalidate } from "$app/navigation";
    import { onMount } from 'svelte';
    import { clickOutside } from '$lib/actions/clickOutside';

    let user = $page.data.user;
    let loading = false;
    let showDropdown = false;
    let menuItems: HTMLElement[] = [];
    let menuButton: HTMLButtonElement;

    function handleKeyDown(event: KeyboardEvent) {
        if (!showDropdown) return;

        const items = menuItems;
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (currentIndex < items.length - 1) {
                    items[currentIndex + 1].focus();
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex - 1].focus();
                }
                break;
            case 'Escape':
                event.preventDefault();
                closeDropdown();
                menuButton?.focus();
                break;
            case 'Tab':
                if (!event.shiftKey && currentIndex === items.length - 1) {
                    closeDropdown();
                } else if (event.shiftKey && currentIndex === 0) {
                    closeDropdown();
                }
                break;
        }
    }

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
                user = null;
                await goto("/login?message=logout_success", { invalidateAll: true });
                setTimeout(() => {
                    const emailInput = document.querySelector<HTMLInputElement>('#email');
                    emailInput?.focus();
                }, 100);
            } else {
                console.error("Erro ao fazer logout:", data.error);
            }
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        } finally {
            loading = false;
        }
    }

    function toggleDropdown() {
        showDropdown = !showDropdown;
        if (showDropdown) {
            // Foca no primeiro item do menu quando abrir
            setTimeout(() => {
                menuItems[0]?.focus();
            }, 100);
        }
    }

    function closeDropdown() {
        showDropdown = false;
    }

    $: user = $page.data.user;
</script>

<div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center space-x-8">
                    <!-- Logo e nome do app -->
                    <a href="/" class="flex items-center space-x-2">
                        <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span class="text-xl font-bold text-gray-900">OnCall Assist</span>
                    </a>

                    <!-- Links de navegação -->
                    {#if user}
                        <div class="flex items-center space-x-4">
                            <a 
                                href="/faq" 
                                class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium {$page.url.pathname === '/faq' ? 'text-indigo-600' : ''}"
                            >
                                FAQ
                            </a>
                        </div>
                    {/if}
                </div>

                <div class="flex items-center">
                    {#if user}
                        <div class="relative" use:clickOutside on:click_outside={closeDropdown}>
                            <!-- Avatar do usuário -->
                            <button 
                                bind:this={menuButton}
                                on:click={toggleDropdown}
                                class="flex items-center focus:outline-none rounded-full focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                aria-expanded={showDropdown ? "true" : "false"}
                                aria-haspopup="true"
                                aria-label="Menu do perfil de {user.name}"
                                id="user-menu-button"
                            >
                                {#if user.image}
                                    <img 
                                        src={user.image} 
                                        alt="" 
                                        class="h-8 w-8 rounded-full ring-2 ring-white"
                                        aria-hidden="true"
                                    />
                                {:else}
                                    <div 
                                        class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white"
                                        aria-hidden="true"
                                    >
                                        {user.name ? user.name[0].toUpperCase() : 'U'}
                                    </div>
                                {/if}
                                <span class="sr-only">Abrir menu do perfil</span>
                            </button>

                            <!-- Menu dropdown -->
                            {#if showDropdown}
                                <div 
                                    class="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="user-menu-button"
                                    on:keydown={handleKeyDown}
                                >
                                    <div 
                                        bind:this={menuItems[0]}
                                        class="px-4 py-2 text-sm text-gray-700 border-b border-gray-100 focus:bg-gray-100 focus:outline-none"
                                        role="menuitem"
                                        tabindex="0"
                                    >
                                        Conectado como {user.name}
                                    </div>
                                    <button
                                        bind:this={menuItems[1]}
                                        on:click={handleLogout}
                                        disabled={loading}
                                        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus:bg-gray-100"
                                        role="menuitem"
                                        tabindex="0"
                                        aria-label={loading ? "Saindo da conta..." : "Sair da conta"}
                                    >
                                        {loading ? "Saindo..." : "Sair"}
                                    </button>
                                </div>
                            {/if}
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