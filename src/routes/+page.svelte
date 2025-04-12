<script lang="ts">
	import ChatHistory from '$lib/ChatHistory.svelte';
	import ChatInput from '$lib/ChatInput.svelte';
	import ChatStatus from '$lib/components/ChatStatus.svelte';

	interface Message {
		role: 'user' | 'assistant' | 'system';
		content: string;
	}

	let messages: Message[] = [];
	let isSubmitting = false;
	let currentAssistantMessage = '';
	let chatInput: ChatInput;
	let consecutiveErrors = 0;
	let tokensIn = 0;
	let tokensOut = 0;

	// Timeout de 10 minutos (mesmo do servidor)
	const FETCH_TIMEOUT = 10 * 60 * 1000;
	const MAX_RETRIES = 3;
	const INITIAL_RETRY_DELAY = 1000; // 1 segundo

	async function sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function fetchWithRetry(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
		try {
			const response = await fetch(url, options);
			
			// Se a requisição foi bem sucedida, reseta o contador de erros consecutivos
			if (response.ok) {
				consecutiveErrors = 0;
			}
			
			// Se for um erro 500, tentamos novamente
			if (response.status === 500 && retryCount < MAX_RETRIES) {
				const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
				consecutiveErrors++;
				
				if (consecutiveErrors >= MAX_RETRIES) {
					// Se atingimos o máximo de erros consecutivos, mantemos a mensagem parcial (se houver)
					// e adicionamos a mensagem de erro
					if (currentAssistantMessage) {
						messages = messages.map((msg, i) => 
							i === messages.length - 1
								? { ...msg, content: currentAssistantMessage + '\n\n[Erro: Falha após múltiplas tentativas]' }
								: msg
						);
					}
					throw new Error('Falha após múltiplas tentativas de reconexão');
				}
				
				// Atualiza a mensagem do sistema informando a nova tentativa
				messages = messages.map((msg, i) => 
					i === messages.length - 1
						? { ...msg, content: `Reconectando... Tentativa ${retryCount + 1} de ${MAX_RETRIES}` }
						: msg
				);
				
				await sleep(delay);
				return fetchWithRetry(url, options, retryCount + 1);
			}

			return response;
		} catch (error) {
			if (error instanceof Error) {
				// Se for um erro de rede e ainda temos tentativas
				if (error.name === 'TypeError' && retryCount < MAX_RETRIES) {
					const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
					consecutiveErrors++;
					
					if (consecutiveErrors >= MAX_RETRIES) {
						// Se atingimos o máximo de erros consecutivos, mantemos a mensagem parcial (se houver)
						// e adicionamos a mensagem de erro
						if (currentAssistantMessage) {
							messages = messages.map((msg, i) => 
								i === messages.length - 1
									? { ...msg, content: currentAssistantMessage + '\n\n[Erro: Falha após múltiplas tentativas]' }
									: msg
							);
						}
						throw new Error('Falha após múltiplas tentativas de reconexão');
					}
					
					// Atualiza a mensagem do sistema informando a nova tentativa
					messages = messages.map((msg, i) => 
						i === messages.length - 1
							? { ...msg, content: `Erro de conexão. Reconectando... Tentativa ${retryCount + 1} de ${MAX_RETRIES}` }
							: msg
					);
					
					await sleep(delay);
					return fetchWithRetry(url, options, retryCount + 1);
				}
			}
			throw error;
		}
	}

	async function handleSubmit(event: CustomEvent<{ message: string }>) {
		const userMessage = event.detail.message;
		
		// Adiciona mensagem do usuário ao histórico
		messages = [...messages, { role: 'user', content: userMessage }];
		
		// Adiciona mensagem temporária do assistente
		messages = [...messages, { role: 'assistant', content: 'Escrevendo...' }];
		
		isSubmitting = true;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

		try {
			const response = await fetchWithRetry('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: messages.slice(0, -1) // Envia todas as mensagens exceto a última temporária
				}),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
			}

			// Obtém os tokens da requisição dos headers
			const tokensInHeader = response.headers.get('X-Tokens-In');
			const tokensOutHeader = response.headers.get('X-Tokens-Out');
			
			if (tokensInHeader) tokensIn = parseInt(tokensInHeader);
			if (tokensOutHeader) tokensOut = parseInt(tokensOutHeader);

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('Stream não disponível');
			}

			currentAssistantMessage = '';
			const decoder = new TextDecoder();
			
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						// Atualiza os tokens de saída com o valor final do header
						const finalTokensOut = response.headers.get('X-Tokens-Out');
						if (finalTokensOut) tokensOut = parseInt(finalTokensOut);
						break;
					}

					const chunk = decoder.decode(value);
					currentAssistantMessage += chunk;

					// Atualiza os tokens de saída com o valor parcial do header
					const partialTokensOut = response.headers.get('X-Tokens-Out');
					if (partialTokensOut) tokensOut = parseInt(partialTokensOut);
				}

				// Atualiza a mensagem apenas quando todo o conteúdo foi recebido
				messages = messages.map((msg, i) => 
					i === messages.length - 1 
						? { ...msg, content: currentAssistantMessage }
						: msg
				);
			} catch (streamError) {
				consecutiveErrors++;
				
				if (consecutiveErrors >= MAX_RETRIES) {
					// Se atingimos o máximo de erros consecutivos, mantemos a mensagem parcial
					// e adicionamos a mensagem de erro
					if (currentAssistantMessage) {
						messages = messages.map((msg, i) => 
							i === messages.length - 1 
								? { ...msg, content: currentAssistantMessage + '\n\n[Erro: A conexão foi interrompida e não foi possível recuperar]' }
								: msg
						);
					}
				} else {
					// Se ainda não atingimos o máximo, voltamos para "Escrevendo..."
					messages = messages.map((msg, i) => 
						i === messages.length - 1 
							? { ...msg, content: 'Escrevendo...' }
							: msg
					);
					throw streamError; // Permite que o retry aconteça
				}
			}
		} catch (error) {
			console.error('Error:', error);
			let errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
			
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					errorMessage = 'A conexão excedeu o tempo limite. Por favor, tente uma mensagem mais curta ou tente novamente.';
				} else {
					errorMessage = error.message;
				}
			}

			// Se não atingimos o máximo de erros consecutivos, mantemos a mensagem como "Escrevendo..."
			if (consecutiveErrors < MAX_RETRIES) {
				messages = messages.map((msg, i) => 
					i === messages.length - 1
						? { ...msg, content: 'Escrevendo...' }
						: msg
				);
			} else {
				// Se atingimos o máximo, mostramos a mensagem de erro
				messages = [...messages.slice(0, -1), {
					role: 'system',
					content: errorMessage
				}];
			}
		} finally {
			clearTimeout(timeoutId);
			isSubmitting = false;
			if (consecutiveErrors < MAX_RETRIES) {
				currentAssistantMessage = '';
			}
		}
	}
</script>

<svelte:head>
	<title>OnCall Assist - Chat de Suporte</title>
	<meta name="description" content="Assistente virtual para suporte técnico" />
</svelte:head>

<main class="container">
	<header>
		<p class="description text-gray-600 text-lg text-center max-w-2xl mx-auto mb-8">
			Assistente virtual para ajudar em situações de plantão. Use o chat abaixo para fazer perguntas
			e receber assistência.
		</p>
	</header>

	<div class="chat-container bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
		<ChatHistory {messages} />
		<ChatInput 
			bind:this={chatInput}
			on:submit={handleSubmit} 
			{isSubmitting}
		/>
		<ChatStatus 
			{tokensIn}
			{tokensOut}
			{isSubmitting}
			{consecutiveErrors}
		/>
	</div>
</main>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.chat-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	:global(.typing) {
		opacity: 0.6;
	}
</style>
