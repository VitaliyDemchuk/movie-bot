<template>
  <a
    class="md:flex p-8 md:p-0 hover:bg-gray-200"
    :href="`https://www.themoviedb.org/movie/${movie.id}`"
    target="_blank"
  >
    <img
      class="w-auto h-32"
      :src="`https://image.tmdb.org/t/p/w500/${movie.poster_path}`"
    />
    <div class="pt-6 md:p-8 text-center md:text-left space-y-4">
      <h2 class="text-lg font-semibold text-cyan-600">
        {{ movie.title }}
      </h2>
      <div v-if="movie.vote_average">🔥{{ movie.vote_average }}</div>
    </div>
  </a>
</template>

<script>
export default {
  props: {
    movie: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
