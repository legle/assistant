<script lang="ts">
    import { onMount } from 'svelte';
    import type { FAQEntry } from '$lib/functions/faq';
    import SearchFilters from '$lib/components/faq/SearchFilters.svelte';
    import FAQItem from '$lib/components/faq/FAQItem.svelte';
    import FAQModal from '$lib/components/faq/FAQModal.svelte';
    import EmptyState from '$lib/components/faq/EmptyState.svelte';

    let faqs: FAQEntry[] = [];
    let loading = true;
    let error = '';
    let showAddModal = false;
    let editingFaq: FAQEntry | null = null;
    let expandedFaqId: string | null = null;
    let shareSuccess = false;
    let shareTimeout: NodeJS.Timeout;
    let searchQuery = '';
    let selectedTag: string | null = null;
    let addFaqButtonRef: HTMLButtonElement;
    let lastFocusedElement: HTMLElement | null = null;

    // FAQs filtradas baseadas na busca e tag selecionada
    $: filteredFaqs = faqs.filter(faq => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
            faq.question.toLowerCase().includes(query) ||
            faq.tags.some(tag => tag.toLowerCase().includes(query));
        
        const matchesTag = !selectedTag || faq.tags.includes(selectedTag);
        
        return matchesSearch && matchesTag;
    });

    // Lista única de todas as tags disponíveis
    $: availableTags = [...new Set(faqs.flatMap(faq => 
        faq.tags.map(tag => tag.toLowerCase())
    ))].sort();

    onMount(() => {
        loadFAQs();
        const urlParams = new URLSearchParams(window.location.search);
        const tagFromUrl = urlParams.get('tag');
        if (tagFromUrl) {
            selectedTag = tagFromUrl.toLowerCase();
        }
        const hash = window.location.hash.slice(1);
        if (hash) {
            expandedFaqId = hash;
        }
    });

    async function loadFAQs() {
        try {
            loading = true;
            const response = await fetch('/api/faq');
            if (!response.ok) throw new Error('Falha ao carregar FAQs');
            faqs = await response.json();
            console.log('FAQs carregadas:', faqs);
            console.log('Tags disponíveis:', availableTags);
        } catch (e) {
            error = e instanceof Error ? e.message : 'Erro desconhecido';
            console.error('Erro ao carregar FAQs:', e);
        } finally {
            loading = false;
        }
    }

    async function handleAdd(data: { question: string; answer: string; tags: string[] }) {
        try {
            const response = await fetch('/api/faq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Falha ao adicionar FAQ');
            
            await loadFAQs();
            showAddModal = false;
        } catch (e) {
            error = e instanceof Error ? e.message : 'Erro desconhecido';
        }
    }

    async function handleEdit(data: { question: string; answer: string; tags: string[] }) {
        if (!editingFaq) return;
        
        try {
            const response = await fetch(`/api/faq/${editingFaq.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Falha ao atualizar FAQ');
            
            await loadFAQs();
            editingFaq = null;
        } catch (e) {
            error = e instanceof Error ? e.message : 'Erro desconhecido';
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja remover esta FAQ?')) return;
        
        try {
            const response = await fetch(`/api/faq/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Falha ao remover FAQ');
            
            await loadFAQs();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Erro desconhecido';
        }
    }

    function toggleFaq(id: string) {
        expandedFaqId = expandedFaqId === id ? null : id;
        if (expandedFaqId) {
            window.history.replaceState(null, '', `#${id}`);
        } else {
            window.history.replaceState(null, '', window.location.pathname);
        }
    }

    async function handleShare(id: string) {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        
        try {
            await navigator.clipboard.writeText(url);
            shareSuccess = true;
            
            if (shareTimeout) clearTimeout(shareTimeout);
            
            shareTimeout = setTimeout(() => {
                shareSuccess = false;
            }, 2000);
        } catch (e) {
            error = 'Falha ao copiar o link';
        }
    }

    function handleModalOpen() {
        lastFocusedElement = document.activeElement as HTMLElement;
        showAddModal = true;
    }

    function handleModalClose() {
        showAddModal = false;
        editingFaq = null;
        lastFocusedElement?.focus();
    }
</script>

<svelte:head>
    <title>OnCall Assist - Perguntas Frequentes (FAQ)</title>
    <meta name="description" content="Base de conhecimento e perguntas frequentes" />
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-[#6200A3]">Perguntas Frequentes</h1>
        <button
            bind:this={addFaqButtonRef}
            class="btn-primary px-4 py-2 rounded"
            on:click={handleModalOpen}
        >
            Adicionar FAQ
        </button>
    </div>

    <SearchFilters
        bind:searchQuery
        bind:selectedTag
        availableTags={availableTags}
    />

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
        </div>
    {/if}

    {#if loading}
        <div class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    {:else}
        {#if filteredFaqs.length === 0}
            <EmptyState {selectedTag} {searchQuery} />
        {:else}
            <div class="grid gap-2">
                {#each filteredFaqs as faq (faq.id)}
                    <FAQItem
                        {faq}
                        isExpanded={expandedFaqId === faq.id}
                        {selectedTag}
                        onToggle={() => toggleFaq(faq.id)}
                        onTagSelect={(tag) => selectedTag = tag}
                        onShare={() => handleShare(faq.id)}
                        onEdit={() => editingFaq = faq}
                        onDelete={() => handleDelete(faq.id)}
                        {shareSuccess}
                    />
                {/each}
            </div>
        {/if}
    {/if}
</div>

<FAQModal
    show={showAddModal || editingFaq !== null}
    {editingFaq}
    {availableTags}
    onClose={handleModalClose}
    onSave={(data) => editingFaq ? handleEdit(data) : handleAdd(data)}
/> 