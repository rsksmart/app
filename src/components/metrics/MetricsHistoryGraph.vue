<template>
  <div>
    <v-row class="d-flex justify-end mr-1">
      <div class="toggle-tb d-flex align-center b2-secondary">
        <v-btn text :class="[period === constants.PERIOD_WEEK ? 'selected' : 'notSelected']"
               @click="getChartData(constants.PERIOD_WEEK)">
          1W
        </v-btn>
        <v-btn text :class="[period === constants.PERIOD_TWO_WEEKS ? 'selected' : 'notSelected']"
               @click="getChartData(constants.PERIOD_TWO_WEEKS)">
          2W
        </v-btn>
        <v-btn text :class="[period === constants.PERIOD_MONTH ? 'selected' : 'notSelected']"
               @click="getChartData(constants.PERIOD_MONTH)">
          1M
        </v-btn>
        <v-btn text :class="[period === constants.PERIOD_YEAR ? 'selected' : 'notSelected']"
               @click="getChartData(constants.PERIOD_YEAR)">
          1Y
        </v-btn>
      </div>
    </v-row>
    <v-row class="ma-0">
      <GChart type="ColumnChart" rx="5" ry="5"
              :data="chartData" :options="chartOptions"/>
    </v-row>
  </div>
</template>

<script>
import * as constants from '@/store/constants';
import { Firestore, Comptroller } from '@/middleware';
import { mapState } from 'vuex';

export default {
  name: 'MetricsHistoryGraph',
  data() {
    return {
      constants,
      firestore: new Firestore(),
      metricData: null,
      comptroller: null,
      period: constants.PERIOD_WEEK,
      chartData: [
        ['date', 'active users', { role: 'style' }],
      ],
      chartOptions: {
        width: 420,
        tooltip: { isHTML: true },
        backgroundColor: 'transparent',
        bar: { groupWidth: '30%' },
        legend: {
          position: 'none',
        },
      },
    };
  },
  props: {
    selected: {
      required: true,
      type: Object,
    },
  },
  computed: {
    ...mapState({
      chainId: (state) => state.Session.chainId,
    }),
  },
  watch: {
    selected() {
      this.getChartData(this.period);
    },
  },
  methods: {
    async getChartData(period) {
      this.period = period;
      this.metricData = await this.firestore
        .getMetricsData(this.comptroller.comptrollerAddress, this.selected.collection);
      this.fixMetricsData();
    },
    fixMetricsData() {
      const chartData = [
        ['date', `${this.selected.title}`, { role: 'style' }],
      ];
      if (this.metricData) {
        this.metricData.forEach(({ number, timestamp }) => {
          const now = new Date();
          let maxDays = 0;
          const date = new Date(timestamp.seconds * 1000);
          switch (this.period) {
            case constants.PERIOD_WEEK:
              maxDays = 7;
              now.setDate(now.getDate() - maxDays);
              break;
            case constants.PERIOD_TWO_WEEKS:
              maxDays = 14;
              now.setDate(now.getDate() - maxDays);
              break;
            case constants.PERIOD_MONTH:
              maxDays = 30;
              now.setDate(now.getDate() - maxDays);
              break;
            case constants.PERIOD_YEAR:
              maxDays = 365;
              now.setDate(now.getDate() - maxDays);
              break;
            default:
              break;
          }
          const timeDiff = date.getTime() - now.getTime();
          const daysDiff = timeDiff / (1000 * 3600 * 24);
          if (daysDiff > 0 && daysDiff < maxDays) {
            chartData.push([date, number, '#7DCCB6']);
          }
        });
      }
      this.chartData = chartData;
    },
  },
  created() {
    this.comptroller = new Comptroller(this.chainId);
    this.getChartData(this.period);
  },
};
</script>
