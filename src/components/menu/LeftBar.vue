<template>
  <div class="left-bar">
    <v-navigation-drawer class="primary-color pl-3 left-bar-content"
      absolute permanent
      mobile-breakpoint="960"
      >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>
            <img class="logo-tropykus"
              src="@/assets/icons/tropykus-alpha.svg"
            />
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list class="list-left-bar" dense nav
        >
        <!-- <v-list-item-group
          v-model="setGroupDrawer"
        > -->
        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <router-link :to="{name: constants.ROUTE_NAMES.DEPOSITS}"
            class="d-flex align-center active">
            <img class="ml-4 mr-5" src="@/assets/icons/home.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.deposit') }}</div>
          </router-link>
        </v-list-item>

        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <router-link :to="{name: constants.ROUTE_NAMES.BORROWS}"
            class="d-flex align-center active">
            <img class="ml-4 mr-5" src="@/assets/icons/borrow.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.borrow') }}</div>
          </router-link>
        </v-list-item>

        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <router-link :to="{name: constants.ROUTE_NAMES.BALANCE}"
            class="d-flex align-center active">
            <img class="ml-4 mr-5" src="@/assets/icons/dollar.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.balance') }}</div>
          </router-link>
        </v-list-item>

        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <!-- <router-link :to="{name: constants.ROUTE_NAMES.SCHOOL}" -->
          <router-link to="/building"
            class="d-flex align-center">
            <img class="ml-4 mr-5" src="@/assets/icons/exchanges.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.exchanges') }}</div>
          </router-link>
        </v-list-item>

        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <!-- <router-link :to="{name: constants.ROUTE_NAMES.SCHOOL}" -->
          <router-link to="/building"
            class="d-flex align-center">
            <img class="ml-4 mr-5" src="@/assets/icons/tutorials.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.school') }}</div>
          </router-link>
        </v-list-item>

        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <!-- <router-link :to="{name: constants.ROUTE_NAMES.MARKETS}" -->
          <router-link to="/building"
            class="d-flex align-center">
            <img class="ml-4 mr-5" src="@/assets/icons/markets.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.markets') }}</div>
          </router-link>
        </v-list-item>

        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <!-- <router-link :to="{name: constants.ROUTE_NAMES.PROTOCOL}" -->
          <router-link to="/building"
            class="d-flex align-center">
            <img class="ml-4 mr-5" src="@/assets/icons/protocol.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.protocol') }}</div>
          </router-link>
        </v-list-item>

        <v-list-item class="left-list-item pa-0 ml-1" @click="() => null">
          <v-btn block class="btn-primary d-flex justify-start pa-0" @click="changeLanguage"
           width="50" height="48" depressed>
            <img class="ml-4 mr-5" src="@/assets/icons/idiom.svg"/>
            <div class="white--text b2-secondary">{{ $t('menu.sidebar.language') }}</div>
          </v-btn>
        </v-list-item>

        <!-- </v-list-item-group> -->

        </v-list>

        <v-divider class="divider"></v-divider>

        <div class="d-flex pl-6 price-btc">
          <img src="https://firebasestorage.googleapis.com/v0/b/tropycofinance.appspot.com/o/markets%2FRBTC.svg?alt=media&token=65f6dd30-5bcc-42c1-bbda-7795c64cccdd" />
          <div class="ml-4 d-flex">
            <div class="p3-USD-values white--text align-self-center">
              {{marketPrice | formatPrice}}
            </div>
          </div>
        </div>

        <div class="d-flex justify-space-between contact-tropykus">
          <a target="_blank" href="https://github.com/Tropykus/protocol">
            <v-img contain height="43" src="@/assets/icons/github.svg"/>
          </a>
          <a target="_blank" href="https://twitter.com/tropykus">
            <v-img contain height="43" src="@/assets/icons/twitter.svg"/>
          </a>
          <a target="_blank" href="https://t.me/tropykus">
            <v-img contain height="43" src="@/assets/icons/telegram.svg"/>
          </a>
          <a target="_blank" href="https://www.youtube.com/channel/UCUgOzJjQAsQS2sFJ0-A87eQ">
            <v-img contain height="43" src="@/assets/icons/youtube.svg"/>
          </a>
        </div>

    </v-navigation-drawer>

    <template v-if="showModalConnectWallet">
      <connect-wallet
        :showModal="showModalConnectWallet"
        @closed="closeConnectWallet"
      />
    </template>

  </div>
</template>
<script>
import { mapState } from 'vuex';
import * as constants from '@/store/constants';
import { addresses } from '@/middleware/contracts/constants';
import ConnectWallet from '@/components/dialog/ConnectWallet.vue';
import {
  CRbtc,
} from '@/middleware';

export default {
  name: 'LeftBar',
  components: {
    ConnectWallet,
  },
  data() {
    return {
      constants,
      setGroupDrawer: null,
      showDrawer: true,
      showModalConnectWallet: false,
      next: false,
      marketPrice: 0,
    };
  },
  computed: {
    ...mapState({
      account: (state) => state.Session.account,
      chainId: (state) => state.Session.chainId,
      showDialogConnect: (state) => state.Session.showDialogConnect,
    }),
  },
  methods: {
    changeLanguage() {
      if (this.$i18n.locale === 'es') {
        this.$i18n.locale = 'en';
        this.lang = 'ES';
      } else {
        this.$i18n.locale = 'es';
        this.lang = 'EN';
      }
    },
    redirectBalance() {
      const to = { name: constants.ROUTE_NAMES.BALANCE };
      this.$router.push(to);
      this.next = false;
    },
    openConnectWallet() {
      this.showModalConnectWallet = true;
    },
    closeConnectWallet() {
      this.showModalConnectWallet = false;
      this.$store.dispatch(constants.SESSION_SHOW_DIALOG_CONNECT, false);
    },
    async getPrice() {
      const rtbc = addresses[this.chainId].kRBTC;
      const market = new CRbtc(rtbc, this.chainId);
      this.marketPrice = await market.underlyingCurrentPrice(this.chainId);
    },
  },
  watch: {
    account() {
      if (this.next && this.account) {
        this.redirectBalance();
      }
    },
    setGroupDrawer() {
      if (window.innerWidth <= 768) {
        this.setDrawer(false);
        this.showDrawer = false;
      } else {
        this.showDrawer = true;
        this.setDrawer(true);
      }
    },
    showDialogConnect() {
      if (this.showDialogConnect && !this.account) {
        this.next = true;
        this.openConnectWallet();
      }
    },
  },
  created() {
    this.getPrice();
  },
};
</script>
