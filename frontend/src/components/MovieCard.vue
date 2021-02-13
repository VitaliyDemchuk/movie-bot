<template>
  <div class="movie">
    <div class="flex w-full bg-white border-2 rounded-lg overflow-hidden">
      <div
        class="w-1/3 bg-cover hidden lg:block"
        :style="{
          backgroundImage: `url(https://image.tmdb.org/t/p/w500/${movie.poster_path})`,
        }"
      ></div>
      <div class="w-full lg:w-2/3 p-4">
        <h1 class="text-gray-900 font-bold text-lg">
          {{ movie.title }}
        </h1>
        <p v-if="genres" class="mt-2 text-gray-600 text-sm">
          {{ genres }}
        </p>
        <div class="flex item-center justify-between mt-3 text-lg">
          <h1 v-if="movie.vote_average" class="text-gray-700 font-bold">
            ⭐️ {{ movie.vote_average }}
          </h1>
          <a
            class="px-3 py-2 bg-gray-800 text-white text-xs font-bold uppercase rounded"
            :href="`https://www.themoviedb.org/movie/${movie.id}`"
            target="_blank"
          >
            Детали
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    movie: {
      type: Object,
      default: () => ({}),
    },
  },

  computed: {
    genres() {
      if (Array.isArray(this.movie.genres)) {
        return this.movie.genres.map((e) => e.name).join(', ');
      }
      return null;
    },
  },
};
</script>
