<script lang="ts">
    import ChatMessageHeader from "./ChatMessageHeader.svelte";
    import MarkdownRenderer from "./MarkdownRenderer.svelte";

    interface Message {
        role: 'user' | 'assistant' | 'system';
        content: string;
    }

    export let message: Message;
</script>

<div class="message {message.role}-message">
    <ChatMessageHeader role={message.role} />
    <MarkdownRenderer message={message.content} />
</div>

<style>
    .message {
        padding: 1rem;
        border-radius: 0.5rem;
        max-width: 85%;
    }

    .user-message {
        background-color: #f0f0f0;
        margin-left: auto;
    }

    .assistant-message {
        background-color: rgba(98, 0, 163, 0.05);
        margin-right: auto;
    }

    .system-message {
        background-color: #fff5f5;
        font-style: italic;
        opacity: 0.8;
        margin: 0 auto;
        max-width: 95%;
    }
</style> 