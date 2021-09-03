<template>
    <div class="risk">
      <div class="d-flex justify-center">
        <img class="risk-img" :src="riskImage" />
        <v-progress-circular class="risk-graph" :size="125" :width="12"
          :value="riskRate" :color="chartColor" :rotate="270" />
      </div>
      <template v-if="!inBalance">
        <div class="mt-5">
          <h3 class="p6-reading-values text-info text-uppercase">{{ riskTitle }}</h3>
          <p class="p1-descriptions ma-0">{{ riskDescription }}</p>
        </div>
      </template>
    </div>
</template>

<script>
import HappyFace from '@/assets/health/face-happy.png';
import SeriousFace from '@/assets/health/face-serious.png';
import SurpisedFace from '@/assets/health/face-surprised.png';
// import SadFace from '@/assets/health/face-sad.png';

export default {
  watch: {
  },
  name: 'RiskChart',
  data() {
    return {
      riskChart: {
        title: {
          borrow: {
            noRisk: this.$t('market.risk.titles.no-risk'),
            lowRisk: this.$t('market.risk.titles.low-risk'),
            mediumRisk: this.$t('market.risk.titles.medium-risk'),
            highRisk: this.$t('market.risk.titles.high-risk'),
            other: this.$t('market.risk.titles.other'),
          },
          balance: {
            noRisk: this.$t('market.risk.titles.no-risk'),
            lowRisk: this.$t('market.risk.titles.low-risk'),
            mediumRisk: this.$t('market.risk.titles.medium-risk'),
            highRisk: this.$t('market.risk.titles.high-risk'),
            other: this.$t('market.risk.titles.other'),
          },
        },
        subtitle: {
          borrow: {
            noRisk: this.$t('market.risk.subtitles.no-risk'),
            lowRisk: this.$t('market.risk.subtitles.low-risk'),
            mediumRisk: this.$t('market.risk.subtitles.medium-risk'),
            highRisk: this.$t('market.risk.subtitles.high-risk'),
            other: this.$t('market.risk.subtitles.other'),
          },
          balance: {
            noRisk: this.$t('market.risk.subtitles.no-risk'),
            lowRisk: this.$t('market.risk.subtitles.low-risk'),
            mediumRisk: this.$t('market.risk.subtitles.medium-risk'),
            highRisk: this.$t('market.risk.subtitles.high-risk'),
            other: this.$t('market.risk.subtitles.other'),
          },
        },
      },
    };
  },
  props: {
    riskRate: {
      type: Number,
      required: true,
    },
    typeChart: {
      type: String,
      required: true,
    },
    inBalance: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    riskImage() {
      // if (this.riskRate === 100) return SadFace;
      if (this.riskRate > 0 && this.riskRate < 40) return HappyFace;
      if (this.riskRate >= 40 && this.riskRate <= 60) return SeriousFace;
      if (this.riskRate > 60 && this.riskRate <= 100) return SurpisedFace;
      if (this.riskRate === 0) return HappyFace;
      return HappyFace;
    },
    riskTitle() {
      if (this.riskRate === 0) return this.riskChart.title[this.typeChart].noRisk;
      if (this.riskRate > 60 && this.riskRate <= 100) {
        return this.riskChart.title[this.typeChart].highRisk;
      }
      if (this.riskRate > 40 && this.riskRate <= 60) {
        return this.riskChart.title[this.typeChart].mediumRisk;
      }
      if (this.riskRate > 0 && this.riskRate <= 40) {
        return this.riskChart.title[this.typeChart].lowRisk;
      }
      return this.riskChart.title[this.typeChart].other;
    },
    riskDescription() {
      if (this.riskRate > 60 && this.riskRate <= 100) {
        return this.riskChart.subtitle[this.typeChart].highRisk;
      }
      if (this.riskRate > 40 && this.riskRate <= 60) {
        return this.riskChart.subtitle[this.typeChart].mediumRisk;
      }
      if (this.riskRate >= 0 && this.riskRate <= 40) {
        return this.riskChart.subtitle[this.typeChart].lowRisk;
      }
      return this.riskChart.subtitle[this.typeChart].other;
    },
    chartColor() {
      if (this.riskRate === 0) return 'transparent';
      if (this.riskRate > 0 && this.riskRate < 40) return '#317440';
      if (this.riskRate >= 40 && this.riskRate <= 60) return '#BCBE34';
      if (this.riskRate > 60 && this.riskRate < 100) return '#F7C61A';
      if (this.riskRate === 100) return '#EEAF0E';
      return 'transparent';
    },
  },
};
</script>
