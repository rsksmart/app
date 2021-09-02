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
      <v-btn
        class="btn mr-9"
        text
      >
        <span class="b1-main text-primary">
          {{ $t('deposits.btn1') }}
        </span>
      </v-btn>
      <v-btn
        class="btn btn-secondary"
        text
      >
        <span class="b1-main text-primary">
          {{ $t('deposits.btn2') }}
        </span>
      </v-btn>
    </div>

    <v-row class="ma-0">
      <p class="h3-sections-heading text-info">
        {{ $t('deposits.subtitle') }}
      </p>
    </v-row>

    <landing :inBorrowMenu="inBorrowMenu" :key="key"/>

  </div>
</template>
<script>
import { mapGetters, mapState } from 'vuex';
import Landing from '@/components/home/Landing.vue';
import * as constants from '@/store/constants';

export default {
  components: {
    Landing,
  },
  data() {
    return {
      inBorrowMenu: false,
      key: 0,
    };
  },
  computed: {
    ...mapGetters({
      isLoggedIn: constants.SESSION_IS_CONNECTED,
    }),
    ...mapState({
      routePath: (state) => state.route.path,
    }),
  },
  created() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        this.key += 1;
      });
      window.ethereum.on('chainChanged', () => {
        this.key += 1;
      });
    }
    if (this.routePath === '/es') {
      this.$i18n.locale = 'es';
    }
  },
};
</script>
