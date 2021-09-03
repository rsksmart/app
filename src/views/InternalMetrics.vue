<template>
  <div class="metrics">
    <v-btn @click="saveMetrics">
      Save metrics
    </v-btn>
    <div class="container d-flex align-center flex-column">
      <div class="h2-heading text-left align-self-start text-detail">
        {{ $t('internal-metrics.title') }}
      </div>
      <v-card color="#E1F0E8" width="700" class="container">
        <metrics-dropdown @saveSelected="setSelected"
                          :defaultSelection="selected" class="align-self-start"/>
        <metrics-history-graph :selected="selected"/>
      </v-card>
      <v-card class="my-8 container" color="#E1F0E8" width="700">
        <v-row class="ma-0 pl-3 h3-sections-heading text-detail">
          {{ todayAsString }}
        </v-row>
        <v-row class="ma-0 ml-3 mt-3">
            <v-col cols="3" class="pa-0">
              <v-row class="ma-0 p1-descriptions">
                {{ $t('internal-metrics.number-addresses') }}
              </v-row>
              <v-row class="ma-0 p2-reading-values">
                {{ totalUsers }}
              </v-row>
            </v-col>
            <v-col cols="3" class="pa-0">
              <v-row class="ma-0 p1-descriptions">
                {{ $t('internal-metrics.number-new-addresses') }}
              </v-row>
              <v-row cols="3" class="ma-0 p2-reading-values">
                {{ totalNewUsers }}
              </v-row>
            </v-col>
            <v-col cols="3" class="pa-0">
              <v-row class="ma-0 p1-descriptions">
                {{ $t('internal-metrics.number-retire-addresses') }}
              </v-row>
              <v-row class="ma-0 p2-reading-values">
                {{ totalRetiredUsers }}
              </v-row>
            </v-col>
            <v-col cols="3" class="pa-0">
              <v-row class="ma-0 p1-descriptions">
                {{ $t('internal-metrics.number-active-addresses') }}
              </v-row>
              <v-row class="ma-0 p2-reading-values">
                {{ totalActiveUsers }}
              </v-row>
            </v-col>
        </v-row>
      </v-card>
      <v-card color="#E1F0E8" width="700" class="container mb-8">
        <v-row class="ma-0">
          <v-col>
            <v-row class="ma-0">
              <v-col cols="auto" class="pa-0 mr-3 d-flex align-center">
                <v-img width="30" height="30" :src="microMarketData.img"/>
              </v-col>
              <v-col class="pa-0">
                <v-row class="ma-0">
                  {{ microMarketData.name }}
                </v-row>
                <v-row class="ma-0">
                  {{ microMarketData.symbol }}
                </v-row>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="5">
            <v-row class="ma-0 p1-descriptions">
              {{ $t('internal-metrics.total-subsidy') }}
            </v-row>
            <v-row class="ma-0">
              <v-tooltip top color="#52826E">
                <template v-slot:activator="{ on, attrs }">
                  <span class="p2-reading-values" v-bind="attrs" v-on="on">
                    {{ subsidy | formatDecimals(constants.RBTC_SYMBOL) }} BTC
                  </span>
                </template>
                <span>{{ subsidy }}</span>
              </v-tooltip>
            </v-row>
            <v-row class="ma-0 p3-USD-values">
              {{ subsidy_usd | formatPrice }} USD
            </v-row>
          </v-col>
        </v-row>
      </v-card>
      <v-card color="#E1F0E8" width="700" class="container">
        <div class="container">
          <v-row class="ma-0">
            <v-col>
              <span class="p1-descriptions">
               {{ $t('internal-metrics.market') }}
              </span>
            </v-col>
            <v-col cols="5">
              <span class="p1-descriptions">
              {{ $t('internal-metrics.total-reserves') }}
              </span>
            </v-col>
          </v-row>
          <v-divider/>
          <div v-for="market in getMarkets" :key="market.kTokenSymbol">
            <v-row class="ma-0">
              <v-col>
                <v-row class="ma-0">
                  <v-col cols="auto" class="pa-0 mr-3 d-flex align-center">
                    <v-img width="30" height="30" :src="market.img"/>
                  </v-col>
                  <v-col class="pa-0">
                    <v-row class="ma-0">
                      {{ market.name }}
                    </v-row>
                    <v-row class="ma-0">
                      {{ market.symbol }}
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="5">
                <v-tooltip top color="#52826E">
                  <template v-slot:activator="{ on, attrs }">
                    <div class="p2-reading-values" v-bind="attrs" v-on="on">
                      {{ market.reserves | formatDecimals(market.symbol) }}
                      <span class="">{{ market.symbol }}</span>
                    </div>
                  </template>
                  <span>{{ market.reserves }}</span>
                </v-tooltip>
                <div class="p3-USD-values">
                  {{ market.reserve_usd | formatPrice }} USD
                </div>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import * as constants from '@/store/constants';
