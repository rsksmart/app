<template>
  <v-card width="700" height="415"
    class="card-item d-flex flex-column justify-space-between swapsPanel">
    <div class="d-flex justify-space-between">
      <div class="p1-descriptions mb-3 text-info">
        {{$t('swaps.description1')}}
      </div>
      <div class="p1-descriptions mb-3 text-info">
        {{$t('swaps.description3')}}
      </div>
    </div>
    <div class="input-box primary-bg ma-0">
      <div class="d-flex">
        <v-text-field
          type="number"
          v-model="amount"
          class="h1-title text-info pa-0 ma-0"
          background-color="#CFE7DA"
          color="#47B25F"
          :placeholder="'0 '"
          filled
          rounded
          dense
          @input="handleAmount"
        ></v-text-field>
        <dropdown class="swap-dropdown" :select="select" :getMarkets="getMarkets"
        @updateRoute="updateSelect"/>
      </div>
    </div>

    <div class="d-flex justify-space-between">
      <div class="p1-descriptions mb-3 text-info">
        {{$t('swaps.description2')}}
      </div>
      <div class="p1-descriptions mb-3 text-info">
        {{$t('swaps.description3')}}
      </div>
    </div>
    <div class="input-box primary-bg ma-0">
      <div class="d-flex">
        <v-text-field
          type="number"
          v-model="amountToReceive"
          class="h1-title text-info pa-0 ma-0"
          background-color="#CFE7DA"
          color="#47B25F"
          :placeholder="'0 '"
          filled
          rounded
          dense
          disabled
        ></v-text-field>
        <dropdown :select="select_I" :getMarkets="getMarkets"
        @updateRoute="updateDestSelect"/>
      </div>
    </div>
    <v-btn text class="btn-action"
            :class="'secondary-bg'" @click="swapTokens">
      <span class="white--text">
        {{
          $t('swaps.btn1')
        }}
      </span>
    </v-btn>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import Dropdown from '@/components/general/Dropdown.vue';
import * as constants from '@/store/constants';
import {
  SovrynSwap,
} from '@/middleware';
import { addresses } from '@/middleware/contracts/constants';

export default {
  name: 'SwapPanel',
  components: {
    Dropdown,
  },
  data() {
    return {
      amount: null,
      amountToReceive: null,
      sovrynSwap: null,
      select: {},
      select_I: {},
      getMarkets: [],
      sourceToken: null,
      destToken: null,
      conversionPath: null,
      targetAmount: null,
    };
  },
  computed: {
    ...mapState({
      chainId: (state) => state.Session.chainId,
      markets: (state) => state.Session.markets,
      walletAddress: (state) => state.Session.walletAddress,
      account: (state) => state.Session.account,
      marketsStore: (state) => state.Market.getMarkets,
      infoStore: (state) => state.Market.info,
      selectStore: (state) => state.Market.select,
      destSelectStore: (state) => state.Market.dest_select,
      marketStore: (state) => state.Market.market,
      isProgressStore: (state) => state.Market.isProgress,
    }),
  },
  watch: {
    marketsStore() {
      this.getMarkets = this.marketsStore;
    },
    selectStore() {
      this.select = this.selectStore;
    },
    destSelectStore() {
      this.select_I = this.destSelectStore;
    },
    markets() {
      this.swapMarkets = this.markets.filter((market) => market.marketAddress
      !== addresses[this.chainId].kRIF && market.marketAddress !== addresses[this.chainId].kSAT);
      if (this.markets.length > 3) this.getMarketsStore(this.swapMarkets);
    },
    select() {
      this.handleAmount();
    },
    select_I() {
      this.handleAmount();
    },
  },
  methods: {
    ...mapActions({
      getMarketsStore: constants.MARKET_GET_MARKETSINFO,
      getIsProgressStore: constants.MARKET_ISPROGRESS,
    }),
    updateSelect(marketAddress) {
      this.$store.dispatch({
        type: constants.MARKET_GET_MARKET,
        marketAddress,
        walletAddress: this.walletAddress,
        account: this.account,
      });
    },
    updateDestSelect(marketAddress) {
      this.$store.dispatch({
        type: constants.MARKET_GET_MARKET,
        marketAddress,
        walletAddress: this.walletAddress,
        account: this.account,
        isDestSwapMarket: true,
      });
    },
    async handleAmount() {
      const mappedAddresses = new Map([
        [addresses[this.chainId].kDOC, addresses[this.chainId].DOC],
        [addresses[this.chainId].kUSDT, addresses[this.chainId].USDT],
      ]);

      const sourceToken = (this.select.marketAddress === addresses[this.chainId].kRBTC)
        ? addresses[this.chainId].wRBTC : mappedAddresses.get(this.select.marketAddress);
      const destToken = (this.select_I.marketAddress === addresses[this.chainId].kRBTC)
        ? addresses[this.chainId].wRBTC : mappedAddresses.get(this.select_I.marketAddress);

      if (sourceToken && destToken) {
        const swapAmount = (!this.amount) ? '0' : this.amount;
        const conversionPath = await this.sovrynSwap.getConversionPath(sourceToken,
          destToken);
        const targetAmount = Number(await this.sovrynSwap.getExpextedSwapAmount(conversionPath,
          swapAmount)) / 1e18;
        this.amountToReceive = targetAmount.toFixed(18);

        this.sourceToken = sourceToken;
        this.destToken = destToken;
        this.conversionPath = conversionPath;
        this.targetAmount = targetAmount;
      }
    },
    async swapTokens() {
      if (this.sourceToken && this.destToken) {
        const minReturn = (Number(this.targetAmount) - (Number(this.targetAmount) * 0.01))
          .toFixed(18);
        console.log(minReturn);
        if (this.sourceToken === addresses[this.chainId].wRBTC) {
          console.log('From RBTC');
          await this.sovrynSwap
            .convertFromRBTC(this.account, this.conversionPath, this.amount, minReturn);
        } else if (this.destToken === addresses[this.chainId].wRBTC) {
          console.log('To RBTC');
          await this.sovrynSwap
            .convertToRBTC(this.account, this.conversionPath, this.amount, minReturn);
        } else {
          console.log('From and to any other token');
          await this.sovrynSwap
            .convertByPath(this.account, this.walletAddress,
              this.conversionPath, this.amount, minReturn);
        }
      }
    },
  },
  async created() {
    this.sovrynSwap = new SovrynSwap(this.chainId);
    this.swapMarkets = this.markets.filter((market) => market.marketAddress
    !== addresses[this.chainId].kRIF && market.marketAddress !== addresses[this.chainId].kSAT);
    this.getMarketsStore(this.swapMarkets);
  },
};
</script>
