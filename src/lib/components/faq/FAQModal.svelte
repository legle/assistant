<script lang="ts">
    import type { FAQEntry } from '$lib/functions/faq';
    import MarkdownRenderer from '$lib/MarkdownRenderer.svelte';
    import TagInput from '$lib/components/faq/TagInput.svelte';

    export let show: boolean;
    export let editingFaq: FAQEntry | null = null;
    export let availableTags: string[];
    export let onClose: () => void;
    export let onSave: (data: { question: string; answer: string; tags: string[] }) => void;

    let newQuestion = '';
    let newAnswer = '';
    let newTags = '';
    let previewAnswer = '';
    let modalTitleRef: HTMLHeadingElement;
    let questionInputRef: HTMLInputElement;

    $: if (editingFaq) {
        newQuestion = editingFaq.question;
        newAnswer = editingFaq.answer;
        newTags = editingFaq.tags.join(', ');
    }

    function handleSave() {
        onSave({
            question: newQuestion,
            answer: newAnswer,
            tags: newTags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
        });
        resetForm();
    }

    function resetForm() {
        newQuestion = '';
        newAnswer = '';
        newTags = '';
        previewAnswer = '';
    }

    function togglePreview() {
        previewAnswer = previewAnswer ? '' : newAnswer;
    }

    function handleEscapeKey(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            onClose();
        }
    }

    function handleModalKeydown(event: KeyboardEvent) {
        const modal = event.currentTarget as HTMLElement;
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0] as HTMLElement;
        const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.key === 'Tab') {
            if (event.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    event.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    event.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    }
</script>

{#if show}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        on:keydown={handleModalKeydown}
    >
        <div 
            class="bg-white rounded-lg p-6 w-full max-w-2xl"
            on:keydown={handleEscapeKey}
        >
            <h2 
                id="modal-title"
                bind:this={modalTitleRef}
                class="text-2xl font-bold mb-4"
                tabindex="-1"
            >
                {editingFaq ? 'Editar FAQ' : 'Adicionar FAQ'}
            </h2>
            
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="question">
                    Pergunta
                </label>
                <input
                    type="text"
                    id="question"
                    bind:this={questionInputRef}
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    bind:value={newQuestion}
                />
            </div>
            
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="answer">
                    Resposta (suporta markdown)
                </label>
                {#if previewAnswer}
                    <div class="shadow border rounded w-full p-4 min-h-[8rem] bg-gray-50">
                        <MarkdownRenderer message={previewAnswer} />
                    </div>
                {:else}
                    <textarea
                        id="answer"
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 font-mono"
                        bind:value={newAnswer}
                        placeholder="Você pode usar markdown aqui. Exemplo:
# Título
**negrito** _itálico_

\`\`\`python
def exemplo():
    return 'código com syntax highlighting'
\`\`\`

* Lista
* De
* Items

[Link](https://exemplo.com)"
                    ></textarea>
                {/if}
            </div>
            
            <div class="mb-6 relative">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="tags">
                    Tags (separadas por vírgula)
                </label>
                <TagInput 
                    bind:value={newTags} 
                    {availableTags} 
                />
            </div>

            <div class="flex justify-end mb-6">
                <button
                    class="text-blue-500 hover:text-blue-600 text-sm"
                    on:click={togglePreview}
                    aria-label={previewAnswer ? 'Voltar para edição' : 'Visualizar resposta formatada'}
                >
                    {previewAnswer ? 'Editar' : 'Preview'}
                </button>
            </div>
            
            <div class="flex justify-end gap-4">
                <button
                    class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                    on:click={onClose}
                >
                    Cancelar
                </button>
                <button
                    class="btn-primary px-4 py-2 rounded"
                    on:click={handleSave}
                >
                    {editingFaq ? 'Salvar' : 'Adicionar'}
                </button>
            </div>
        </div>
    </div>
{/if} 