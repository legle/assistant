<script lang="ts">
  import LoginForm from "$lib/components/LoginForm.svelte";
  import { page } from "$app/stores";

  // Verifica se há uma mensagem na URL
  $: message = $page.url.searchParams.get('message');
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Entre na sua conta
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Ou
        <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
          crie uma nova conta
        </a>
      </p>
    </div>

    {#if message === 'logout_success'}
      <div 
        class="rounded-md bg-green-50 p-4" 
        role="alert"
        aria-live="polite"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg 
              class="h-5 w-5 text-green-400" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              aria-hidden="true"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p 
              class="text-sm font-medium text-green-800"
              id="logout-message"
            >
              Logout realizado com sucesso!
            </p>
          </div>
        </div>
      </div>
    {/if}

    <LoginForm />
  </div>
</div> 