<script lang="ts">
  import RegisterForm from "$lib/components/RegisterForm.svelte";
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Crie sua conta
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Ou
        <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
          entre com sua conta existente
        </a>
      </p>
    </div>

    <RegisterForm />
  </div>
</div> 