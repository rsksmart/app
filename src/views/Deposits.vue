<template>
  <div class="secondary-color borrow-deposit-view">
    <div class="d-flex flex-column align-center">
      <h2 class="h2-heading mb-7 text-primary">
        {{ $t('deposits.title') }}
      </h2>
      <p class="p1-descriptions text-info">
        {{ $t('deposits.description') }}
      </p>
    </div>
    <div class="d-flex justify-center actions-bottons">
      <a target="_blank" class="btn btn-secondary" :href="url">
        <span class="b1-main text-primary">
          {{ $t('deposits.btn1') }}
        </span>
      </a>
    </div>

    <v-row class="ma-0">
      <p class="h3-sections-heading text-info">
        {{ $t('deposits.subtitle') }}
      </p>
    </v-row>

    <landing />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import Landing from '@/components/home/Landing.vue';
import * as constants from '@/store/constants';

export default {
  components: {
    Landing,
  },
  data() {
    return {
      constants,
      url: 'https://www.youtube.com/watch?v=a973Xe2e6tQ',
    };
  },
  watch: {
    wallet() {
      this.tutorial();
    },
  },
  computed: {
    ...mapState({
      wallet: (state) => state.Session.wallet,
    }),
  },
  methods: {
    tutorial() {
      if (this.wallet === constants.WALLET_LIQUALITY) {
        this.url = 'https://www.youtube.com/watch?v=a973Xe2e6tQ';
      }
      if (this.wallet === constants.WALLET_METAMASK
        || this.wallet === constants.WALLET_NIFTY) {
        this.url = 'https://www.youtube.com/watch?v=K0OL16M7a-I';
      }
      if (this.wallet === constants.WALLET_DEFIANT) {
        this.url = 'https://www.youtube.com/watch?v=RwYjEjLH4E8';
      }
    },
  },
  created() {
    this.tutorial();
  },
};
</script>
