<template>
  <div class="app">
    <nav class="sticky top-0 bg-white shadow flex items-center py-4 px-4">
      <a href="https://t.me/movies_xd_bot" target="_blank">
        <img class="h-10 w-auto" src="/logo.png" />
      </a>
      <a
        class="ml-4 text-xl text-gray-500 hover:text-gray-900"
        href="https://t.me/movies_xd_bot"
        target="_blank"
      >
        Movies xD
      </a>
    </nav>

    <Main class="pt-5"/>
  </div>
</template>

<script>
import Main from './views/Main.vue';

export default {
  name: 'App',
  components: {
    Main,
  },
};
</script>

<style></style>
