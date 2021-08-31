<template>
  <div class="d-flex flex-column align-center">
    <h2 class="h2-heading mb-7 text-primary">
      {{ $t('swaps.title') }}
    </h2>
    <p class="p1-descriptions text-info text-description">
      {{ $t('swaps.description') }}
    </p>
    <swap-panel> </swap-panel>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import {
  SovrynSwap,
} from '@/middleware';
import { addresses } from '@/middleware/contracts/constants';
import SwapPanel from '@/components/tradeSwaps/SwapPanel.vue';

export default {
  name: 'TradeSwaps',
  components: {
    SwapPanel,
  },
  data() {
    return {
      sovrynSwap: null,
      emptyDialog: false,
      changeBtc: false,
      loading: false,
      data: [],
      name: 'Hola',
    };
  },
  computed: {
    ...mapState({
      chainId: (state) => state.Session.chainId,
    }),
  },
  methods: {
    async openEmpty() {
      const conversionPath = await this.sovrynSwap.getConversionPath(addresses[this.chainId].DOC,
        addresses[this.chainId].wRBTC);
      console.log(conversionPath);
      const targetAmount = Number(await this.sovrynSwap.getExpextedSwapAmount(conversionPath, '0.5')) / 1e18;
      console.log(targetAmount);
    },
  },
  created() {
    this.sovrynSwap = new SovrynSwap(this.chainId);
  },
};
</script>
