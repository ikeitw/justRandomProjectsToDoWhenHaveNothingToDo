<template>
  <div id="app">
    <nav class="navbar">
      <RouterLink to="/ensembles">Ансамбли</RouterLink>
      <RouterLink to="/records">Пластинки</RouterLink>
      <RouterLink to="/musicians">Музыканты</RouterLink>
      <RouterLink to="/compositions">Композиции</RouterLink>
    </nav>
    <router-view/>
  </div>
</template>


<style scoped>
.navbar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #121218;
  color: white;
  justify-content: center;
}

.navbar a {
  text-decoration: none;
  color: #90caf9;
  font-weight: 500;
}

.navbar a.router-link-exact-active {
  color: #ffffff;
  text-shadow: 0 0 4px #3b82f6;
}
</style>
