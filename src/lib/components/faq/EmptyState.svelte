<script lang="ts">
    export let selectedTag: string | null;
    export let searchQuery: string;
</script>

<div class="text-center py-8 text-gray-500">
    <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p class="text-xl font-semibold">Nenhuma FAQ encontrada</p>
    <p class="mt-2">
        {#if selectedTag}
            Não há FAQs com a tag "{selectedTag}"{searchQuery ? ' e o termo de busca especificado' : ''}
        {:else}
            Tente buscar por outros termos ou tags
        {/if}
    </p>
</div> 