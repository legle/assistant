<script lang="ts">
	import hljs from "highlight.js";
	import { marked } from "marked";
    import DOMPurify from "dompurify";
	import { onMount } from "svelte";
    import "highlight.js/styles/github-dark.css";

    export let message = "";
    let formatedMessage = "";

    // Função para envolver blocos de código com um wrapper que inclui o botão de cópia
    function wrapCodeBlocks(html: string): string {
        return html.replace(
            /<pre><code class="(.*?)">([\s\S]*?)<\/code><\/pre>/g,
            '<div class="code-block-wrapper"><pre><code class="$1">$2</code></pre><button class="copy-button" title="Copy to clipboard">Copy</button></div>'
        );
    }

    marked.setOptions({
        gfm: true,
        breaks: true,
        highlight: function(code: string, lang: string) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {
                    console.warn('Error highlighting code:', err);
                    return code;
                }
            }
            return hljs.highlightAuto(code).value;
        }
    });

    const renderMessage = () => {
        try {
            const renderedMarkdown = marked(message);
            const sanitized = DOMPurify.sanitize(renderedMarkdown, {
                ADD_ATTR: ['target'],
                ADD_TAGS: ['button']
            });
            formatedMessage = wrapCodeBlocks(sanitized);
        } catch (err) {
            console.error('Error rendering markdown:', err);
            formatedMessage = DOMPurify.sanitize(message);
        }
    };

    function handleCopyClick(event: MouseEvent) {
        const button = event.target as HTMLButtonElement;
        const wrapper = button.closest('.code-block-wrapper');
        if (wrapper) {
            const codeElement = wrapper.querySelector('code');
            if (codeElement) {
                const textToCopy = codeElement.textContent || '';
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Feedback visual temporário
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    button.textContent = 'Error!';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                });
            }
        }
    }

    onMount(() => {
        renderMessage();
        // Adiciona event listeners para os botões de cópia após a renderização
        const buttons = document.querySelectorAll('.copy-button');
        buttons.forEach(button => {
            button.addEventListener('click', handleCopyClick);
        });

        return () => {
            // Limpa os event listeners quando o componente é destruído
            buttons.forEach(button => {
                button.removeEventListener('click', handleCopyClick);
            });
        };
    });

    $: message, renderMessage();
</script>

<div class="markdown-content">
    {@html formatedMessage}
</div>

<style>
    .markdown-content {
        line-height: 1.5;
        overflow-x: auto;
    }

    .markdown-content :global(.code-block-wrapper) {
        position: relative;
        margin: 1rem 0;
    }

    .markdown-content :global(pre) {
        padding: 1rem;
        border-radius: 4px;
        background-color: #1e1e1e;
        overflow-x: auto;
        margin: 0;  /* Removido margin aqui pois agora está no wrapper */
    }

    .markdown-content :global(.copy-button) {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.25rem 0.5rem;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #fff;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
        opacity: 0;
    }

    .markdown-content :global(.code-block-wrapper:hover .copy-button) {
        opacity: 1;
    }

    .markdown-content :global(.copy-button:hover) {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .markdown-content :global(.copy-button:active) {
        transform: scale(0.95);
    }

    .markdown-content :global(code) {
        font-family: 'Fira Code', monospace;
        font-size: 0.9em;
    }

    .markdown-content :global(p) {
        margin: 0.5rem 0;
    }

    .markdown-content :global(a) {
        color: #0066cc;
        text-decoration: none;
    }

    .markdown-content :global(a:hover) {
        text-decoration: underline;
    }

    .markdown-content :global(ul), .markdown-content :global(ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    .markdown-content :global(blockquote) {
        border-left: 4px solid #ddd;
        margin: 0.5rem 0;
        padding-left: 1rem;
        color: #666;
    }

    .markdown-content :global(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
    }

    .markdown-content :global(th), .markdown-content :global(td) {
        border: 1px solid #ddd;
        padding: 0.5rem;
    }
</style>