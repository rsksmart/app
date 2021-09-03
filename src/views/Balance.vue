<template>
  <div class="balance">
    <h2 class="h2-heading text-detail">{{$t('balance.title')}}</h2>
    <div class="container-balance">
      <risk-balance :riskRate="riskValue" />
      <liquidity-balance :liquidityAmount="liquidity" :priceRbtc="priceRbtc"/>
      <deposits-balance :infoDeposits="infoDeposits" :priceRbtc="priceRbtc" />
      <debts-balance :infoBorrows="infoBorrows" :priceRbtc="priceRbtc" />
      <chart-balance :chartInfo="chartData" :chartColor="chartColor"/>
    </div>
    <v-row class="d-flex justify-center mt-15" v-if="isLoading">
      <v-progress-circular class="mt-5" :size="80" :width="6" indeterminate
        color="#47B25F"></v-progress-circular>
    </v-row>
    <history-balance v-else :dataMarkets="dataMarkets"
      :infoDeposits="infoDeposits"
      :infoBorrows="infoBorrows"
      :dataActivity="dataActivity"
    />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import * as constants from '@/store/constants';
import RiskBalance from '@/components/balance/RiskBalance.vue';
import ChartBalance from '@/components/balance/ChartBalance.vue';
import DepositsBalance from '@/components/balance/DepositsBalance.vue';
import DebtsBalance from '@/components/balance/DebtsBalance.vue';
import HistoryBalance from '@/components/balance/HistoryBalance.vue';
import LiquidityBalance from '@/components/balance/LiquidityBalance.vue';
import { addresses } from '@/middleware/contracts/constants';
import {
  CRbtc,
  CToken,
  Market,
  Comptroller,
  Firestore,
} from '@/middleware';

