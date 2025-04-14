{#if data.user}
  <nav>
    <ul>
      <li>
        <a href="/dashboard">Dashboard</a>
      </li>
      <li>
        <button on:click={handleLogout}>Logout</button>
      </li>
    </ul>
  </nav>
{:else}
  <nav>
    <ul>
      <li>
        <a href="/login">Login</a>
      </li>
      <li>
        <a href="/register">Register</a>
      </li>
    </ul>
  </nav>
{/if}

<script>
  export let data;

  async function handleLogout() {
    try {
      window.location.href = '/api/auth/logout';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
</script>

<style>
  nav {
    padding: 1rem;
    background-color: #f8f9fa;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 1rem;
  }

  a {
    text-decoration: none;
    color: #333;
  }

  a:hover {
    color: #666;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #333;
    padding: 0;
    font: inherit;
  }

  button:hover {
    color: #666;
  }
</style> 