<template>
  <div class="borrow">
    <h2 class="h2-heading text-detail mb-10">{{ $t('borrow.title') }}</h2>
    <div class="d-flex">
      <div text @click="tabMenu = true" class="mr-10">
        <span class="h3-sections-heading pb-1 tab"
        :class="tabMenu ? 'text-detail text-active' : 'text-inactive'"
        >{{ $t('borrow.tab1') }}</span>
      </div>
      <div v-if="account" text @click="tabMenu = false">
        <span class="h3-sections-heading pb-1 tab"
        :class="tabMenu ? 'text-inactive' : 'text-detail text-active'"
        >{{ $t('borrow.tab2') }}</span>
      </div>
    </div>

    <div class="content-borrow mt-9" :class="!tabMenu ? 'content-pay': ''">
      <div class="content-menu">
        <div class="p1-descriptions mb-3">
          {{ tabMenu ? $t('borrow.description1') : $t('pay.description1')}}
        </div>
        <dropdown :select="select" :getMarkets="getMarkets" @updateRoute="updateRoute"/>
      </div>
      <div class="content-amunt mb-10">
        <div v-if="tabMenu" class="d-flex amout">
          <div>
            <div class="p1-descriptions">
              {{ tabMenu ? $t('borrow.description2') : $t('pay.description3')}}
            </div>
            <div class="p2-reading-values">
              {{ !tokenBalance ? 0 : tokenBalance - interestBorrow | formatDecimals }}
              {{ info.underlyingSymbol }}
            </div>
            <div class="p3-USD-values">{{ !tokenBorrow ? 0 : tokenBorrow | formatPrice }} USD</div>
          </div>
          <div class="tooltip-info ml-7 mt-1">
            <v-tooltip v-if="tabMenu" top
              content-class="secondary-color box-shadow-tooltip" max-width="180">
              <template v-slot:activator="{ on, attrs }">
                <v-img v-bind="attrs" v-on="on" width="15" height="15"
                        src="@/assets/icons/info2.svg" contain/>
              </template>
              <span class="p5-feedback text-info">
                {{ $t('borrow.tooltip1') }}
              </span>
            </v-tooltip>
          </div>
        </div>
        <div class="d-flex">
          <div>
            <div class="p1-descriptions rate-text">
              {{ tabMenu ? $t('borrow.description3') : $t('pay.description4')}}
            </div>
            <div v-if="tabMenu" class="p2-reading-values">{{ info.rate }} %</div>
            <template v-else>
              <div class="p2-reading-values">
                {{ !tokenBalance ? 0 : tokenBalance | formatDecimals
                }} {{ info.underlyingSymbol }}
              </div>
              <div class="p3-USD-values">{{ !tokenPrice ? 0 : tokenPrice | formatPrice }} USD</div>
            </template>
          </div>
          <div class="tooltip-info ml-7 mt-1">
            <v-tooltip v-if="tabMenu" top
              content-class="secondary-color box-shadow-tooltip" max-width="180">
              <template v-slot:activator="{ on, attrs }">
                <v-img v-bind="attrs" v-on="on" width="15" height="15"
                        src="@/assets/icons/info2.svg" contain/>
              </template>
              <span class="p5-feedback text-info">
                {{ $t('borrow.tooltip2') }}
              </span>
            </v-tooltip>
          </div>
        </div>
      </div>
      <div class="content-liquidation">
        <div class="text-risk text-info mb-2">{{$t('borrow.description6')}}</div>
        <div class="chart-box">
          <div class="content-chart">
            <GChart type="ColumnChart"  rx="5" ry="5" :data="chartData" :options="chartOptions" />
          </div>
          <div class="divider"></div>
          <div class="content-risk">
            <risk-chart :riskRate="percentCurrent" :inBalance="false"
              :typeChart="'borrow'"
            />
          </div>
        </div>
      </div>

      <div class="content-action">
        <v-divider class="divider mb-4 mt-6"></v-divider>

        <div class="p1-descriptions mb-3 text-info">
          {{ tabMenu ? $t('borrow.description4') : $t('pay.description2')}}
        </div>
        <div class="input-box primary-bg ma-0"
          :class="!activeButton && amount > 0 ? 'alert' : ''"
        >
          <div class="d-flex">
            <v-text-field
              type="number"
              v-model="amount"
              :rules="[rules.liquidity, rules.minBalance, rules.cash,
              rules.borrowBalance, rules.payBorrow]"
              class="h1-title text-info pa-0 ma-0"
              background-color="#CFE7DA"
              color="#47B25F"
              :placeholder="'0 ' + (select.underlyingSymbol ? select.underlyingSymbol : '')"
              filled
              rounded
              dense
              @input="handleAmount"
            ></v-text-field>
            <v-btn  height="40" text @click="setMaxAmount">
              <span class="text-primary">MÁX</span>
            </v-btn>
          </div>
        </div>
        <div>
            <v-slider
              class="slider-box"
              :class="sliderStyle"
              min="0"
              max="100"
              track-color="#C8DEDD"
              tick-size="10"
              thumb-label
              :thumb-color="chartData[2][2]"
              v-model="sliderValue"
              @change="handleBalance"
            />
            <div class="ma-0">
              <v-col class="pa-0 d-flex justify-space-between">
                <span class="p1-descriptions">0%</span>
                <span class="p1-descriptions">100%</span>
              </v-col>
            </div>
          </div>

          <v-divider class="divider mt-10 mb-12"></v-divider>

          <div class="section-warnning">
            <img src="@/assets/icons/warnning.svg"/>
            <div class="p1-descriptions box-warnning">
              {{$t('borrow.description5')}}
            </div>

          </div>

          <v-btn text class="btn-action"
            :disabled="!activeButton"
            :class="activeButton ? 'primary-color' : 'secondary-bg'"
            @click="menuAction"
          >
            <span class="white--text">
              {{ tabMenu
                  ? account ? $t('borrow.btn2') : $t('borrow.btn1')
                  : account ? $t('pay.btn2') : $t('pay.btn1')
              }}
            </span>
          </v-btn>
      </div>
    </div>
    <template v-if="showModalConnectWallet">
      <connect-wallet
        :showModal="showModalConnectWallet"
        @closed="outsideConnectWallet"
      />
    </template>

    <template v-if="isLoading">
      <loading :showModal="isLoading" :data="infoLoading" @closed="closeDialog" />
    </template>
  </div>
