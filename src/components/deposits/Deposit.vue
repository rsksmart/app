<template>
  <div class="deposit">
    <h2 class="h2-heading text-detail">{{ $t('deposit.title')}}</h2>
    <div class="d-flex">
      <div text @click="tabMenu = true" class="mr-10">
        <span class="h3-sections-heading pb-1 tab"
        :class="tabMenu ? 'text-detail text-active' : 'text-inactive'"
        >{{$t('deposit.subtitle1')}}</span>
      </div>
      <div v-if="account" text @click="tabMenu = false">
        <span class="h3-sections-heading pb-1 tab"
        :class="tabMenu ? 'text-inactive' : 'text-detail text-active'"
        >{{ $t('deposit.subtitle2') }}</span>
      </div>
    </div>

    <div class="content-deposit mt-9"
      :class="(isCRBTC && tabMenu) ? 'micro' : ''"
    >
      <div class="content-menu">
        <div class="p1-descriptions mb-3">
          {{ tabMenu ? $t('deposit.description1') : $t('withdraw.description1') }}
        </div>
        <dropdown
          :tabMenu="tabMenu"
          :select="select"
          :getMarkets="getMarkets"
          @updateRoute="updateRoute"
        />
      </div>
      <div class="content-micro">
        <div class="p1-descriptions mb-3 text-info">
          {{ $t('deposit.micro') }}
        </div>
        <savings @updateRoute="updateRoute" :microMarket="typeMarket" />
      </div>
      <div class="content-info">
        <div>
          <div class="p1-descriptions text-info mb-1">
            {{ tabMenu ? $t('deposit.description3') : $t('withdraw.description4') }}
          </div>
          <div class="p2-reading-values text-info">
            {{ !tokenBalance ? 0 : tokenBalance | formatDecimals(select.underlyingSymbol) }}
            {{select.underlyingSymbol}}
          </div>
          <div class="p3-USD-values text-info">
            {{ !tokenBalanceUsd ? 0 : tokenBalanceUsd | formatPrice}}
          </div>
        </div>
        <div v-if="tabMenu && marketAddress === addresses[chainId].kSAT && info.supplyBalance > 0
            && typeMarket === 'micro'"
          class="mt-12">
          <div class="d-flex">
            <div class="p1-descriptions text-info mb-1">
              {{ $t('withdraw.description3') }}
            </div>
            <!-- <div class="tooltip-info ml-7">
              <v-tooltip right content-class="secondary-color box-shadow-tooltip" max-width="180">
                <template v-slot:activator="{ on, attrs }">
                  <v-img v-bind="attrs" v-on="on" width="15" height="15"
                        src="@/assets/icons/info2.svg" contain/>
                </template>
                <span class="p5-feedback text-info">
                  {{ $t('deposit.tooltip3') }}
                </span>
              </v-tooltip>
            </div> -->
          </div>
          <div class="p2-reading-values text-info">
            {{ !info.supplyBalance ? 0
              : (0.1 - info.supplyBalance) | formatDecimals(select.underlyingSymbol)}}
            {{select.underlyingSymbol}}
          </div>
          <div class="p3-USD-values text-info">
            {{ !info.supplyBalance ? 0 : (0.1 - info.supplyBalance) * info.price | formatPrice}}
          </div>
        </div>
        <div v-if="tabMenu" class="content-rate">
          <div class="p1-descriptions text-info mb-1 d-flex">
            <div class="text-rate">
              {{ $t('deposit.description4')}}
            </div>
            <div class="tooltip-info ml-7 mt-1">
              <v-tooltip right content-class="secondary-color box-shadow-tooltip" max-width="180">
                <template v-slot:activator="{ on, attrs }">
                  <v-img v-bind="attrs" v-on="on" width="15" height="15"
                        src="@/assets/icons/info2.svg" contain/>
                </template>
                <span class="p5-feedback text-info">
                  {{ $t('deposit.tooltip1') }}
                </span>
              </v-tooltip>
            </div>
          </div>
          <div class="p2-reading-values text-info">
            {{ info.rate }} %
          </div>
        </div>
      </div>
      <div class="content-action">
        <div class="p1-descriptions mb-3 text-info">
          {{ tabMenu ? $t('deposit.description2') : $t('withdraw.description2') }}
        </div>
        <div class="input-box primary-bg"
          :class="!activeButton && amount > 0 ? 'alert' : ''"
        >
          <div class="d-flex">
            <v-text-field
              type="number"
              v-model="amount"
              :rules="[rules.leverage, rules.minBalance, rules.collateral, rules.minkRBTC,
              rules.withoutBalance, rules.supplyBalance, rules.typeMarket]"
              class="h1-title text-info pa-0 ma-0"
              background-color="#CFE7DA"
              color="#47B25F"
              :placeholder="'0 ' + (select.underlyingSymbol ? select.underlyingSymbol : '')"
              filled
              rounded
              dense
              @input="handleAmount"
            ></v-text-field>
            <v-btn @click="setMaxAmount" height="40" text>
              <span class="text-primary">MÁX</span>
            </v-btn>
          </div>
        </div>
        <div class="mt-15">
          <v-slider
            class="mt-3 slider-box"
            min="0"
            max="100"
            color="#4CB163"
            track-color="#C8DEDD"
            tick-size="10"
            thumb-label
            v-model="sliderAmountPercentage" @click="setAmount"
          />
          <div class="ma-0">
            <v-col class="pa-0 d-flex justify-space-between">
              <span class="p1-descriptions">0%</span>
              <span class="p1-descriptions">100%</span>
            </v-col>
          </div>
        </div>
        <div class="d-flex mt-14">
          <v-btn text class="btn-action"
            :disabled="!activeButton"
            :class="activeButton ? 'primary-color' : 'secondary-bg'"
            @click="menuAction"
          >
            <span class="white--text">
              {{ tabMenu
                  ? account ? $t('deposit.btn2') : $t('deposit.btn1')
                  : account ? $t('withdraw.btn2') : $t('withdraw.btn1')
              }}
            </span>
          </v-btn>
        </div>
      </div>
    </div>
    <template v-if="tabMenu">

      <v-divider class="divider"></v-divider>

      <v-row class="mb-5">
        <v-col md="4">
          <h3 class="h3-sections-heading text-detail">
            {{ $t('deposit.calculator.title')}}
          </h3>
        </v-col>
      </v-row>

      <div class="d-flex justify-space-between mb-10">
        <div>
          <div class="p1-descriptions text-info">
            {{ $t('deposit.calculator.description4')}}
          </div>
          <v-slider
            class="mt-3 slider-box"
            min="1"
            max="5"
            color="#4CB163"
            track-color="#C8DEDD"
            tick-size="10"
            thumb-label
            v-model="sliderYear"
          />
          <div>
            <v-col class="pa-0 d-flex justify-space-between">
              <span class="p1-descriptions">
                1 {{ $t('deposit.calculator.time1')}}
              </span>
              <span class="p1-descriptions">
                5 {{ $t('deposit.calculator.time2')}}
              </span>
            </v-col>
          </div>
        </div>
         <div class="box-earnings">
          <div class="p1-descriptions text-info">
            {{ $t('deposit.calculator.description1')}}
          </div>
          <div class="p2-reading-values box-number">
              {{ !possibleEarnings ? 0 : possibleEarnings | formatDecimals }}
              {{ info.underlyingSymbol }}
          </div>
          <div class="p3-USD-values box-number">
            {{ !possibleEarningsUSD ? 0 : possibleEarningsUSD | formatPrice }} USD
          </div>
        </div>
      </div>
    </template>

    <template v-if="showModalConnectWallet">
      <connect-wallet
        :showModal="showModalConnectWallet"
        @closed="outsideConnectWallet"
      />
    </template>

  </div>
