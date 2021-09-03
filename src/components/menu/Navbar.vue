<template>
  <v-app-bar color="transparent" flat height="70" absolute
             v-bind:class="{ 'tutorial-navbar': isTutorial }" class="navbar">
    <router-link :to="{ name: 'Supply' }">
      <v-img height="48" width="372" position="left center" src="@/assets/tropykus.svg" contain/>
    </router-link>
    <v-spacer/>
    <div v-for="market in markets" :key="market.symbol">
      <v-card width="160" color="transparent" flat>
        <v-row>
          <v-col class="pa-0 pr-2 d-flex align-center" cols="auto">
            <v-img alt="market icon" :src="market.img" height="48" width="48" contain/>
          </v-col>
          <v-col class="pa-0 pt-2">
            <v-row class="ma-0 d-flex justify-start">
              <p class="text-left font-weight-bold">{{ market.symbol }}</p>
            </v-row>
            <v-row class="ma-0 d-flex justify-start">
              <p class="text-left font-italic">$ {{ market.price }} USD</p>
            </v-row>
          </v-col>
        </v-row>
      </v-card>
    </div>
    <v-spacer/>
    <template v-if="isWalletConnected">
      <v-card flat :color="networkColor" class="mt-3">
        <v-row class="ma-0">
          <v-col cols="auto" class="pa-2">
            <v-img alt="market icon" src="@/assets/avatar.svg" height="48" width="48" contain/>
          </v-col>
          <v-col class="pa-0 pt-3">
            <v-row class="ma-0">
              <p class="text-left">{{ accountCutOff }}</p>
            </v-row>
            <v-row class="ma-0">
              <p class="text-left">{{ network }}</p>
            </v-row>
          </v-col>
          <v-col class="pa-2">
            <template v-if="chainId === 31">
              <v-btn @click="disconnectAccount" height="45" color="#FFF"
                     outlined width="200">
                {{ buttonLabel }}
              </v-btn>
            </template>
            <template v-else>
              <v-tooltip bottom color="#52826E">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn @click="disconnectAccount" height="45" color="#FFF"
                         outlined width="200" v-bind="attrs" v-on="on">
                    Red incorrecta
                  </v-btn>
                </template>
                <span>
                Asegurate de tener tu billetera<br>conectada a la red RSK.
              </span>
              </v-tooltip>
            </template>
          </v-col>
        </v-row>
      </v-card>
    </template>
    <template v-else>
      <v-btn @click="showDialogConnectWallet" class="wallet-button" width="200">
        {{ buttonLabel }}
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import { Market, CRbtc, CToken } from '@/middleware';
import * as constants from '@/store/constants';
import RLogin from '@rsksmart/rlogin';

import WalletConnectProvider from '@walletconnect/web3-provider';
import Portis from '@portis/web3';

export default {
  name: 'Navbar',
  data() {
    return {
      db: this.$firebase.firestore(),
      showModalConnectWallet: false,
      markets: [],
      rLogin: new RLogin({
        cacheProvider: false,
        providerOptions: {
          walletconnect: {
            package: WalletConnectProvider,
            options: {
              rpc: {
                30: 'https://public-node.rsk.co',
                31: 'https://public-node.testnet.rsk.co',
              },
            },
          },
          portis: {
            package: Portis,
            options: {
              id: '34616571-d57b-4805-868b-2dcc7b7662d7',
              network: {
                nodeUrl: 'https://public-node.testnet.rsk.co',
                chainId: 31,
              },
            },
          },
        },
        supportedChains: [30, 31],
      }),
    };
  },
  props: {
    marketAddresses: {
      type: Array,
      required: true,
    },

  },
  computed: {
    ...mapState({
      walletAddress: (state) => state.Session.walletAddress,
      wallet: (state) => state.Session.wallet,
      routePath: (state) => state.route.path,
      chainId: (state) => state.Session.chainId,
    }),
    buttonLabel() {
      if (this.chainId === 31 && typeof this
        .walletAddress === 'string') return this.$t('menu.navbar.disconnect');
      if (typeof this.walletAddress !== 'string') return this.$t('menu.navbar.connect');
      return '';
    },
    accountCutOff() {
      return `${this.walletAddress.substr(0, 6)}..${this.walletAddress.substr(-2)}`;
    },
    network() {
      if (this.chainId === 31) return 'Testnet';
      if (this.chainId === 30) return 'Mainnet';
      return '';
    },
    networkColor() {
      return this.chainId === 31 ? '#074335' : '#E55E3C';
    },
    isWalletConnected() {
      return !!this.walletAddress;
    },
    isTutorial() {
      return this.routePath.substr(1, 10) === 'tutorials/';
    },
  },
  methods: {
    ...mapActions({
      disconnectWallet: constants.SESSION_DISCONNECT_WALLET,
      connectToWeb3: constants.SESSION_CONNECT_WEB3,
    }),

    outsideConnectWallet() {
      this.showModalConnectWallet = false;
    },

    showDialogConnectWallet() {
      this.rLogin
        .connect() // shows rLogin modal
        .then(({ provider }) => this.connectToWeb3(provider));
    },
    disconnectAccount() {
      this.disconnectWallet();
    },
    async loadMarketInfo(marketAddress) {
      await Market.isCRbtc(marketAddress)
        .then((isCRbtc) => (isCRbtc ? new CRbtc(marketAddress, this.chainId)
          : new CToken(marketAddress, this.chainId)))
        .then(async (market) => {
          const symbol = await market.underlyingAssetSymbol();
          const price = await market.underlyingCurrentPrice(this.chainId);
          const data = {
            symbol,
            price: symbol === constants.RBTC_SYMBOL ? Math.round(price).toLocaleString('es') : price
              .toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            img: await this.db
              .collection('markets-symbols')
              .doc(symbol)
              .get()
              .then((response) => response.data().imageURL),
          };
          this.markets.push(data);
        });
    },
  },
  watch: {
    marketAddresses() {
      this.marketAddresses.forEach(async (marketAddress) => {
        await this.loadMarketInfo(marketAddress);
      });
    },
  },
  components: {
  },
};
</script>
