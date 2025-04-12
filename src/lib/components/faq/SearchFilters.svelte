<script lang="ts">
    export let searchQuery: string;
    export let selectedTag: string | null;
    export let availableTags: string[];
    
    let showTagDropdown = false;
    let tagSearchQuery = '';
    let tagInputRef: HTMLInputElement;
    let dropdownRef: HTMLDivElement;
    let activeDescendantId: string | null = null;
    let highlightedIndex = -1;

    // Tags filtradas para o dropdown de busca
    $: filteredTags = availableTags.filter(tag => 
        !tagSearchQuery || tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );

    function handleTagSelect(tag: string | null) {
        selectedTag = tag;
        showTagDropdown = false;
        tagSearchQuery = '';
        
        // Atualiza a URL com a tag selecionada
        if (browser) {
            const url = new URL(window.location.href);
            if (tag) {
                url.searchParams.set('tag', tag);
            } else {
                url.searchParams.delete('tag');
            }
            window.history.replaceState({}, '', url);
        }
    }

    function handleTagKeydown(event: KeyboardEvent) {
        const items = filteredTags;
        const itemCount = items.length + (selectedTag ? 1 : 0);

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!showTagDropdown) {
                    showTagDropdown = true;
                    highlightedIndex = 0;
                } else {
                    highlightedIndex = (highlightedIndex + 1) % itemCount;
                }
                updateActiveDescendant();
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (!showTagDropdown) {
                    showTagDropdown = true;
                    highlightedIndex = itemCount - 1;
                } else {
                    highlightedIndex = (highlightedIndex - 1 + itemCount) % itemCount;
                }
                updateActiveDescendant();
                break;

            case 'Enter':
                event.preventDefault();
                if (showTagDropdown && highlightedIndex >= 0) {
                    if (selectedTag && highlightedIndex === 0) {
                        handleTagSelect(null);
                    } else {
                        const actualIndex = selectedTag ? highlightedIndex - 1 : highlightedIndex;
                        handleTagSelect(items[actualIndex]);
                    }
                } else {
                    showTagDropdown = true;
                }
                break;

            case 'Escape':
                event.preventDefault();
                showTagDropdown = false;
                tagSearchQuery = '';
                highlightedIndex = -1;
                break;

            case 'Tab':
                showTagDropdown = false;
                tagSearchQuery = '';
                highlightedIndex = -1;
                break;

            default:
                if (!showTagDropdown) {
                    showTagDropdown = true;
                }
        }
    }

    function updateActiveDescendant() {
        if (highlightedIndex === -1) {
            activeDescendantId = null;
        } else if (selectedTag && highlightedIndex === 0) {
            activeDescendantId = 'tag-clear-option';
        } else {
            const actualIndex = selectedTag ? highlightedIndex - 1 : highlightedIndex;
            activeDescendantId = `tag-option-${actualIndex}`;
        }
    }

    // Fecha o dropdown quando clicar fora
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node) && 
            tagInputRef && !tagInputRef.contains(event.target as Node)) {
            showTagDropdown = false;
        }
    }

    // Adiciona/remove listener de clique fora ao montar/desmontar
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';

    onMount(() => {
        if (browser) {
            document.addEventListener('click', handleClickOutside);
        }
    });
    onDestroy(() => {
        if (browser) {
            document.removeEventListener('click', handleClickOutside);
        }
    });
</script>

<div class="mb-6 space-y-4">
    <!-- Campo de busca -->
    <div class="relative">
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Buscar por pergunta..."
            class="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 ring-primary focus:border-transparent"
            aria-label="Buscar FAQs"
        />
        <svg 
            class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    </div>

    <!-- Seletor de tags -->
    <div class="relative">
        <div
            class="relative"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={showTagDropdown}
            aria-controls="tag-listbox"
            aria-owns="tag-listbox"
        >
            <input
                type="text"
                bind:this={tagInputRef}
                bind:value={tagSearchQuery}
                on:focus={() => showTagDropdown = true}
                on:keydown={handleTagKeydown}
                aria-activedescendant={activeDescendantId}
                aria-autocomplete="list"
                aria-label="Filtrar por tag"
                class="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 ring-primary focus:border-transparent"
                placeholder={selectedTag || "Buscar e selecionar tag..."}
            />
            <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label={showTagDropdown ? "Fechar lista de tags" : "Abrir lista de tags"}
                on:click={() => showTagDropdown = !showTagDropdown}
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>

        {#if showTagDropdown}
            <div
                id="tag-listbox"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
                role="listbox"
                aria-label="Lista de tags disponíveis"
                bind:this={dropdownRef}
            >
                <div class="max-h-60 overflow-y-auto">
                    {#if selectedTag}
                        <div
                            id="tag-clear-option"
                            role="option"
                            aria-selected={highlightedIndex === 0}
                            class="px-4 py-2 text-primary hover:bg-gray-100 cursor-pointer {highlightedIndex === 0 ? 'bg-gray-100' : ''}"
                            on:click={() => handleTagSelect(null)}
                            on:mouseenter={() => highlightedIndex = 0}
                        >
                            Limpar seleção
                        </div>
                    {/if}
                    
                    {#each filteredTags as tag, i}
                        {@const actualIndex = selectedTag ? i + 1 : i}
                        <div
                            id="tag-option-{i}"
                            role="option"
                            aria-selected={selectedTag === tag}
                            class="px-4 py-2 hover:bg-gray-100 cursor-pointer {highlightedIndex === actualIndex ? 'bg-gray-100' : ''} {selectedTag === tag ? 'font-medium' : ''}"
                            on:click={() => handleTagSelect(tag)}
                            on:mouseenter={() => highlightedIndex = actualIndex}
                        >
                            {tag}
                        </div>
                    {/each}

                    {#if filteredTags.length === 0}
                        <div class="px-4 py-2 text-gray-500 italic">
                            Nenhuma tag encontrada
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div> 