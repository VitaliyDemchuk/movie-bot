<template>
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="flex items-center px-6 py-3 bg-gray-900">
      <img class="h-6 w-6 text-white fill-current" src="/icons/user.svg" />
      <div class="mx-3 text-white">
        <div class="font-semibold text-lg">
          <a
            v-if="user.user.username"
            class="d-block"
            target="_blank"
            :href="`https://t.me/${user.user.username}`"
          >
            {{ fullName }}
          </a>
          <div v-else>
            {{ fullName }}
          </div>
        </div>
      </div>
    </div>
    <div class="py-4 px-4">
      <div v-if="Array.isArray(user.favorites) && user.favorites.length">
        <h2 class="text-lg font-semibold text-gray-800 pb-3 px-2">Избранные</h2>
        <div class="movie-list">
          <MovieCard
            v-for="(movie, index) of user.favorites"
            :key="index"
            :movie="movie"
            class="movie-list-item"
          />
        </div>
      </div>
      <div v-else class="text-sm text-gray-500">Список избранных пуст</div>
    </div>
  </div>
</template>

<script>
import MovieCard from './MovieCard.vue';

export default {
  components: { MovieCard },

  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
  },

  computed: {
    fullName() {
      return `${this.user.user.first_name || ''} ${
        this.user.user.last_name || ''
      }`;
    },
  },
};
</script>

<style scoped>
.movie-list {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 8px;
}

.movie-list-item {
  margin-bottom: 16px;
}

.movie-list-item:last-child {
  margin-bottom: 0;
}
</style>
