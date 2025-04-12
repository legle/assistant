<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { FAQEntry } from '$lib/functions/faq';
    import MarkdownRenderer from '$lib/MarkdownRenderer.svelte';
    import TagList from './TagList.svelte';
    import ActionButtons from './ActionButtons.svelte';

    export let faq: FAQEntry;
    export let isExpanded: boolean;
    export let selectedTag: string | null;
    export let onToggle: () => void;
    export let onTagSelect: (tag: string) => void;
    export let onShare: () => void;
    export let onEdit: () => void;
    export let onDelete: () => void;
    export let shareSuccess: boolean;
</script>

<div class="bg-white shadow rounded-lg overflow-hidden">
    <div 
        class="p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
        on:click={onToggle}
        on:keydown={(e) => e.key === 'Enter' && onToggle()}
        role="button"
        tabindex="0"
        aria-expanded={isExpanded}
        aria-controls="faq-content-{faq.id}"
    >
        <svg 
            class="w-5 h-5 transform transition-transform {isExpanded ? 'rotate-90' : ''}"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M9 5l7 7-7 7"
            />
        </svg>
        <h2 class="text-xl font-semibold flex-1">{faq.question}</h2>
    </div>
    
    {#if isExpanded}
        <div 
            id="faq-content-{faq.id}"
            class="border-t bg-gray-50"
            transition:slide={{ duration: 300 }}
        >
            <div class="px-4 py-3">
                <div class="prose max-w-none">
                    <MarkdownRenderer message={faq.answer} />
                </div>
                <div class="flex flex-wrap items-center gap-4 mt-4">
                    <TagList 
                        tags={faq.tags} 
                        {selectedTag} 
                        onTagSelect={onTagSelect}
                    />
                    <ActionButtons 
                        {onShare} 
                        {onEdit} 
                        {onDelete} 
                        {shareSuccess}
                    />
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(.prose) {
        max-width: none;
    }
    
    :global(.prose pre) {
        margin: 0;
        padding: 0;
    }
</style> 