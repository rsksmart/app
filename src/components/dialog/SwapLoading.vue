<template>
  <div>
    <v-dialog v-model="dialog" persistent content-class="d-swap"
      overlay-opacity="0.6" overlay-color="#000">
      <v-card v-if="!infoDialog.sign"
      class="dialog-swap ma-0 secondary-color d-flex align-center justify-center">
        <v-icon class="btn-close-dialog" @click="closeDialog">mdi-close</v-icon>
        <div class="content-swap p1-descriptions">

          <div class="mb-4">{{$t('swaps.dialog.description1')}}</div>
          <div>{{$t('swaps.dialog.description2')}}</div>
          <div class="d-flex justify-space-between">
            <div class="p6-reading-values mb-4">
              {{data.amount}} {{data.select.underlyingSymbol}}
            </div>
            <img class="img-change" :src="data.select.img" />
          </div>
          <img class="mb-5" src="@/assets/icons/arrowdown.svg" />
          <div>{{$t('swaps.dialog.description3')}}</div>
          <div class="d-flex justify-space-between">
            <div class="p6-reading-values">
              {{data.amountToReceive}} {{data.selectI.underlyingSymbol}}
            </div>
            <img class="img-change" :src="data.selectI.img" />
          </div>
          <hr class="mt-5 mb-3" />
          <div class="d-flex justify-start">
            <div class="mr-2">{{$t('swaps.description4')}}</div>
            <v-tooltip top
              content-class="secondary-color box-shadow-tooltip" max-width="180">
              <template v-slot:activator="{ on, attrs }">
                <img v-bind="attrs" v-on="on" src="@/assets/icons/info2.svg" />
              </template>
              <span class="p5-feedback text-info">
                {{ $t('swaps.tooltip1') }}
              </span>
            </v-tooltip>
          </div>
          <div class="p6-reading-values mb-6">
            1 {{data.select.underlyingSymbol}} =
            {{data.price}} {{data.selectI.underlyingSymbol}}</div>
          <div class="d-flex justify-start">
            <div class="mr-2">{{$t('swaps.description6')}}</div>
            <v-tooltip top
              content-class="secondary-color box-shadow-tooltip" max-width="180">
              <template v-slot:activator="{ on, attrs }">
                <img v-bind="attrs" v-on="on" src="@/assets/icons/info2.svg" />
              </template>
              <span class="p5-feedback text-info">
                {{ $t('swaps.tooltip1') }}
              </span>
            </v-tooltip>
          </div>
          <div class="p6-reading-values mb-6">
            {{data.minReturn}} {{data.selectI.underlyingSymbol}}
          </div>
          <v-btn class="btn btn-primary" @click="swapTokens">
            <span class="white--text b1-main">{{$t('swaps.dialog.btn')}}</span>
          </v-btn>
        </div>
      </v-card>
      <v-card v-else class="dialog-swap ma-0 secondary-color d-flex align-center justify-center">
        <v-icon class="btn-close-dialog" @click="closeDialog">mdi-close</v-icon>
        <div v-if="infoDialog.wallet" class="resumen">
          <div class="d-flex flex-column align-center">
            <v-progress-circular color="#41A255" :width="4" :size="52" indeterminate>
            </v-progress-circular>
            <div class="text-description mt-4">
              {{$t('swaps.dialog.description4')}}
            </div>
          </div>
          <hr class="mt-5 mb-4" />
          <div class="b2-secondary">{{$t('swaps.dialog.description5')}}</div>
          <div class="p1-descriptions mt-4">{{$t('swaps.dialog.description2')}}</div>
          <div class="p6-reading-values">
            {{data.amount}} {{data.select.underlyingSymbol}}
          </div>
          <div class="p1-descriptions mt-6">{{$t('swaps.dialog.description3')}}</div>
          <div class="p6-reading-values">
            {{data.amountToReceive}} {{data.selectI.underlyingSymbol}}
          </div>
          <div class="p1-descriptions mt-6">{{$t('swaps.description6')}}</div>
          <div class="p6-reading-values">
            {{data.minReturn}} {{data.selectI.underlyingSymbol}}
          </div>
        </div>
        <div class="d-flex flex-column align-center loading" v-if="infoDialog.loading">
          <v-progress-circular class="progress-loading"
            indeterminate color="#41A255" :width="6" :size="80"/>
          <div class="text-description mt-5">{{$t('swaps.dialog.description7')}}</div>
        </div>
        <div class="d-flex flex-column align-center" v-if="infoDialog.exchange">
          <v-img width="100" height="100" src="@/assets/dialog/success.svg"/>
          <div class="mt-6">{{$t('swaps.dialog.description6')}}</div>
          <div class="mb-5">
            {{data.amountToReceive}} {{data.selectI.underlyingSymbol}}
          </div>
          <v-btn class="btn btn-primary mt-2" @click="closeDialog">
            <span class="white--text b1-main">{{$t('swaps.dialog.btn1')}}</span>
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapState } from 'vuex';

export default {
  name: 'SwapLoading',
  data() {
    return {
      dialog: this.show,
      infoDialog: {},
    };
  },
  props: {
    show: {
      type: Boolean,
    },
    data: {
      type: Object,
      require: true,
    },
  },
  watch: {
    show() {
      this.dialog = this.show;
    },
    swapInfo() {
      this.infoDialog = this.swapInfo;
    },
  },
  computed: {
    ...mapState({
      swapInfo: (state) => state.Users.swapInfo,
    }),
  },
  methods: {
    closeDialog() {
      this.$emit('closeDialog');
    },
    swapTokens() {
      this.$emit('swapTokens');
    },
  },
};
</script>
