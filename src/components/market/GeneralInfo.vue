<template>
  <v-card width="100%" class="market-card container" color="#013E2F">
    <v-row class="ma-0 container">
      <v-col cols="auto" class="pa-0 pr-2 d-flex align-center">
        <v-img position="left center" height="40" width="40" :src="symbolImg" contain/>
      </v-col>
      <v-col class="pa-0 d-flex align-center">
        <h2 class="h2-heading">{{ info.underlyingSymbol }}</h2>
      </v-col>
      <v-col cols="auto" class="pa-0 d-flex justify-center align-center">
        <a :href="marketOnExplorer" target="_blank">
          <v-img height="16" src="@/assets/icons/link.svg" contain/>
        </a>
      </v-col>
    </v-row>
    <v-row class="ma-0 mx-3">
      <v-divider color="#BEBEBE"/>
    </v-row>
    <div class="container">
      <v-row class="ma-0">
        <p class="p1-descriptions">{{ marketBalanceLabel }}</p>
      </v-row>
      <v-row class="ma-0">
        <v-tooltip top color="#52826E">
          <template v-slot:activator="{ on, attrs }">
            <p class="p2-reading-values" v-bind="attrs" v-on="on">
              {{ marketBalance | formatDecimals(info
              .underlyingSymbol ) }} {{ info.underlyingSymbol }}
            </p>
          </template>
          <span>{{ marketBalance }}</span>
        </v-tooltip>
      </v-row>
      <v-row class="ma-0">
        <p class="p3-USD-values">{{ marketBalanceInUSD | formatPrice }} USD</p>
      </v-row>
    </div>
    <v-row class="ma-0 mx-3">
      <v-divider color="#BEBEBE"/>
    </v-row>
    <v-row class="ma-0 container">
      <v-col cols="8" class="pa-0">
        <p class="p1-descriptions">
          {{ $t('market.general.description1') }}
          {{ rateLabel }}
          {{ $t('market.general.description2') }}
        </p>
        <p class="p1-descriptions">
          {{ $t('market.general.description3') }}
        </p>
      </v-col>
      <v-col cols="4" class="pa-0 d-flex justify-end">
        <p class="text-right p2-reading-values">{{ info.rate }}%</p>
      </v-col>
    </v-row>
    <v-row class="ma-0 container">
      <!-- eslint-disable max-len -->
      <v-btn depressed :color="buttonColor" width="100%" height="44" @click="supplyOrBorrow" :disabled=isDisabled>
        <span class="b1-main">{{ buttonName }}</span>
      </v-btn>
    </v-row>
    <template v-if="walletDialog">
      <connect-wallet :showModal="walletDialog" @closed="walletDialog = false"/>
    </template>
    <template v-if="supplyBorrowDialog">
      <component :is="supplyBorrowComponent" :showModal="supplyBorrowDialog"
                 @action="menuAction" :info="{ market, ...info }"
                 @closed="supplyBorrowDialog = false"
                 :inBorrowMenu="true"/>
    </template>
    <template v-if="waitingDialog">
      <loading :showModal="waitingDialog"/>
    </template>
    <template v-if="successDialog">
      <success-dialog :showModal="successDialog" :amount="amount"
                      :underlyingSymbol="info.underlyingSymbol" :action="currentAction"
                      @close="actionSucceed"/>
    </template>
    <template v-if="errorDialog">
      <error-dialog :showModal="errorDialog" :action="currentAction"
                    @close="errorDialog = false"/>
    </template>
    <template v-if="txSummaryDialog">
      <tx-summary :showModal="txSummaryDialog" :action="currentAction"/>
    </template>
  </v-card>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import * as constants from '@/store/constants';
import {
  CToken,
  CRbtc,
  Market,
  Comptroller,
} from '@/middleware';
import ConnectWallet from '@/components/dialog/ConnectWallet.vue';
import SupplyRedeem from '@/components/dialog/SupplyRedeem.vue';
import Loading from '@/components/dialog/Loading.vue';
import BorrowRepay from '@/components/dialog/BorrowRepay.vue';
import TxSummary from '@/components/dialog/TxSummary.vue';
import SuccessDialog from '@/components/dialog/SuccessDialog.vue';
import ErrorDialog from '@/components/dialog/ErrorDialog.vue';

