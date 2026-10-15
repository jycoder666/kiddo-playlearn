<template>
  <div class="shell">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<style>
.shell {
  position: relative;
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--bg-cream);
  overflow-x: hidden;
  box-shadow: 0 0 40px rgba(92, 75, 81, 0.08);
}
</style>
