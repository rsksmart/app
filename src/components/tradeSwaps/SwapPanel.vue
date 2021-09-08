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
        </div>
        <v-btn  height="40" text @click="setMaxAmount">
          <span class="text-primary">MÁX</span>
        </v-btn>
        <dropdown class="swap-dropdown" :select="select" :getMarkets="getMarkets"
        @updateRoute="updateSelect"/>
      </div>
    </div>
    <div class="exchange-svg">
      <img class="mt-7 mb-2" src="@/assets/icons/exchange.svg"  @click="swapSelectedTokens"/>
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
          ></v-text-field>
        </div>
        <dropdown class="swap-dropdown" :select="select_I" :getMarkets="getMarkets"
        @updateRoute="updateDestSelect"/>
      </div>
    </div>
    <div class="d-flex mt-12 mb-8">
      <div class="">
        <div class="d-flex p1-descriptions mb-3">
          <div>
            {{$t('swaps.description4')}}
          </div>
          <v-tooltip top
            content-class="secondary-color box-shadow-tooltip" max-width="180">
            <template v-slot:activator="{ on, attrs }">
              <v-img v-bind="attrs" v-on="on" width="15" height="15"
                      src="@/assets/icons/info2.svg" contain/>
            </template>
            <span class="p5-feedback text-info">
              {{ $t('swaps.tooltip1') }}
            </span>
          </v-tooltip>
        </div>
        <div class="d-flex p1-descriptions">
          <div class="mr-1">
            {{$t('swaps.description6')}}
          </div>
          <v-tooltip top
            content-class="secondary-color box-shadow-tooltip" max-width="180">
            <template v-slot:activator="{ on, attrs }">
              <v-img v-bind="attrs" v-on="on" width="15" height="15"
                      src="@/assets/icons/info2.svg" contain/>
            </template>
            <span class="p5-feedback text-info">
              {{ $t('swaps.tooltip2') }}
            </span>
          </v-tooltip>
        </div>
      </div>
      <div class="ml-9">
        <div class="p6-reading-values mb-3">
          1 {{(select.underlyingSymbol ? select.underlyingSymbol : '')}} =
          {{price}} {{(select_I.underlyingSymbol ? select_I.underlyingSymbol : '')}}
        </div>
        <div class="p6-reading-values">
          {{ minReturn }}
          {{(select_I.underlyingSymbol ? select_I.underlyingSymbol : '')}}
        </div>
      </div>
    </div>
    <v-btn text class="btn-action"
        :disabled="!activeButton"
        :class="activeButton ? 'primary-color' : 'secondary-bg'"
        @click="openSwapDialog"
      >
        <span class="white--text">
          {{
            account ? $t('swaps.btn1') : $t('swaps.btn2')
          }}
        </span>
      </v-btn>
    </div>

    <template v-if="swapDialog">
      <swap-loading :show="swapDialog" :data="dataSwapDialog" @closeDialog="closeSwapDialog"
        @swapTokens="swapTokens"/>
    </template>

    <template v-if="dialogWallet">
      <connect-wallet :showModal="dialogWallet" @closed="closeSwapDialog" />
    </template>
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
import SwapLoading from '@/components/dialog/SwapLoading.vue';
import ConnectWallet from '@/components/dialog/ConnectWallet.vue';

export default {
  name: 'SwapPanel',
  components: {
    Dropdown,
    SwapLoading,
    ConnectWallet,
  },
  data() {
    return {
      dialogWallet: false,
      swapDialog: false,
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
      price: 0,
      info: null,
      sourceTokenBalance: 0,
      destTokenBalance: 0,
      dataSwapDialog: {},
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
      swapDialogStore: (state) => state.Users.swapDialog,
    }),
    activeButton() {
      return this.amount > 0;
    },
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
    price() {
      if (!Number(this.price)) this.price = 0;
    },
    swapDialogStore() {
      this.swapDialog = this.swapDialogStore;
    },
  },
  methods: {
    ...mapActions({
      getMarketsStore: constants.MARKET_GET_MARKETSINFO,
    }),
    async updateSelect(marketAddress) {
      this.selectSourceToken = marketAddress;
      await this.$store.dispatch({
        type: constants.MARKET_GET_MARKET,
        marketAddress,
        walletAddress: this.walletAddress,
        account: this.account,
      });
    },
    async updateDestSelect(marketAddress) {
      this.selectDestToken = marketAddress;
      await this.$store.dispatch({
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

        this.minReturn = (Number(this.targetAmount) - (Number(this.targetAmount) * 0.01))
          .toFixed(7);
      }

      this.price = (!this.amount) ? 0 : (this.amountToReceive / this.amount);
    },
    openSwapDialog() {
      if (!this.account) {
        this.dialogWallet = true;
        return;
      }
      const dataSwapDialog = {
        amount: this.amount,
        minReturn: this.minReturn,
        amountToReceive: this.amountToReceive,
        select: this.select,
        selectI: this.select_I,
        price: this.price,
      };
      this.dataSwapDialog = dataSwapDialog;
      this.$store.dispatch({
        type: constants.USER_ACTION_SWAP_DIALOG,
        data: true,
      });
    },
    closeSwapDialog() {
      this.$store.dispatch({
        type: constants.USER_ACTION_SWAP_DIALOG,
        data: false,
      });
      this.dialogWallet = false;
      this.dataSwapDialog = {};
    },
    async swapTokens() {
      if (this.sourceToken && this.destToken) {
        const minReturn = (Number(this.targetAmount) - (Number(this.targetAmount) * 0.01))
          .toFixed(18);

        const data = {
          sourceToken: this.sourceToken,
          destToken: this.destToken,
          amount: this.amount,
          minReturn,
          amountToReceive: this.amountToReceive,
          conversionPath: this.conversionPath,
          sovrynSwap: this.sovrynSwap,
          select: this.select,
          selectI: this.select_I,
        };

        this.$store.dispatch({
          type: constants.USER_ACTION_SWAP,
          ...data,
        });

        this.reset();
      }
    },
    setMaxAmount() {
      if (!this.account) return;
      if (this.sourceTokenBalance !== 0) {
        this.amount = this.sourceTokenBalance;
        this.handleAmount();
      }
    },
    swapSelectedTokens() {
      let aux = this.select;
      this.select = this.select_I;
      this.select_I = aux;

      aux = this.selectSourceToken;
      this.selectSourceToken = this.selectDestToken;
      this.selectDestToken = aux;

      this.updateSelect(this.selectSourceToken);
      this.updateDestSelect(this.selectDestToken);

      aux = this.amount;
      this.amount = this.amountToReceive;
      this.amountToReceive = aux;
    },
    reset() {
      this.amount = null;
      this.amountToReceive = null;
      this.minReturn = 0;
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