export default {
  components: {
    RiskBalance,
    DepositsBalance,
    DebtsBalance,
    ChartBalance,
    HistoryBalance,
    LiquidityBalance,
  },
  data() {
    return {
      constants,
      db: this.$firebase.firestore(),
      firestore: new Firestore(),
      liquidity: 0,
      counter: 0,
      priceRbtc: 0,
      isLoading: true,
      riskValue: 0,
      comptroller: null,
      marketAddresses: [],
      myMarkets: [],
      infoDeposits: {},
      infoBorrows: {},
      dataMarkets: [],
      chartData: [],
      dataActivity: [],
      chartColor: [],
      supplyColor: [
        { color: '' },
        { color: '' },
        { color: '' },
        { color: '' },
        { color: '' },
      ],
      borrowColor: [
        { color: '' },
        { color: '' },
        { color: '' },
        { color: '' },
        { color: '' },
      ],
      borrowData: [
        ['', 0, ''],
        ['', 0, ''],
        ['', 0, ''],
        ['', 0, ''],
        ['', 0, ''],
      ],
      supplyData: [
        ['', 0, ''],
        ['', 0, ''],
        ['', 0, ''],
        ['', 0, ''],
        ['', 0, ''],
      ],
    };
  },
  computed: {
    ...mapState({
      chainId: (state) => state.Session.chainId,
      walletAddress: (state) => state.Session.walletAddress,
      markets: (state) => state.Session.markets,
    }),
  },
  watch: {
    walletAddress() {
      if (!this.walletAddress) {
        this.redirect();
      }
    },
  },
  methods: {
    async getUserActivity() {
      const activity = await this.firestore
        .getUserActivity(this.comptroller.comptrollerAddress, this.walletAddress);
      const done = new Promise((resolve) => {
        activity.forEach(async (a, index, array) => {
          let info = {};
          const img = await this.db
            .collection('markets-symbols')
            .doc(a.market)
            .get()
            .then((response) => response.data().imageURL);

          const date = new Date(a.timestamp.seconds * 1000);
          info = {
            ...a,
            img,
            date,
          };
          this.dataActivity.push(info);
          if (index === array.length - 1) resolve();
        });
      });

      done.then(() => {
        this.dataActivity.sort((prev, curr) => {
          if (prev.date.toISOString() < curr.date.toISOString()) return 1;
          if (prev.date.toISOString() > curr.date.toISOString()) return -1;
          return 0;
        });
      });
    },
    async getMarkets() {
      return new Promise((resolve, reject) => {
        let counter = 0;
        this.marketAddresses.forEach(async (marketAddress) => {
          await Market.isCRbtc(marketAddress)
            .then((isCRbtc) => {
              counter += 1;
              if (isCRbtc) {
                this.myMarkets.push(new CRbtc(marketAddress, this.chainId));
              } else {
                this.myMarkets.push(new CToken(marketAddress, this.chainId));
              }
              if (counter === this.marketAddresses.length) resolve(this.markets);
            })
            .catch(reject);
        });
      });
    },
    async getData() {
      this.marketAddresses = await this.comptroller.allMarkets();
      if (this.walletAddress) {
        await this.getMarkets();

        // liquidity
        this.liquidity = await this.comptroller.getAccountLiquidity(this.walletAddress);

        // risk value
        // this.riskValue = await this.comptroller
        //   .healthFactor(this.markets, this.chainId, this.walletAddress) * 100;
        // new risk
        const risk = await this.comptroller
          .risk(this.markets, this.walletAddress, this.chainId);
        console.log('risk', risk);
        this.riskValue = Number(risk.result);

        // Supply
        this.infoDeposits = await this.comptroller
          .totalDepositsByInteresesInUSD(this.myMarkets, this.walletAddress, this.chainId);

        // Borrow
        this.infoBorrows = await this.comptroller
          .totalBorrowsByInteresesInUSD(this.myMarkets, this.walletAddress, this.chainId);
      } else {
        this.myMarkets = [];
      }
    },
    async getMarketsInfo() {
      if (!this.walletAddress) return;
      const data = [];
      this.chartData = [];
      await this.markets.map(async (market, i) => {
        try {
          const info = {};
          // General
          info.rateSupply = await market.supplyRateAPY();
          info.rateBorrow = await market.borrowRateAPY();
          info.rateSupply = info.rateSupply.toFixed(2);
          info.rateBorrow = info.rateBorrow.toFixed(2);

          info.marketAddress = market.marketAddress;
          info.symbol = await market.underlyingAssetSymbol();
          info.price = await market.underlyingCurrentPrice(this.chainId);
          info.img = await this.db
            .collection('markets-symbols')
            .doc(info.symbol)
            .get()
            .then((response) => response.data().imageURL);

          // Supply
          info.supplyBalance = await market.currentBalanceOfCTokenInUnderlying(this.walletAddress);
          info.supplyBalance = (info.supplyBalance * info.price) <= 1e-5 ? 0 : info.supplyBalance;
          info.interestBalance = await market.getEarnings(this.walletAddress);
          info.blanceUsd = info.supplyBalance * info.price;
          info.interesUsd = info.interestBalance * info.price;

          // Borrow
          info.borrowBalance = await market.borrowBalanceCurrent(this.walletAddress);
          info.borrowBalance = (info.borrowBalance * info.price) <= 1e-5 ? 0 : info.borrowBalance;
          info.interestBorrow = await market.getDebtInterest(this.walletAddress);
          info.borrowUsd = info.borrowBalance * info.price;
          info.interestBorrowUsd = info.interestBorrow * info.price;

          // chart balance
          const dataBorrow = ['', 0, ''];
          const dataSupply = ['', 0, ''];

          if (info.supplyBalance > 0) {
            dataSupply[0] = addresses[this.chainId].kSAT === info.marketAddress
              ? `Micro-${info.symbol.toUpperCase()}` : info.symbol.toUpperCase();
            dataSupply[1] = info.supplyBalance * info.price;
            dataSupply[2] = info.marketAddress;
            this.supplyData[i] = dataSupply;

            if (addresses[this.chainId].kSAT === info.marketAddress) this.supplyColor[i] = { color: '#095223' };
            if (addresses[this.chainId].kRBTC === info.marketAddress) this.supplyColor[i] = { color: '#47B25F' };
            if (addresses[this.chainId].kRIF === info.marketAddress) this.supplyColor[i] = { color: '#79BF89' };
            if (addresses[this.chainId].kDOC === info.marketAddress) this.supplyColor[i] = { color: '#429A62' };
            if (addresses[this.chainId].kUSDT === info.marketAddress) this.supplyColor[i] = { color: '#8AE39E' };
          } else {
            this.supplyColor[i] = { color: '' };
            dataSupply[2] = info.marketAddress;
            dataSupply[0] = info.symbol.toUpperCase();
            this.supplyData[i] = dataSupply;
          }

          if (info.borrowBalance > 0) {
            dataBorrow[0] = addresses[this.chainId].kSAT === info.marketAddress
              ? `Micro-${info.symbol.toUpperCase()}` : info.symbol.toUpperCase();
            dataBorrow[1] = info.borrowBalance * info.price;
            dataBorrow[2] = info.marketAddress;
            this.borrowData[i] = dataBorrow;

            if (addresses[this.chainId].kSAT === info.marketAddress) this.borrowColor[i] = { color: '#EEAF0E' };
            if (addresses[this.chainId].kRBTC === info.marketAddress) this.borrowColor[i] = { color: '#F7C61A' };
            if (addresses[this.chainId].kRIF === info.marketAddress) this.borrowColor[i] = { color: '#A5A711' };
            if (addresses[this.chainId].kDOC === info.marketAddress) this.borrowColor[i] = { color: '#BCBE34' };
            if (addresses[this.chainId].kUSDT === info.marketAddress) this.borrowColor[i] = { color: '#D5D77D' };
          } else {
            this.borrowColor[i] = { color: '' };
            this.borrowData[i] = dataBorrow;
            dataBorrow[0] = info.symbol.toUpperCase();
            dataBorrow[2] = info.marketAddress;
          }

          this.chartColor = [...this.supplyColor, ...this.borrowColor];
          this.chartData = [...this.supplyData, ...this.borrowData];

          data.push(info);
          this.dataMarkets = data;
          this.counter += 1;
          if (this.counter === this.markets.length) this.isLoading = false;
        } catch (error) {
          console.error(error);
        }
      });
    },
    redirect() {
      if (!this.walletAddress) {
        const to = { name: constants.ROUTE_NAMES.DEPOSITS };
        this.$router.push(to);
      }
    },
    async getPrice() {
      this.rbtc = addresses[this.chainId].kRBTC;

      const market = new CRbtc(this.rbtc, this.chainId);
      this.priceRbtc = await market.underlyingCurrentPrice(this.chainId);
    },
  },
  created() {
    this.comptroller = new Comptroller(this.chainId);
    this.getPrice();
    this.redirect();
    this.getUserActivity();
    this.getData();
    this.getMarketsInfo();
  },
};
</script>
