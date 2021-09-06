<template>
  <div class="balance-liquidity balance-style">
    <div class="d-flex">
      <div class="tooltip-info">
        <v-tooltip bottom
          content-class="secondary-color box-shadow-tooltip" max-width="180">
          <template v-slot:activator="{ on, attrs }">
            <v-img v-bind="attrs" v-on="on" src="@/assets/icons/info2.svg" contain/>
          </template>
          <span class="p5-feedback text-info">
            {{$t('balance.tooltip3')}}
          </span>
        </v-tooltip>
      </div>
      <img src="@/assets/icons/borrow2.svg" alt="Deposit">
      <div class="ml-5">
        <div class="p1-descriptions mb-2">
          {{$t('balance.liquidity.description1')}}
        </div>
        <div class="p2-reading-values mb-1">
          {{liquidity}} USD
        </div>
        <div class="p3-USD-values">
          {{!totalRbtc ? 0 : totalRbtc}} RBTC<br />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex';

export default {
  name: 'LiquidityBalance',
  props: {
    liquidityAmount: {
      type: Number,
      require: true,
    },
    priceRbtc: {
      type: Number,
      require: true,
    },
  },
  computed: {
    ...mapState({
      chainId: (state) => state.Session.chainId,
    }),
    liquidity() {
      return Number(this.liquidityAmount).toFixed(4);
    },
    totalRbtc() {
      return (Number(this.liquidity) / this.priceRbtc).toFixed(6);
    },
  },
};
</script>