</template>
<script>
import { mapState, mapActions } from 'vuex';
import ConnectWallet from '@/components/dialog/ConnectWallet.vue';
import Dropdown from '@/components/general/Dropdown.vue';
import Savings from '@/components/deposits/Savings.vue';
import * as constants from '@/store/constants';
import { addresses } from '@/middleware/contracts/constants';
import {
  Comptroller,
  Firestore,
} from '@/middleware';

export default {
  name: 'Deposit',
  components: {
    ConnectWallet,
    Dropdown,
    Savings,
  },
  data() {
    return {
      counterAction: 0,
      firestore: new Firestore(),
      tabMenu: true,
      comptroller: null,
      constants,
      addresses,
      typeMarket: '',
      getMarkets: [],
      market: null,
      isLoading: false,
      infoLoading: {
        type: 'deposit',
        amount: '',
        symbol: '',
        wallet: true,
        loading: true,
        deposit: true,
        success: null,
      },
      select: {},
      marketAddress: '',
      isCRBTC: false,
      showModalConnectWallet: false,
      sliderAmountPercentage: 0,
      sliderYear: 0,
      amount: null,
      amountEarning: null,
      info: {},
      liquidity: 0,
      rules: { // apalancamiento
        leverage: () => ((this.tabMenu && this.account && this.amount)
          ? this.info.borrowBalance <= 0 : true) || this.$t('dialog.supply-redeem.rule1'),
        minBalance: () => ((this.tabMenu && this.account && this.amount)
          ? Number(this.amount) <= Number(this.info.underlyingBalance) : true)
          || this.$t('dialog.supply-redeem.rule2'),
        supplyBalance: () => ((!this.tabMenu && this.info.supplyBalance > 0 && this.amount)
          ? Number(this.amount) <= Number(this.info.supplyBalance) : true)
          || this.$t('dialog.supply-redeem.rule3'),
        withoutBalance: () => ((!this.tabMenu && this.info.supplyBalance === 0 && this.amount > 0)
          ? this.info.supplyBalance !== 0 : true)
          || this.$t('dialog.supply-redeem.rule4'),
        collateral: () => ((!this.tabMenu && this.amount > 0)
          ? this.info.borrowBalance <= 0 : true)
          || this.$t('dialog.supply-redeem.rule5'),
        typeMarket: () => (((this.typeMarket === '' && this.amount && this.tabMenu
          && this.account && this.isCRBTC))
          ? this.typeMarket !== '' : true)
          || this.$t('dialog.supply-redeem.rule6'),
        minkRBTC: () => (this.marketAddress === addresses[this.chainId].kSAT && this.typeMarket !== ''
          ? (Number(this.info.supplyBalance) + Number(this.amount)) <= 0.1 : true)
          || this.$t('dialog.supply-redeem.rule7'),
      },
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
      marketStore: (state) => state.Market.market,
    }),
    tokenBalanceUsd() {
      return this.tabMenu
        ? this.info.underlyingBalance * this.info.price
        : this.info.supplyBalance * this.info.price;
    },
    tokenBalance() {
      return this.tabMenu ? this.info.underlyingBalance : this.info.supplyBalance;
    },
    withdraw() {
      return (this.liquidity / this.info.underlyingPrice) > this.info.supplyBalance
        ? this.info.supplyBalance : (this.liquidity / this.info.underlyingPrice);
    },
    possibleEarnings() {
      return +this.amountEarning ? (((this.amountEarning * this.supplyRate) + (this.info
        .supplyBalance * this.supplyRate)) * this.sliderYear) : (this.info
        .interestBalance * this.sliderYear);
    },
    possibleEarningsUSD() {
      return this.possibleEarnings * this.info.underlyingPrice;
    },
    possibleEarningsPlusDeposit() {
      if (+this.amountEarning) {
        return this.possibleEarnings > this.info.interestBalance ? (+this.info
          .supplyBalance + +this.amountEarning + +this.possibleEarnings) : (this.info
          .supplyBalance * this.sliderYear);
      }
      return this.info.supplyBalance + this.possibleEarnings;
    },
    possibleEarningsPlusDepositUSD() {
      return this.possibleEarningsPlusDeposit * this.info.underlyingPrice;
    },
    supplyRate() {
      return this.info.rate / 100;
    },
    activeButton() {
      return this.amount > 0 && typeof this
        .rules.minkRBTC() !== 'string' && typeof this
        .rules.typeMarket() !== 'string' && typeof this
        .rules.minBalance() !== 'string' && typeof this
        .rules.withoutBalance() !== 'string' && typeof this
        .rules.collateral() !== 'string' && typeof this
        .rules.leverage() !== 'string' && typeof this
        .rules.supplyBalance() !== 'string';
    },
  },
  watch: {
    tabMenu() {
      this.reset();
    },
    markets() {
      if (this.markets.length > 3) this.getMarketsStore(this.markets);
    },
    marketsStore() {
      this.getMarkets = this.marketsStore;
    },
    infoStore() {
      this.info = this.infoStore;
    },
    selectStore() {
      this.select = this.selectStore;
    },
    $route() {
      this.getMarket();
    },
    marketStore() {
      this.market = this.marketStore;
    },
    account() {
      this.amount = null;
      this.sliderAmountPercentage = null;
      if (!this.account) this.tabMenu = true;
      this.updateMarket();
    },
    amount() {
      this.amountEarning = this.amount;
    },
  },
  methods: {
    ...mapActions({
      getMarketsStore: constants.MARKET_GET_MARKETSINFO,
    }),
    async menuAction() {
      if (!this.account) {
        this.showModalConnectWallet = true;
        return;
      }

      this.$store.dispatch({
        type: constants.USER_ACTION,
        market: this.market,
        action: this.tabMenu ? constants.USER_ACTION_MINT : constants.USER_ACTION_REDEEM,
        amount: this.amount,
        symbol: this.select.underlyingSymbol,
        price: this.info.underlyingPrice,
      });

      this.reset();

      this.market.wsInstance.on('TokenFailure', (from, to, amount, event) => {
        console.info(`Failure from ${from} Event: ${JSON.stringify(event)}`);
        const { error, detail, info } = event.args;
        console.log(`Error: ${error}, detail: ${detail}, info: ${info}`);
        this.counterAction = 0;
        if (this.walletAddress === from) {
          // this.showError();
          console.log('error');
        }
      });
    },
    updateRoute(marketAddress, typeMarket = '') {
      this.typeMarket = typeMarket;
      if (this.$route.params.id !== marketAddress) {
        const to = { name: this.$route.name, params: { id: marketAddress } };
        this.$router.push(to);
      }
      if (!typeMarket) this.reset();
    },
    updateMarket() {
      this.$store.dispatch({
        type: constants.MARKET_UPDATE_MARKET,
        marketAddress: this.$route.params.id,
        walletAddress: this.walletAddress,
        page: constants.ROUTE_NAMES.DEPOSITS,
        account: this.account,
      });
      this.getLiquidity();
    },
    async getMarket() {
      this.marketAddress = this.$route.params.id;
      const iskRBTC = addresses[this.chainId].kRBTC;
      const iskSAT = addresses[this.chainId].kSAT;
      // si es crbtc mostramos microsavings
      this.isCRBTC = this.marketAddress === iskRBTC
        || this.marketAddress === iskSAT;

      const data = {
        marketAddress: this.$route.params.id,
        walletAddress: this.walletAddress,
        page: constants.ROUTE_NAMES.DEPOSITS,
        account: this.account,
      };
      this.$store.dispatch({
        type: constants.MARKET_GET_MARKET,
        ...data,
      });
      this.getLiquidity();
    },
    outsideConnectWallet() {
      this.showModalConnectWallet = false;
    },
    setAmount() {
      if (this.sliderAmountPercentage === 100) {
        this.amount = this.tabMenu ? this.info.underlyingBalance : this.info.supplyBalance;
      } else {
        this.amount = (this.sliderAmountPercentage * this.tokenBalance) / 100;
      }
    },
    setMaxAmount() {
      if (this.account) {
        this.amount = this.tabMenu ? this.info.underlyingBalance : this.withdraw;
        this.setPercentageSlider();
      }
    },
    handleAmount() {
      const value = (this.amount / this.tokenBalance) * 100;
      this.sliderAmountPercentage = value.toFixed(0);
    },
    setPercentageSlider() {
      this.sliderAmountPercentage = (this.amount * 100) / this.tokenBalance;
    },
    reset() {
      this.sliderAmountPercentage = 0;
      this.amount = null;
    },
    async getLiquidity() {
      if (this.account) {
        this.liquidity = await this.comptroller.getAccountLiquidity(this.walletAddress);
      } else {
        this.liquidity = 0;
      }
    },
    closeDialog() {
      if (this.infoLoading.loading === false) {
        this.getMarket();
      }
      this.isLoading = false;
    },
    ofBalance() {
      const { menu } = this.$route.params;
      if (menu === false) {
        this.tabMenu = menu;
      }
    },
  },
  created() {
    this.marketAddress = this.$route.params.id;
    this.comptroller = new Comptroller(this.chainId);
    this.ofBalance();
    this.getMarket();
    this.getMarketsStore(this.markets);
  },
};
</script>
