<script lang="ts">
	import ChatMessage from "./ChatMessage.svelte";
	import { onMount, afterUpdate } from 'svelte';

	interface Message {
		role: 'user' | 'assistant' | 'system';
		content: string;
	}

	export let messages: Message[] = [];
	let chatHistoryDiv: HTMLDivElement;

	function scrollToBottom() {
		if (chatHistoryDiv) {
			chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
		}
	}

	// Scroll para baixo quando as mensagens são atualizadas
	$: if (messages) {
		setTimeout(scrollToBottom, 0);
	}

	// Scroll para baixo quando o componente é montado
	onMount(() => {
		scrollToBottom();
	});
</script>

<div class="chat-history" bind:this={chatHistoryDiv} aria-live="polite" role="log">
	{#each messages as message}
		<div class:typing={message.role === 'assistant' && message.content === 'Escrevendo...'}>
			<ChatMessage {message} />
		</div>
	{/each}
</div>

<style>
	.chat-history {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		overflow-y: auto;
		max-height: calc(100vh - 200px); /* Ajuste este valor conforme necessário */
	}

	.typing {
		opacity: 0.7;
		font-style: italic;
	}
</style>