import { Comptroller, Firestore } from '@/middleware';
import MetricsDropdown from '@/components/metrics/Dropdown.vue';
import MetricsHistoryGraph from '../components/metrics/MetricsHistoryGraph.vue';

export default {
  name: 'InternalMetrics',
  data() {
    return {
      constants,
      db: this.$firebase.firestore(),
      comptroller: null,
      symbol: null,
      reserves: null,
      subsidy_usd: 0,
      subsidy: 0,
      totalUsers: null,
      totalNewUsers: null,
      totalRetiredUsers: '##',
      totalActiveUsers: null,
      activeUsers: [],
      uniqueUsers: [],
      last24HUsers: [],
      selected: {
        collection: 'active-users',
        title: this.$t('internal-metrics.dropdown')[0].title,
        index: 0,
      },
      today: new Date(),
      symbolImg: '',
      getMarkets: [],
      firestore: new Firestore(),
      microMarketData: {},
    };
  },
  computed: {
    ...mapState({
      markets: (state) => state.Session.markets,
      chainId: (state) => state.Session.chainId,
    }),
    todayAsString() {
      const months = this.$t('internal-metrics.months');
      if (this.$i18n.locale === 'es') return `${this.today.getDay()} de ${months['7']}`;
      return `${months['7']} ${this.today.getDay()}`;
    },
  },
  watch: {
    markets() {
      if (this.markets.length > 3) this.getMarketsInfo();
    },
  },
  methods: {
    async saveMetrics() {
      await this.firestore.saveMetrics(this.chainId);
    },
    setSelected(data) {
      this.selected = data;
    },
    async getMarketsInfo() {
      await this.markets.map(async (market) => {
        try {
          const data = {};
          data.kTokenSymbol = await market.symbol;
          data.symbol = await market.underlyingAssetSymbol();
          data.reserve_usd = await market.reservesInUSD(this.chainId);
          data.name = await market.underlyingAssetName();
          data.price = await market.underlyingCurrentPrice(this.chainId);
          data.reserves = await market.getReserves();
          data.img = await this.db
            .collection('markets-symbols')
            .doc(data.symbol)
            .get()
            .then((response) => response.data().imageURL);

          if (constants.CSAT_SYMBOL === data.kTokenSymbol) {
            const subsidy = await market.getSubsidyFound();
            this.subsidy = subsidy;
            this.subsidy_usd = data.price * subsidy;
            data.name += ' microsaving';
            this.microMarketData = {
              name: data.name,
              symbol: data.symbol,
              img: data.img,
            };
          }

          this.getMarkets.push(data);
        } catch (error) {
          console.error(error);
        }
      });
      this.uniqueUsers = await this.comptroller.getRegisteredAddresses();
      this.totalUsers = this.uniqueUsers.length;
      this.last24HUsers = await this.firestore.getTodayNewDataForEvent('MarketEntered', this.comptroller.comptrollerAddress, new Date());
      this.totalNewUsers = this.last24HUsers.length;
      this.activeUsers = await this.firestore.getActiveUsers(this.comptroller.comptrollerAddress);
      this.totalActiveUsers = this.activeUsers.length;
    },
  },
  components: {
    MetricsDropdown,
    MetricsHistoryGraph,
  },
  created() {
    this.comptroller = new Comptroller(this.chainId);
  },
};
</script>
