<script lang="ts">
  let email = "";
  let password = "";
  let confirmPassword = "";
  let name = "";
  let error = "";
  let success = "";
  let loading = false;

  function validateForm() {
    if (!email || !password || !confirmPassword || !name) {
      error = "Todos os campos são obrigatórios";
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error = "Formato de email inválido";
      return false;
    }

    if (password.length < 6) {
      error = "A senha deve ter pelo menos 6 caracteres";
      return false;
    }

    if (password !== confirmPassword) {
      error = "As senhas não coincidem";
      return false;
    }

    return true;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    console.log("Formulário submetido");
    console.log("Dados do formulário:", { 
      email, 
      name,  
      password: "[REDACTED]", 
      confirmPassword: "[REDACTED]" 
    });
    
    if (!validateForm()) {
      console.log("Validação falhou:", error);
      return;
    }

    loading = true;
    error = "";
    success = "";

    try {
      console.log("Enviando requisição para /api/auth/register");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, name })
      });

      console.log("Resposta recebida:", response.status);
      const data = await response.json();
      console.log("Dados recebidos:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      success = "Conta criada com sucesso! Redirecionando...";
      console.log("Sucesso! Redirecionando em 2 segundos...");
      
      // Redirecionar para a página de login após o registro
      setTimeout(() => {
        console.log("Redirecionando para /login");
        window.location.href = "/login";
      }, 2000);
    } catch (e: unknown) {
      console.error("Erro ao criar conta:", e);
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = "Erro ao criar conta";
      }
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit} class="space-y-4">
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700">Nome</label>
    <input
      type="text"
      id="name"
      bind:value={name}
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>

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
      minlength="6"
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>

  <div>
    <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmar Senha</label>
    <input
      type="password"
      id="confirmPassword"
      bind:value={confirmPassword}
      required
      minlength="6"
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  </div>

  {#if error}
    <div class="text-red-600 text-sm" role="alert">{error}</div>
  {/if}

  {#if success}
    <div class="text-green-600 text-sm" role="alert">{success}</div>
  {/if}

  <button
    type="submit"
    disabled={loading}
    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
  >
    {loading ? "Criando conta..." : "Criar conta"}
  </button>
</form> 