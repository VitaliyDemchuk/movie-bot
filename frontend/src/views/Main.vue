<template>
  <div class="container mx-auto p-5">
    <div
      v-if="loading"
      class="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <div
        v-for="item of Array.from(Array(3).keys())"
        :key="item"
        class="bg-white rounded shadow-lg"
      >
        <div class="h-14 bg-gray-200 rounded-tr animate-pulse"></div>

        <div class="h-4 rounded-sm bg-gray-200 animate-pulse mb-4"></div>

        <div
          v-for="movie of Array.from(Array(3).keys())"
          :key="movie"
          class="my-4 px-4"
        >
          <div class="flex">
            <div class="h-23 bg-gray-200 rounded-tr animate-pulse w-1/3"></div>
            <div class="w-2/3 ml-4">
              <div class="h-4 rounded-sm bg-gray-200 animate-pulse mb-4"></div>
              <div class="h-2 rounded-sm bg-gray-200 animate-pulse mb-4"></div>
              <div class="h-2 rounded-sm bg-gray-200 animate-pulse mb-4"></div>
              <div class="h-2 rounded-sm bg-gray-200 animate-pulse mb-4"></div>
              <div class="h-2 rounded-sm bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="main">
      <h1 class="text-gray-900 font-bold text-lg mb-4">
        Всего пользователей: {{ users.totalElements }}
      </h1>
      <div class="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <UserCard
          v-for="(user, index) of users.content"
          :key="index"
          :user="user"
        />
      </div>

      <ul class="mt-8 mb-2 flex">
        <li
          class="mr-1 bg-gray-200 rounded-lg"
          :class="
            payload.page - 1 < 0
              ? 'text-gray-500'
              : 'text-gray-700 hover:bg-gray-700 hover:text-gray-200'
          "
        >
          <button
            class="px-3 py-2 flex items-center font-bold"
            :disabled="payload.page - 1 < 0"
            @click="setPage(payload.page - 1)"
          >
            <span class="mx-1">Назад</span>
          </button>
        </li>

        <li
          class="ml-1 bg-gray-200 rounded-lg"
          :class="
            payload.page + 1 > users.totalPages - 1
              ? 'text-gray-500'
              : 'text-gray-700 hover:bg-gray-700 hover:text-gray-200'
          "
        >
          <button
            class="px-3 py-2 flex items-center font-bold"
            :disabled="payload.page + 1 > users.totalPages - 1"
            @click="setPage(payload.page + 1)"
          >
            <span class="mx-1">Вперед</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import UserCard from '../components/UserCard.vue';

export default {
  components: { UserCard },

  data: () => ({
    users: {
      content: [],
      totalElements: 0,
      totalPages: 0,
    },
    payload: {
      page: 0,
    },
    loading: false,
  }),

  created() {
    this.initialize();
  },

  methods: {
    initialize() {
      const searchParams = new URLSearchParams(window.location.search);
      this.payload.page = Number(searchParams.get('page')) || 0;

      this.setData();
    },

    async setData() {
      try {
        this.loading = true;
        const result = await axios.post('/api/user/list', this.payload);
        this.users = result.data;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    setPage(page) {
      try {
        this.payload.page = page;

        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('page', page);
        history.replaceState(null, null, '?' + searchParams.toString());

        this.setData();
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>
