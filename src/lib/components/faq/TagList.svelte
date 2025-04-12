<script lang="ts">
    export let tags: string[];
    export let selectedTag: string | null;
    export let onTagSelect: (tag: string) => void;
</script>

<div class="flex gap-2">
    {#each tags as tag}
        <button
            class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm transition-colors hover:bg-gray-200 {selectedTag === tag ? 'ring-2 ring-primary' : ''}"
            on:click|stopPropagation={() => onTagSelect(tag)}
            aria-pressed={selectedTag === tag}
        >
            {tag}
            {#if selectedTag === tag}
                <span class="sr-only">(selecionado)</span>
            {/if}
        </button>
    {/each}
</div> 