<template>
  <v-card elevation="0" color="#E1F0E8" class="notifications"
    :class="active ? 'show' : 'hidden'"
  >
    <div class="d-flex">
      <v-icon class="btn-close" @click="setNotification(info)">mdi-close</v-icon>
      <img src="@/assets/dialog/success.svg" alt=""/>
      <div class="b1-main ml-2 d-flex flex-column">
        <div class="mb-1">
          {{ textAction(info.action) }} <br />
          <div class="mt-1">{{info.amount}} {{info.symbol}}</div>
        </div>
        <div class="d-flex mt-5">
          <div class="p1-descriptions text-detail">
            {{$t('notify.description5')}}
          </div>
          <a target="_blank" :href="`https://explorer.testnet.rsk.co/tx/${info.hash}`">
            <img class="link ml-5" src="@/assets/icons/link.svg" />
          </a>
        </div>
      </div>
    </div>
  </v-card>
</template>
<script>
import { mapActions } from 'vuex';
import * as constants from '@/store/constants';

export default {
  props: {
    noti: {
      type: Object,
      require: true,
    },
  },
  watch: {
    noti() {
      this.info = this.noti;
      setTimeout(() => {
        this.active = true;
      }, 1000);
    },
  },
  data() {
    return {
      info: {},
      active: false,
    };
  },
  methods: {
    ...mapActions({
      actionNotification: constants.USER_ACTION_NOTIFICATIONS,
    }),
    setNotification(info) {
      this.active = false;
      setTimeout(() => {
        this.actionNotification(info);
      }, 1000);
    },
    textAction(action) {
      if (action === 'Mint') return this.$t('notify.description1');
      if (action === 'Redeem') return this.$t('notify.description2');
      if (action === 'Borrow') return this.$t('notify.description3');
      return this.$t('notify.description4');
    },
  },
  created() {
    this.info = this.noti;
    setTimeout(() => {
      this.active = true;
    }, 1000);
  },
};
</script>
