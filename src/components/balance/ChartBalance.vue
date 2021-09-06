<template>
  <div class="balance-cripto balance-style">
    <div class="chart d-flex justify-center">
      <img class="risk-img" src="@/assets/icons/dollar2.svg" />
      <GChart class="cripto-chart" type="PieChart" style="width: 108px; height: 108px;"
        :data="chartData" :options="chartOptions"/>
    </div>
    <div class="criptos">
      <div class="p6-reading-values">
        {{$t('balance.criptos.title')}}
      </div>
      <div class="criptos-detail d-flex justify-space-between">
        <div class="cripto-deposit">
          <div class="p1-descriptions mb-2">{{$t('balance.criptos.description1')}}</div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#095223" />
            <div class="p7-graphics ml-2">
              Micro-RBTC
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#47B25F" />
            <div class="p7-graphics ml-2">
              RBTC
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#8AE39E" />
            <div class="p7-graphics ml-2">
              USDT
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#429A62" />
            <div class="p7-graphics ml-2">
              DOC
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#79BF89" />
            <div class="p7-graphics ml-2">
              RIF
            </div>
          </div>
        </div>
        <div class="cripto-debts">
          <div class="p1-descriptions mb-2">{{$t('balance.criptos.description2')}}</div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#EEAF0E" />
            <div class="p7-graphics ml-2">
              Micro-RBTC
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#F7C61A" />
            <div class="p7-graphics ml-2">
              RBTC
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#D5D77D" />
            <div class="p7-graphics ml-2">
              USDTC
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#BCBE34" />
            <div class="p7-graphics ml-2">
              DOC
            </div>
          </div>
          <div class="cripto-info d-flex mb-1">
            <v-progress-circular :size="7" :width="1.5"
              :value="100" color="#A5A711" />
            <div class="p7-graphics ml-2">
              RIF
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex';

export default {
  props: {
    chartInfo: {
      type: Array,
      require: true,
    },
    chartColor: {
      type: Array,
      require: true,
    },
  },
  data() {
    return {
      slices: [
        { color: '#095223' }, // micro-rbtc deposit
        { color: '#8AE39E' }, // usdt
        { color: '#47B25F' }, // rbtc
        { color: '#79BF89' }, // rif
        { color: '#429A62' }, // doc
        { color: '#EEAF0E' }, // micro-rbtc debts
        { color: '#D5D77D' }, // usdt
        { color: '#F7C61A' }, // rbtc
        { color: '#A5A711' }, // rif
        { color: '#BCBE34' }, // doc
      ],
      chartData: [
        ['', '', ''],
        ['empty', 100, ''],
      ],
      chartOptions: {
        pieHole: 0.79,
        chartArea: {
          width: '100%',
          height: '93%',
        },
        backgroundColor: 'transparent',
        pieSliceBorderColor: 'transparent',
        pieSliceText: 'none',
        slices: [
          { color: '#ABD1B4' },
        ],
        legend: {
          position: 'none',
        },
      },
    };
  },
  watch: {
    chartInfo() {
      this.chartData = [['', '', ''], ...this.chartInfo];
      this.chartOptions.slices = this.chartColor;
      // this.chartData = this.chartInfo;
    },
  },
  computed: {
    ...mapState({
      walletAddress: (state) => state.Session.walletAddress,
    }),
  },
};
</script>
