<template>
  <div class="bg-gray-100 shadow p-4">
    <div>
      <div>{{ fullName }}</div>
      <a
        v-if="user.user.username"
        class="d-block"
        target="_blank"
        :href="`https://t.me/${user.user.username}`"
      >
        @{{ user.user.username }}
      </a>
    </div>

    <div v-for="(movie, index) of user.favorites" :key="index">
      <MovieCard :movie="movie" />
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
      return `${this.user.user.first_name} ${this.user.user.last_name}`;
    },
  },
};
</script>
