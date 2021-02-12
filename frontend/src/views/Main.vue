<template>
  <pre>{{ JSON.stringify(users, null, 2) }}</pre>
</template>

<script>
import axios from 'axios';

export default {
  data: () => ({
    users: [],
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
