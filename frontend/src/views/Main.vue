<template>
  <div class="container mx-auto">
    <div v-for="(user, index) of users.content" :key="index">
      <UserCard :user="user" />
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
    },
    payload: {
      page: 0,
    },
  }),

  created() {
    this.init();
  },

  methods: {
    async init() {
      try {
        const result = await axios.post('/api/user/list', this.payload);
        this.users = result.data;
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>
