<script lang="ts">
    export let onShare: () => void;
    export let onEdit: () => void;
    export let onDelete: () => void;
    export let shareSuccess: boolean;
</script>

<div class="flex gap-2 ml-auto" role="group" aria-label="Ações da FAQ">
    <button
        class="inline-flex items-center gap-1 text-[#6200A3] hover:text-[#4B0080]"
        on:click|stopPropagation={onShare}
        aria-label="Compartilhar link para esta FAQ"
    >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>{shareSuccess ? 'Copiado!' : 'Compartilhar'}</span>
    </button>
    <button
        class="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600"
        on:click|stopPropagation={onEdit}
        aria-label="Editar esta FAQ"
    >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>Editar</span>
    </button>
    <button
        class="inline-flex items-center gap-1 text-red-500 hover:text-red-600"
        on:click|stopPropagation={onDelete}
        aria-label="Remover esta FAQ"
    >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Remover</span>
    </button>
</div> 