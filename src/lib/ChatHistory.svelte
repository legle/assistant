<script lang="ts">
	import ChatMessage from "./ChatMessage.svelte";

	interface Message {
		role: 'user' | 'assistant' | 'system';
		content: string;
	}

	export let messages: Message[] = [];
</script>

<div class="chat-history" aria-live="polite" role="log">
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
	}

	.typing {
		opacity: 0.7;
		font-style: italic;
	}
</style>
