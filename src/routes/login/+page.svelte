<script lang="ts">
  import LoginForm from "$lib/components/LoginForm.svelte";
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

    <LoginForm />
  </div>
</div> 