<template>
  <div class="secondary-color borrow-deposit-view">
    <div class="d-flex flex-column align-center">
      <h2 class="h2-heading mb-7 text-primary">
        {{ $t('borrows.title') }}
      </h2>
      <p class="p1-descriptions text-info text-description">
        {{ $t('borrows.description') }}
      </p>
    </div>
    <div class="d-flex justify-center actions-bottons">
      <v-btn class="btn btn-secondary" text @click="redirect(constants.ROUTE_NAMES.DEPOSITS)">
        <span class="b1-main">
          {{ $t('borrows.btn2') }}
        </span>
      </v-btn>
    </div>
    <v-row class="ma-0">
      <p class="h3-sections-heading text-info">
        {{ $t('borrows.subtitle') }}
      </p>
    </v-row>

    <landing />

  </div>
</template>

<script>
import Landing from '@/components/home/Landing.vue';
import * as constants from '@/store/constants';

export default {
  name: 'Borrow',
  data() {
    return {
      constants,
    };
  },
  components: {
    Landing,
  },
  methods: {
    redirect(path) {
      const to = { name: path };
      this.$router.push(to);
    },
  },
};
</script>
