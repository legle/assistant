<script lang="ts">
    export let tokensIn = 0;
    export let tokensOut = 0;
    export let isSubmitting = false;
    export let consecutiveErrors = 0;

    // Calcula o custo aproximado (usando preços do GPT-3.5)
    $: costIn = (tokensIn / 1000) * 0.0015;  // $0.0015 por 1K tokens de entrada
    $: costOut = (tokensOut / 1000) * 0.002;  // $0.002 por 1K tokens de saída
    $: totalCost = costIn + costOut;

    // Formata o número com separadores de milhar
    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }
</script>

<div class="status-bar">
    <div class="status-section">
        <span class="status-label">Tokens enviados:</span>
        <span class="status-value">{formatNumber(tokensIn)}</span>
    </div>
    <div class="status-section">
        <span class="status-label">Tokens recebidos:</span>
        <span class="status-value">{formatNumber(tokensOut)}</span>
    </div>
    <div class="status-section">
        <span class="status-label">Custo estimado:</span>
        <span class="status-value">${totalCost.toFixed(4)}</span>
    </div>
    {#if isSubmitting}
        <div class="status-indicator submitting">
            <span class="dot-flashing"></span>
            Processando
        </div>
    {:else if consecutiveErrors > 0}
        <div class="status-indicator error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            Erro de conexão
        </div>
    {:else}
        <div class="status-indicator connected">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Conectado
        </div>
    {/if}
</div>

<style>
    .status-bar {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 0.75rem 1rem;
        background-color: #f8f9fa;
        border-top: 1px solid #e9ecef;
        font-size: 0.875rem;
        color: #495057;
    }

    .status-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-label {
        color: #6c757d;
    }

    .status-value {
        font-family: monospace;
        font-weight: 500;
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: auto;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-weight: 500;
    }

    .status-indicator svg {
        width: 1rem;
        height: 1rem;
    }

    .connected {
        background-color: #d1fae5;
        color: #065f46;
    }

    .submitting {
        background-color: #e0f2fe;
        color: #0369a1;
    }

    .error {
        background-color: #fee2e2;
        color: #991b1b;
    }

    .dot-flashing {
        position: relative;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: currentColor;
        animation: dot-flashing 1s infinite linear alternate;
        animation-delay: .5s;
    }

    .dot-flashing::before, .dot-flashing::after {
        content: '';
        display: inline-block;
        position: absolute;
        top: 0;
    }

    .dot-flashing::before {
        left: -12px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: currentColor;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 0s;
    }

    .dot-flashing::after {
        left: 12px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: currentColor;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 1s;
    }

    @keyframes dot-flashing {
        0% {
            opacity: 0.2;
        }
        100% {
            opacity: 1;
        }
    }
</style> 