</template>
<script>
import { mapState, mapActions } from 'vuex';
import Dropdown from '@/components/general/Dropdown.vue';
import * as constants from '@/store/constants';
import RiskChart from '@/components/users/RiskChart.vue';
import ConnectWallet from '@/components/dialog/ConnectWallet.vue';
import Loading from '@/components/modals/Loading.vue';
// import { addresses } from '@/middleware/contracts/constants';

import {
  Comptroller,
  Firestore,
} from '@/middleware';

export default {
  components: {
    RiskChart,
    ConnectWallet,
    Loading,
    Dropdown,
  },
  data() {
    return {
      counterAction: 0,
      firestore: new Firestore(),
      canBorrow: 0,
      percentCurrent: 0,
      borrowCurrent: 0,
      isProgress: true,
      tabMenu: true,
      sliderStyle: '',
      constants,
      comptroller: null,
      isLoading: false,
      sliderValue: 0,
      getMarkets: [],
      riskValue: 100,
      interestBorrow: 0,
      amount: null,
      market: null,
      isInBorrowMenu: true,
      showModalConnectWallet: false,
      liquidity: 0,
      select: {},
      infoLoading: {
        type: 'borrow',
        amount: '',
        symbol: '',
        wallet: true,
        loading: true,
        borrow: true,
        success: null,
      },
      info: {},
      chartData: [
        ['', '', { role: 'style' }],
        [this.$t('dialog.borrow.description10'), 0, '#7DCCB6'],
        [this.$t('dialog.borrow.description11'), 0, '#47B25F'],
      ],
      chartOptions: {
        width: 312,
        // height: 200,
        tooltip: { isHTML: true },
        backgroundColor: 'transparent',
        vAxis: {
          title: this.$t('dialog.borrow.description9'),
          colors: ['#9575cd', '#33ac71'],
          labelStyle: { color: '#A3B8A7' },
          titleTextStyle: { color: '#A3B8A7' },
          titlePosition: { position: 'right' },
          textStyle: { color: '#A3B8A7' },
          // gridLines: { count: 10 },
          gridlines: { count: 4 },
          viewWindow: {
            min: 0,
          },
        },
        bar: { groupWidth: '30%' },
        legend: {
          position: 'none',
        },
        hAxis: {
          textStyle: { color: '#042F24' },
          legend: 'none',
        },
      },
      rules: {
        cash: () => ((this.tabMenu && this.account && this.amount)
          ? Number(this.amount) <= Number(this.info.cash) : true)
          || this.$t('dialog.borrow-repay.rule2') + this.info.cash + this.select.underlyingSymbol,
        liquidity: () => ((this.tabMenu && this.account && this.amount)
          ? Number(this.amountAsUnderlyingPrice) <= Number(this.liquidity) : true)
          || this.$t('dialog.borrow-repay.rule1'),
        minBalance: () => ((!this.tabMenu && this.info.borrowBalance > 0 && this.amount)
          ? Number(this.amount) <= Number(this.info.underlyingBalance) : true)
          || this.$t('dialog.borrow-repay.rule3'),
        borrowBalance: () => ((!this.tabMenu && this.info.borrowBalance > 0 && this.amount)
          ? Number(this.amount) <= Number(this.info.borrowBalance) : true)
          || this.$t('dialog.borrow-repay.rule4'),
        payBorrow: () => ((!this.tabMenu && this.amount > 0 && this.info.borrowBalance === 0)
          ? this.info.borrowBalance !== 0 : true)
          || this.$t('dialog.borrow-repay.rule5'),
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
      isProgressStore: (state) => state.Market.isProgress,
    }),
    borrowValueInUSD() {
      return this.amount * this.info.underlyingPrice;
    },
    tokenBalance() {
      return this.tabMenu ? (this.liquidity / this.info
        .underlyingPrice) : this.info.borrowBalance;
    },
    tokenPrice() {
      return this.tokenBalance * this.info.underlyingPrice;
    },
    tokenBorrow() {
      return (this.tokenBalance - this.interestBorrow) * this.info.underlyingPrice;
    },
    amountAsUnderlyingPrice() {
      return Number(this.amount * this.info.underlyingPrice);
    },
    activeButton() {
      return this.amount > 0 && typeof this
        .rules.liquidity() !== 'string' && typeof this
        .rules.minBalance() !== 'string' && typeof this
        .rules.payBorrow() !== 'string' && typeof this
        .rules.borrowBalance() !== 'string' && typeof this
        .rules.cash() !== 'string';
    },
  },
  watch: {
    isProgressStore() {
      this.isProgress = this.isProgressStore;
    },
    markets() {
      if (this.markets.length > 3) this.getMarketsStore(this.markets);
    },
    async amount() {
      this.riskValue = await this.comptroller
        .hypotheticalHealthFactor(this.markets, this.chainId,
          this.walletAddress, this.borrowValueInUSD) * 100;
      if (this.amount > 0) this.calculateRisk();
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
      this.totalDepositsInUSD();
      this.reset();
    },
    marketStore() {
      this.market = this.marketStore;
    },
    account() {
      if (!this.account) this.tabMenu = true;
      this.updateMarket();
      this.totalDepositsInUSD();
      this.getDataRisk();
    },
    tabMenu() {
      this.reset();
    },
  },
  methods: {
    ...mapActions({
      getMarketsStore: constants.MARKET_GET_MARKETSINFO,
      getIsProgressStore: constants.MARKET_ISPROGRESS,
    }),
    async menuAction() {
      if (!this.account) {
        this.showModalConnectWallet = true;
        return;
      }

      this.$store.dispatch({
        type: constants.USER_ACTION,
        market: this.market,
        action: this.tabMenu ? constants.USER_ACTION_BORROW : constants.USER_ACTION_REPAY,
        amount: this.amount,
        symbol: this.select.underlyingSymbol,
        price: this.info.underlyingPrice,
      });

      this.reset();

      this.market.wsInstance.on('TokenFailure', (from, to, amount, event) => {
        console.info(`Failure from ${from} Event: ${JSON.stringify(event)}`);
        const { error, detail, info } = event.args;
        console.log(`Error: ${error}, detail: ${detail}, info: ${info}`);
        if (this.walletAddress === from) {
          console.log('error');
        }
      });
    },
    updateRoute(marketAddress) {
      if (this.$route.params.id !== marketAddress) {
        const to = { name: this.$route.name, params: { id: marketAddress } };
        this.$router.push(to);
      }
    },
    updateMarket() {
      this.$store.dispatch({
        type: constants.MARKET_UPDATE_MARKET,
        walletAddress: this.walletAddress,
        page: constants.ROUTE_NAMES.BORROWS,
        account: this.account,
      });
      this.reset();
    },
    getMarket() {
      // this.isProgress = true;
      this.getIsProgressStore(true);
      const data = {
        marketAddress: this.$route.params.id,
        walletAddress: this.walletAddress,
        account: this.account,
      };

      this.$store.dispatch({
        type: constants.MARKET_GET_MARKET,
        ...data,
      });
      this.reset();
    },
    handleBalance() {
      if (!this.account) return;
      if (this.tabMenu) {
        this.chartColor();
      }
      if (this.sliderValue === 100) {
        this.amount = this.tabMenu ? this.tokenBalance : this.info.borrowBalance;
      } else {
        const balance = (this.sliderValue * this.tokenBalance) / 100;
        this.amount = balance;
      }
      const tempData = [...this.chartData];
      tempData[2][1] = this.borrowValueInUSD;
      this.chartData = tempData;
    },
    handleAmount() {
      if (this.tabMenu) {
        const value = (this.amount / this.tokenBalance) * 100;
        this.sliderValue = value.toFixed(0);
        const tempData = [...this.chartData];
        tempData[2][1] = this.borrowValueInUSD;
        this.chartData = tempData;
        this.chartColor();
      } else {
        const value = (this.amount / this.info.borrowBalance) * 100;
        this.sliderValue = value.toFixed(0);
      }
    },
    chartColor() {
      const tempData = [...this.chartData];
      if (this.sliderValue >= 0 && this.sliderValue < 40) {
        tempData[2][2] = '#47B25F';
        this.sliderStyle = '';
      }
      if (this.sliderValue >= 40 && this.sliderValue < 60) {
        tempData[2][2] = '#BCBE34';
        this.sliderStyle = 'vs40';
      }
      if (this.sliderValue >= 60 && this.sliderValue <= 100) {
        tempData[2][2] = '#F7C61A';
        this.sliderStyle = 'vs60';
      }
      if (this.sliderValue === 100) tempData[2][2] = '#F7C61A';

      this.chartData = tempData;
    },
    async totalDepositsInUSD() {
      if (this.walletAddress) {
        const tempData = [...this.chartData];

        // collateral
        const collateral = await this.comptroller
          .totalDepositsByInteresesInUSD(this.markets, this.walletAddress, this.chainId);

        tempData[1][1] = collateral.totalDepositsByIntereses;
        this.chartData = tempData;

        // we get the interest to pay
        this.interestBorrow = await this.market.getDebtInterest(this.walletAddress);
      } else {
        this.interestBorrow = 0;
        this.liquidity = 0;
      }
    },
    setMaxAmount() {
      if (!this.account) return;
      if (this.tabMenu) {
        this.amount = this.tokenBalance;
        this.chartColor();
      } else {
        this.amount = this.info.borrowBalance;
      }
      this.handleAmount();
    },
    outsideConnectWallet() {
      this.showModalConnectWallet = false;
    },
    reset() {
      this.amount = null;
      this.sliderValue = 0;
      const tempData = [...this.chartData];
      tempData[2][1] = 0;
      tempData[2][2] = '#47B25F';
      this.chartData = tempData;
      this.riskValue = 100;
      this.sliderStyle = '';
      this.borrowCurrent = 0;
      this.percentCurrent = 0;
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
    calculateRisk() {
      // let factor = 0;
      // const {
      //   kSAT,
      //   kRBTC,
      //   kDOC,
      //   kRIF,
      //   kUSDT,
      // } = addresses[this.chainId];
      // const { marketAddress } = this.market;
      // console.log('marketAddress', marketAddress);
      // console.log('kUSDT', kUSDT);
      // console.log(marketAddress === kUSDT);
      // console.log(this.borrowValueInUSD * 0.75);
      // if (marketAddress === kSAT) factor = this.borrowValueInUSD * 0.50;
      // if (marketAddress === kRBTC) factor = this.borrowValueInUSD * 0.75;
      // if (marketAddress === kDOC) factor = this.borrowValueInUSD * 0.70;
      // if (marketAddress === kRIF) factor = this.borrowValueInUSD * 0.65;
      // if (marketAddress === kUSDT) factor = this.borrowValueInUSD;
      // console.log('factor', factor);
      // console.log('liquidity', this.liquidity);
      this.borrowCurrent = (this.canBorrow - this.liquidity) + this.borrowValueInUSD;
      const percent = ((this.borrowCurrent / this.canBorrow) * 100).toFixed(0);
      this.percentCurrent = Number(percent);
      // console.log('value', this.borrowCurrent);
      // console.log('percent', percent);
      // console.log('percentCurrent', this.percentCurrent);
    },
    async getDataRisk() {
      if (!this.walletAddress) return;
      const risk = await this.comptroller
        .risk(this.markets, this.walletAddress, this.chainId);

      this.liquidity = await this.comptroller.getAccountLiquidity(this.walletAddress);

      const { canBorrow, result } = risk;
      this.canBorrow = canBorrow;
      this.percentCurrent = Number(result);
      this.calculateRisk();
    },
  },
  created() {
    this.ofBalance();
    this.comptroller = new Comptroller(this.chainId);
    this.getMarket();
    this.getMarketsStore(this.markets);
    this.totalDepositsInUSD();
    this.getDataRisk();
  },
};
</script>
