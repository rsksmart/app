<template>
  <v-card color="#E1F0E8" class="swapsPanel d-flex flex-column align-center">
    <div class="swapsPanel-content">
      <div class="d-flex justify-space-between">
        <div class="p1-descriptions mb-2 text-info">
            {{$t('swaps.description1')}}
        </div>
        <div class="p1-descriptions mb-2 text-info">
          <span> {{$t('swaps.description3')}} </span>
          <span class="p6-reading-values">
            {{sourceTokenBalance}}
            {{select.underlyingSymbol ? select.underlyingSymbol : ''}}
          </span>
        </div>
      </div>
    <div class="input-box primary-bg">
      <div class="d-flex">
        <div class="swap">
          <v-text-field
            type="number"
            v-model="amount"
            class="h1-title text-info pa-0 ma-0"
            background-color="#CFE7DA"
            color="#47B25F"
            :placeholder="'0 ' + (select.underlyingSymbol ? select.underlyingSymbol : '')"
            filled
            rounded
            dense
            @input="handleAmount"
          ></v-text-field>
          <div class="p3-USD-values"> {{sourceTokenUsdBalance}} USD</div>
        </div>
        <v-btn  height="40" text @click="setMaxAmount">
          <span class="text-primary">MÁX</span>
        </v-btn>
        <dropdown class="swap-dropdown" :select="select" :getMarkets="getMarkets"
        @updateRoute="updateSelect"/>
      </div>
    </div>
    <div class="exchange-svg">
      <img class="mt-10 mb-5" src="@/assets/icons/exchange.svg" />
    </div>
    <div class="d-flex justify-space-between">
      <div class="p1-descriptions mb-3 text-info">
        {{$t('swaps.description2')}}
      </div>
      <div class="p1-descriptions mb-3 text-info">
        <span> {{$t('swaps.description3')}} </span>
        <span class="p6-reading-values">
          {{destTokenBalance}}
          {{select_I.underlyingSymbol ? select_I.underlyingSymbol : ''}}
        </span>
      </div>
    </div>
    <div class="input-box primary-bg ma-0">
      <div class="d-flex">
        <div class="swap">
          <v-text-field
            type="number"
            v-model="amountToReceive"
            class="h1-title text-info pa-0 ma-0"
            background-color="#CFE7DA"
            color="#47B25F"
            :placeholder="'0 ' + (select_I.underlyingSymbol ? select_I.underlyingSymbol : '')"
            filled
            rounded
            dense
            disabled
          ></v-text-field>
          <div class="p3-USD-values"> {{destTokenUsdBalance}} USD</div>
        </div>
        <dropdown class="swap-dropdown" :select="select_I" :getMarkets="getMarkets"
        @updateRoute="updateDestSelect"/>
      </div>
    </div>
    <div class="d-flex mt-12 mb-12">
      <div class="">
        <div class="p1-descriptions mb-3">{{$t('swaps.description4')}}</div>
        <div class="p1-descriptions mb-3">{{$t('swaps.description5')}}</div>
        <div class="p1-descriptions">{{$t('swaps.description6')}}</div>
      </div>
      <div class="ml-9">
        <div class="p6-reading-values mb-3">
          1 {{(select.underlyingSymbol ? select.underlyingSymbol : '')}} =
          {{price}} {{(select_I.underlyingSymbol ? select_I.underlyingSymbol : '')}}
        </div>
        <div class="p6-reading-values mb-3">{{ lpFee }} USDT</div>
        <div class="p6-reading-values">
          {{ minReturn }}
          {{(select_I.underlyingSymbol ? select_I.underlyingSymbol : '')}}
        </div>
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
    </div>
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
      selectSourceToken: null,
      selectDestToken: null,
      conversionPath: null,
      targetAmount: null,
      minReturn: 0,
      lpFee: 0,
      price: null,
      info: null,
      sourceTokenBalance: 0,
      destTokenBalance: 0,
      sourceTokenUsdBalance: 0,
      destTokenUsdBalance: 0,
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
      destInfoStore: (state) => state.Market.dest_info,
      selectStore: (state) => state.Market.select,
      destSelectStore: (state) => state.Market.dest_select,
      marketStore: (state) => state.Market.market,
      isProgressStore: (state) => state.Market.isProgress,
    }),
  },
  watch: {
    walletAddress() {
      this.updateSelect(this.selectSourceToken);
      this.updateDestSelect(this.selectDestToken);
    },
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
    infoStore() {
      this.info = this.infoStore;
      if (this.infoStore.underlyingBalance) {
        this.sourceTokenBalance = this.infoStore.underlyingBalance.toFixed(4);
      }
    },
    destInfoStore() {
      if (this.destInfoStore.underlyingBalance) {
        this.destTokenBalance = this.destInfoStore.underlyingBalance.toFixed(4);
      }
    },
    amount() {
      if (this.info) {
        this.sourceTokenUsdBalance = this.amount * this.info.price;
      } else this.sourceTokenUsdBalance = 0;
    },
    amountToReceive() {
      this.destTokenUsdBalance = this.sourceTokenUsdBalance;
    },
  },
  methods: {
    ...mapActions({
      getMarketsStore: constants.MARKET_GET_MARKETSINFO,
      getIsProgressStore: constants.MARKET_ISPROGRESS,
    }),
    updateSelect(marketAddress) {
      this.selectSourceToken = marketAddress;
      this.$store.dispatch({
        type: constants.MARKET_GET_MARKET,
        marketAddress,
        walletAddress: this.walletAddress,
        account: this.account,
      });
    },
    updateDestSelect(marketAddress) {
      this.selectDestToken = marketAddress;
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
        this.amountToReceive = (this.amount) ? targetAmount.toFixed(8) : null;

        this.sourceToken = sourceToken;
        this.destToken = destToken;
        this.conversionPath = conversionPath;
        this.targetAmount = targetAmount;

        this.lpFee = (Number(this.targetAmount) * 0.001).toFixed(7);
        this.minReturn = (Number(this.targetAmount) - (Number(this.targetAmount) * 0.01))
          .toFixed(7);

        this.price = (Number(await this.sovrynSwap.getExpextedSwapAmount(conversionPath,
          '1')) / 1e18).toFixed(7);
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
    setMaxAmount() {
      if (!this.account) return;
      if (this.sourceTokenBalance !== 0) {
        this.amount = this.sourceTokenBalance;
        this.handleAmount();
      }
    },
  },
  async created() {
    this.sovrynSwap = new SovrynSwap(this.chainId);
    this.swapMarkets = this.markets.filter((market) => market.marketAddress
    !== addresses[this.chainId].kRIF && market.marketAddress !== addresses[this.chainId].kSAT);
    this.getMarketsStore(this.swapMarkets);
    this.updateSelect(addresses[this.chainId].kDOC);
    this.updateDestSelect(addresses[this.chainId].kUSDT);
  },
};
</script>
