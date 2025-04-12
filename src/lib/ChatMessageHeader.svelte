<script lang="ts">
    export let role: 'user' | 'assistant' | 'system';

    const roleLabels = {
        user: 'User',
        assistant: 'Assistant',
        system: 'System'
    };
</script>

<div class="message-header">
    <h3>{roleLabels[role]}</h3>
</div>

<style>
    .message-header h3 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #4b5563;
    }
</style> 