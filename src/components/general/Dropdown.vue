<template>
<div class="primary-bg select-box">
  <v-menu>
    <template v-slot:activator="{ on, attrs }">
      <div class="selected-item d-flex align-center"
        v-bind="attrs" v-on="on">
        <img v-if="select.img" class="ml-6 mr-3" :src="select.img" />
        <div v-if="select.underlyingSymbol"
          class="h3-sections-heading">
          {{ select.underlyingSymbol }} <br/>
          <span class="microlanding text-value">
            {{textMicro(select.marketAddress)}}
          </span>
        </div>
        <v-icon class="select-icon" large color="text-primary">
          mdi-chevron-down
        </v-icon>
      </div>
    </template>
    <v-list :class="swap ? 'swap': ''">
      <v-list-item
        v-for="(market, index) in infoMarkets" :key="index" class="select-menu-item"
        :class="[market.symbol === select.symbol && !swap ? 'active' : '']"
        @click="updateRoute(market)"
      >
        <div class="list-item">
          <div class="d-flex">
            <img :src="market.img" class="ml-2 mr-3"/>
            <div class="h3-sections-heading">
              {{ market.underlyingSymbol }}
            </div>
          </div>
          <span class="microlanding text-value">
            {{textMicro(market.marketAddress)}}
          </span>
        </div>
      </v-list-item>
    </v-list>
  </v-menu>
</div>
</template>
<script>
import { mapState } from 'vuex';
import { addresses } from '@/middleware/contracts/constants';
import * as constants from '@/store/constants';

export default {
  props: {
    select: {
      type: Object,
      require: true,
    },
    getMarkets: {
      type: Array,
      require: true,
    },
    tabMenu: {
      type: Boolean,
      require: false,
    },
  },
  data() {
    return {
      addresses,
      constants,
      infoMarkets: [],
      lending: false,
      swap: false,
    };
  },
  computed: {
    ...mapState({
      chainId: (state) => state.Session.chainId,
    }),
  },
  watch: {
    tabMenu() {
      this.updateMarkets();
    },
    getMarkets() {
      this.updateMarkets();
    },
  },
  methods: {
    textMicro(marketAddress) {
      if (this.$route.name === constants.ROUTE_NAMES.DEPOSIT
        && !this.tabMenu
        && marketAddress === addresses[this.chainId].kSAT
      ) {
        return this.$t('market.general.micro1');
      }
      if (this.$route.name === constants.ROUTE_NAMES.BORROW
        && marketAddress === addresses[this.chainId].kSAT) {
        return this.$t('market.general.micro2');
      }
      return '';
    },
    updateMarkets() {
      this.infoMarkets = [];
      if (this.$route.name === constants.ROUTE_NAMES.DEPOSIT && this.tabMenu) {
        this.lending = false;
        this.getMarkets.forEach((market) => {
          if (market.marketAddress !== addresses[this.chainId].kSAT.toLowerCase()) {
            this.infoMarkets.push(market);
          }
        });
      } else {
        this.infoMarkets = this.getMarkets;
        this.lending = true;
      }
    },
    updateRoute(market) {
      this.$emit('updateRoute', market.marketAddress);
    },
    getRouterSwap() {
      if (this.$route.name === constants.ROUTE_NAMES.EXCHANGES) {
        this.swap = true;
      } else {
        this.swap = false;
      }
    },
  },
  created() {
    this.updateMarkets();
    this.getRouterSwap();
  },
};
</script>
