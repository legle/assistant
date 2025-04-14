<script lang="ts">
  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  async function handleSubmit(event: Event) {
    event.preventDefault();
    console.log("Formulário de login submetido");
    console.log("Dados do formulário:", { email, password: "[REDACTED]" });

    loading = true;
    error = "";

    try {
      console.log("Enviando requisição para /api/auth/login");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      console.log("Resposta recebida:", response.status);
      const data = await response.json();
      console.log("Dados recebidos:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      console.log("Login realizado com sucesso! Redirecionando...");
      // Redirecionar para a página principal após o login
      window.location.href = "/";
    } catch (e) {
      console.error("Erro ao fazer login:", e);
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = "Erro ao fazer login";
      }
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit} class="space-y-4">
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
    <input
      type="email"
      id="email"
      bind:value={email}
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>

  <div>
    <label for="password" class="block text-sm font-medium text-gray-700">Senha</label>
    <input
      type="password"
      id="password"
      bind:value={password}
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>

  {#if error}
    <div class="text-red-600 text-sm" role="alert">{error}</div>
  {/if}

  <button
    type="submit"
    disabled={loading}
    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
  >
    {loading ? "Entrando..." : "Entrar"}
  </button>
</form> 