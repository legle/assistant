<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="min-h-screen bg-gray-50">
    <!-- Barra de navegação -->
    <nav class="bg-[#6200A3] text-white shadow">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <a 
                        href="/" 
                        class="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                        aria-label="Ir para página inicial"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span class="font-semibold">OnCall Assist</span>
                    </a>
                </div>
                <div class="flex items-center gap-6">
                    <a 
                        href="/faq" 
                        class="text-white/80 hover:text-white transition-colors flex items-center gap-1 {$page.url.pathname === '/faq' ? 'text-white font-medium' : ''}"
                        aria-current={$page.url.pathname === '/faq' ? 'page' : undefined}
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>FAQ</span>
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Conteúdo da página -->
    <main>
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