export default {
  name: 'GeneralInfo',
  data() {
    return {
      db: this.$firebase.firestore(),
      symbolImg: null,
      baseExplorerURL: 'https://explorer.testnet.rsk.co/address',
      info: {
        underlyingSymbol: null,
        cash: null,
        rate: null,
        totalBorrows: null,
        totalBalance: null,
        underlyingPrice: null,
        underlyingBalance: null,
        liquidity: null,
        interestBalance: null,
        supplyBalance: null,
        borrowBalance: null,
      },
      walletDialog: false,
      supplyBorrowDialog: false,
      waitingDialog: false,
      successDialog: false,
      errorDialog: false,
      txSummaryDialog: false,
      market: null,
      amount: null,
      comptroller: null,
      currentAction: null,
      allMarkets: [],
    };
  },
  props: {
    inBorrowMenu: {
      required: true,
      type: Boolean,
    },
    marketAddress: {
      required: true,
      type: String,
    },
  },
  computed: {
    ...mapState({
      walletAddress: (state) => state.Session.walletAddress,
      chainId: (state) => state.Session.chainId,
      account: (state) => state.Session.account,
      isDisabled() {
        return !this.isLoggedIn;
      },
    }),
    ...mapGetters({
      isLoggedIn: constants.SESSION_IS_CONNECTED,
    }),
    marketBalanceLabel() {
      return this.inBorrowMenu ? this.$t('market.borrow.subtitle1') : this.$t('market.deposits.subtitle1');
    },
    marketBalance() {
      return this.inBorrowMenu ? this.info.totalBorrows : this.info.cash;
    },
    marketBalanceInUSD() {
      return this.marketBalance * this.info.underlyingPrice;
    },
    supplyBorrowComponent() {
      return this.inBorrowMenu ? 'BorrowRepay' : 'SupplyRedeem';
    },
    buttonColor() {
      return this.inBorrowMenu ? '#FF9153' : '#4CB163';
    },
    buttonName() {
      return this.inBorrowMenu ? this.$t('market.borrow.button1') : this.$t('market.deposits.button1');
    },
    marketOnExplorer() {
      return `${this.baseExplorerURL}/${this.marketAddress}`;
    },
    rateLabel() {
      return this.inBorrowMenu ? this.$t('market.borrow.description1') : this.$t('market.deposits.description1');
    },
  },
  methods: {
    getSymbolImg() {
      this.db
        .collection('markets-symbols')
        .doc(this.info.underlyingSymbol)
        .get()
        .then((response) => {
          this.symbolImg = response.data().imageURL;
        })
        .catch(console.error);
    },
    supplyOrBorrow() {
      if (this.isLoggedIn) {
        this.supplyBorrowDialog = true;
      } else {
        this.walletDialog = true;
      }
    },
    reset() {
      this.walletDialog = false;
      this.supplyBorrowDialog = false;
      this.waitingDialog = false;
      this.successDialog = false;
      this.errorDialog = false;
      this.txSummaryDialog = false;
    },
    showWaiting() {
      this.reset();
      this.waitingDialog = true;
    },
    showError() {
      this.reset();
      this.errorDialog = true;
    },
    showSuccess() {
      this.reset();
      this.successDialog = true;
    },
    async menuAction({ amountIntended, action }) {
      this.amount = amountIntended;
      this.currentAction = action;
      this.reset();
      const assetsIn = await this.comptroller.getAssetsIn(this.walletAddress);
      switch (action) {
        case constants.USER_ACTION_MINT:
          this.allMarkets = await this.comptroller.allMarkets;
          if (assetsIn.indexOf(this.marketAddress) === -1) {
            await this.comptroller.enterMarkets(this.account, this.allMarkets);
          }
          // this.txSummaryDialog = true; // TODO
          this.showWaiting();
          await this.market.supply(this.account, this.amount)
            .then(() => {
              this.market.wsInstance.on('Mint', (from) => {
                if (from === this.walletAddress) {
                  this.showSuccess();
                  this.updateMarketInfo();
                }
              });
            })
            .catch(this.showError);
          break;
        case constants.USER_ACTION_BORROW:
          // this.txSummaryDialog = true; // TODO
          this.showWaiting();
          await this.market.borrow(this.account, this.amount)
            .then(() => {
              this.market.wsInstance.on('Borrow', (from) => {
                if (from === this.walletAddress) {
                  this.showSuccess();
                  this.updateMarketInfo();
                }
              });
            })
            .catch(this.showError);
          break;
        case constants.USER_ACTION_REDEEM:
          // this.txSummaryDialog = true; // TODO
          this.showWaiting();
          this.market.redeem(this.account, this.amount)
            .then(() => {
              this.market.wsInstance.on('Redeem', (from) => {
                if (from === this.walletAddress) {
                  this.showSuccess();
                  this.updateMarketInfo();
                }
              });
            })
            .catch(this.showError);
          break;
        case constants.USER_ACTION_REPAY:
          this.showWaiting();
          this.market.repay(this.account, this.amount)
            .then(() => {
              this.market.wsInstance.on('RepayBorrow', (from) => {
                if (from === this.walletAddress) {
                  this.showSuccess();
                  this.updateMarketInfo();
                }
              });
            })
            .catch((e) => {
              console.log(e);
              this.showError();
            });
          break;
        default:
          break;
      }
      this.market.wsInstance.on('Failure', (from, to, amount, event) => {
        console.info(`Failure from ${from} Event: ${JSON.stringify(event)}`);
        const { error, detail, info } = event.args;
        console.log(`Error: ${error}, detail: ${detail}, info: ${info}`);
        if (this.walletAddress === from) {
          this.showError();
        }
      });
    },
    actionSucceed() {
      this.successDialog = false;
      this.$emit('success');
    },
    async updateMarketInfo() {
      this.info.underlyingSymbol = await this.market.underlyingAssetSymbol();
      this.info.cash = await this.market.getCash();
      this.info.rate = this.inBorrowMenu
        ? await this.market.borrowRateAPY()
        : await this.market.supplyRateAPY();
      this.info.rate = this.info.rate.toFixed(3);
      this.info.totalBorrows = await this.market.totalBorrowsInUnderlying();
      this.getSymbolImg();
      if (this.chainId) {
        this.info.underlyingPrice = await this.market.underlyingCurrentPrice(this.chainId);
      }
      if (this.walletAddress) {
        this.info.underlyingBalance = await this.market
          .balanceOfUnderlyingInWallet(this.account);
        this.info.interestBalance = this.inBorrowMenu
          ? await this.market.getDebtInterest(this.walletAddress)
          : await this.market.getEarnings(this.walletAddress);
        this.info.liquidity = await this.comptroller.getAccountLiquidity(this.walletAddress);
        this.info.supplyBalance = await this.market
          .currentBalanceOfCTokenInUnderlying(this.walletAddress);
        this.info.borrowBalance = await this.market
          .borrowBalanceCurrent(this.walletAddress);
        this.info.interestBalance = this.inBorrowMenu
          ? await this.market.getDebtInterest(this.walletAddress)
          : await this.market.getEarnings(this.walletAddress);
        this.info.totalBalance = this.inBorrowMenu
          ? this.info.borrowBalance
          : await this.market.currentBalanceOfCTokenInUnderlying(this.walletAddress);
      }
    },
    isCRbtc() {
      return Market.isCRbtc(this.marketAddress);
    },
  },
  components: {
    ConnectWallet,
    SupplyRedeem,
    BorrowRepay,
    Loading,
    TxSummary,
    SuccessDialog,
    ErrorDialog,
  },
  created() {
    this.comptroller = new Comptroller(this.chainId);
    this.isCRbtc()
      .then((isCRbtc) => {
        this.market = isCRbtc ? new CRbtc(this.marketAddress, this.chainId)
          : new CToken(this.marketAddress, this.chainId);
        this.updateMarketInfo();
      })
      .catch(console.error);
  },
};
</script>
