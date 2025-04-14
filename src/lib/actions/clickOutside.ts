export function clickOutside(node: HTMLElement, options = {}) {
    const handleClick = (event: MouseEvent) => {
        if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
            node.dispatchEvent(new CustomEvent('click_outside', {
                detail: { node }
            }));
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}

// Adiciona a tipagem para o evento
declare global {
    namespace svelteHTML {
        interface HTMLAttributes<T> {
            'on:click_outside'?: (event: CustomEvent<{ node: HTMLElement }>) => void;
        }
    }
} 