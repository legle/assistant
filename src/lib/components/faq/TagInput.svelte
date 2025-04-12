<script lang="ts">
    export let value: string;
    export let availableTags: string[];
    export let placeholder = "Digite para ver tags existentes ou criar novas tags...";

    let showTagsAutocomplete = false;
    let currentTagInput = '';
    let tagAutocompleteHighlightIndex = 0;
    let inputRef: HTMLInputElement;
    let dropdownRef: HTMLDivElement;

    // Normaliza as tags iniciais
    $: {
        const tags = value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (tags.length > 0) {
            const normalizedValue = tags.join(', ') + (value.endsWith(', ') ? ' ' : '');
            if (normalizedValue !== value) {
                value = normalizedValue;
            }
        }
    }

    $: tagSuggestions = currentTagInput
        ? availableTags
            .map(tag => tag.toLowerCase())
            .filter(tag => 
                tag.includes(currentTagInput.toLowerCase()) &&
                !value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).includes(tag)
            )
            .slice(0, 5)
        : [];

    function handleTagInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const val = input.value;
        const lastCommaIndex = val.lastIndexOf(',');
        
        currentTagInput = lastCommaIndex >= 0 
            ? val.slice(lastCommaIndex + 1).trim()
            : val.trim();
            
        showTagsAutocomplete = currentTagInput.length > 0;
        tagAutocompleteHighlightIndex = 0;
    }

    function handleTagsKeydown(event: KeyboardEvent) {
        if (!showTagsAutocomplete) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (tagSuggestions.length > 0) {
                    tagAutocompleteHighlightIndex = (tagAutocompleteHighlightIndex + 1) % tagSuggestions.length;
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (tagSuggestions.length > 0) {
                    tagAutocompleteHighlightIndex = tagAutocompleteHighlightIndex <= 0 
                        ? tagSuggestions.length - 1 
                        : tagAutocompleteHighlightIndex - 1;
                }
                break;
            case 'Enter':
                event.preventDefault();
                if (tagAutocompleteHighlightIndex >= 0 && tagSuggestions.length > 0) {
                    insertTag(tagSuggestions[tagAutocompleteHighlightIndex]);
                } else if (currentTagInput.trim()) {
                    insertTag(currentTagInput.trim());
                }
                break;
            case 'Escape':
                event.preventDefault();
                showTagsAutocomplete = false;
                tagAutocompleteHighlightIndex = -1;
                break;
            case ',':
                if (currentTagInput.trim()) {
                    event.preventDefault();
                    insertTag(currentTagInput.trim());
                }
                break;
        }
    }

    function insertTag(tag: string) {
        const normalizedTag = tag.toLowerCase();
        const lastCommaIndex = value.lastIndexOf(',');
        const baseTags = lastCommaIndex >= 0 ? value.slice(0, lastCommaIndex + 1) : '';
        const currentTags = baseTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        
        if (!currentTags.includes(normalizedTag)) {
            value = currentTags.length > 0 
                ? `${currentTags.join(', ')}, ${normalizedTag}`
                : normalizedTag;
        }
        
        showTagsAutocomplete = false;
        currentTagInput = '';
        
        if (!value.endsWith(', ')) {
            value += ', ';
        }
        
        setTimeout(() => {
            if (inputRef) {
                inputRef.focus();
                inputRef.setSelectionRange(value.length, value.length);
            }
        }, 0);
    }

    // Fecha o dropdown quando clicar fora
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node) && 
            inputRef && !inputRef.contains(event.target as Node)) {
            showTagsAutocomplete = false;
        }
    }

    import { onMount, onDestroy } from 'svelte';
    onMount(() => {
        document.addEventListener('click', handleClickOutside);
    });
    onDestroy(() => {
        document.removeEventListener('click', handleClickOutside);
    });
</script>

<div class="relative">
    <div role="combobox" aria-expanded={showTagsAutocomplete} aria-haspopup="listbox" aria-controls="tag-suggestions">
        <input
            type="text"
            bind:this={inputRef}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            bind:value
            on:input={handleTagInput}
            on:keydown={handleTagsKeydown}
            on:focus={handleTagInput}
            aria-autocomplete="list"
            aria-controls="tag-suggestions"
            aria-activedescendant={tagAutocompleteHighlightIndex >= 0 ? `tag-suggestion-${tagAutocompleteHighlightIndex}` : undefined}
            {placeholder}
        />
    </div>
    
    {#if showTagsAutocomplete}
        <div 
            id="tag-suggestions"
            class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            role="listbox"
            bind:this={dropdownRef}
        >
            <div class="sr-only" role="status" aria-live="assertive">
                {#if tagSuggestions.length > 0}
                    {tagSuggestions[0]} selecionada. Use as setas para navegar.
                {:else if currentTagInput}
                    Nenhuma tag encontrada. Pressione Enter para criar uma nova tag.
                {/if}
            </div>
            {#if tagSuggestions.length > 0}
                {#each tagSuggestions as tag, index}
                    <div
                        id="tag-suggestion-{index}"
                        role="option"
                        aria-selected={tagAutocompleteHighlightIndex === index}
                        class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer
                            {tagAutocompleteHighlightIndex === index ? 'bg-gray-100' : ''}"
                        on:click={() => insertTag(tag)}
                        on:mouseenter={() => tagAutocompleteHighlightIndex = index}
                    >
                        {tag}
                    </div>
                {/each}
            {:else if currentTagInput.trim()}
                <div class="px-4 py-2 text-gray-600 italic">
                    Pressione Enter para adicionar "{currentTagInput.trim()}" como nova tag
                </div>
            {/if}
        </div>
    {/if}
</div> 