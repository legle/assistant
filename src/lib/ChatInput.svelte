<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let message = '';
	export let isSubmitting = false;
	const dispatch = createEventDispatcher();

	let textarea: HTMLTextAreaElement;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			if (event.shiftKey) {
				// Permite quebra de linha com Shift+Enter
				return;
			}
			
			// Previne a quebra de linha padrão do Enter
			event.preventDefault();
			
			if (message.trim() !== '' && !isSubmitting) {
				dispatch('submit', { message });
				message = '';
			}
		}
	}

	function handleSubmit() {
		if (message.trim() !== '' && !isSubmitting) {
			dispatch('submit', { message });
			message = '';
		}
	}

	export function focus() {
		textarea?.focus();
	}
</script>

<div class="chat-input-container">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="textarea-wrapper">
			<textarea
				bind:this={textarea}
				class="chat-textarea"
				bind:value={message}
				placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
				rows="1"
				on:keydown={handleKeydown}
				aria-label="Campo de mensagem"
			></textarea>
			<button 
				type="submit" 
				class="send-button" 
				disabled={isSubmitting || message.trim() === ''}
				aria-label={isSubmitting ? "Aguarde, processando mensagem anterior..." : "Enviar mensagem"}
			>
				<span class="sr-only">
					{isSubmitting ? "Aguarde, processando mensagem anterior..." : "Enviar mensagem"}
				</span>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="send-icon" aria-hidden="true">
					<path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
				</svg>
			</button>
		</div>
	</form>
</div>

<style>
	.chat-input-container {
		padding: 1rem;
		background-color: #fff;
		border-top: 1px solid #e5e7eb;
	}

	.textarea-wrapper {
		position: relative;
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.chat-textarea {
		flex: 1;
		min-height: 24px;
		max-height: 200px;
		padding: 0.75rem;
		padding-right: 3rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.25rem;
		resize: none;
		overflow-y: auto;
		transition: all 0.2s ease;
	}

	.chat-textarea:focus {
		outline: none;
		border-color: #6200A3;
		background-color: #fff;
		box-shadow: 0 0 0 2px rgba(98, 0, 163, 0.1);
	}

	.send-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0.5rem;
		background-color: #6200A3;
		border: none;
		border-radius: 0.5rem;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.send-button:hover:not(:disabled) {
		background-color: #4B0080;
		transform: translateY(-1px);
	}

	.send-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.send-button:disabled {
		background-color: #e5e7eb;
		cursor: not-allowed;
	}

	.send-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Classe utilitária para esconder visualmente elementos mantendo-os acessíveis para leitores de tela */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Ajusta a altura do textarea automaticamente baseado no conteúdo */
	:global(.chat-textarea) {
		height: auto !important;
	}
</style>
