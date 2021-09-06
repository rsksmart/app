<template>
  <div>
    <v-dialog v-model="dialog" persistent content-class="d-loading"
      overlay-opacity="0.6" overlay-color="#000">
      <v-card v-if="data.type === 'deposit'"
        class="dialog-loading ma-0 secondary-color d-flex align-center">
        <v-icon class="btn-close-dialog" @click="closeDialog">mdi-close</v-icon>
        <template v-if="data.firstTx">
          <div class="first-transaction text-center px-10">
            <div class="modal-title text-center mb-12">
              {{ $t('dialog.firstTransaction.title') }}
            </div>
            <img :src="require(`@/assets/dialog/sign-${$i18n.locale}.svg`)" class="mx-auto mb-13" />
            <div
              v-for="(transaction, index) in $t('dialog.firstTransaction.transactions')"
              :key="index"
              class="px-14 d-flex align-center justify-start mb-3"
            >
              <div class="transaction-index d-flex align-center justify-center mr-3">
                {{ index + 1 }}
              </div>
              <div class="transaction-description text-left">
                {{ transaction }}
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div v-if="data.loading" class="row ma-0 d-flex flex-column align-center">
            <v-progress-circular class="progress-loading"
              indeterminate color="#41A255" :width="6" :size="80"/>
            <div v-if="data.wallet" class="text-primary s1-pop-ups text-description mt-9">
              {{$t('dialog.loading.description1')}}
            </div>
            <div v-else class="text-primary s1-pop-ups text-description mt-9">
              {{$t('dialog.loading.description2')}}

            </div>
          </div>
          <div v-else class="row ma-0 d-flex flex-column align-center">
            <v-img width="150" height="150" src="@/assets/dialog/success.svg" alt=""/>
            <div class="text-primary s1-pop-ups text-deposit">
              {{ data.deposit
                ? $t('dialog.loading.description3')
                : $t('dialog.loading.description4')
              }} <br />
              {{data.amount | formatDecimals(data.symbol) }}
              <span class="">{{data.symbol}}</span>
            </div>
            <v-btn @click="closeDialog" class="btn btn-primary">
              <span class="b1-main white--text">
              {{$t('dialog.loading.btn')}}
              </span>
            </v-btn>
          </div>
        </template>
      </v-card>
      <v-card v-else-if="data.type === 'feedback'"
        class="dialog-loading ma-0 secondary-color d-flex align-center">
        <div v-if="data.loading" class="row ma-0 d-flex flex-column align-center">
          <v-progress-circular class="progress-loading"
            indeterminate color="#41A255" :width="6" :size="80"/>
          <div v-if="data.wallet" class="text-primary s1-pop-ups text-description mt-9">
            Enviando comentarios
          </div>
        </div>
        <div v-else class="row ma-0 d-flex flex-column align-center px-16 pt-9">
          <v-icon class="btn-close-dialog" @click="closeDialog">mdi-close</v-icon>
          <v-img width="100" height="100" src="@/assets/dialog/success.svg" alt=""/>
          <v-container class="feedback mt-10 px-7">
            <div class="feedback-title text-center mb-3">
              ¡Hemos recibido tu comentario!
            </div>
            <div class="feedback-paragraph mb-8">
              Pronto recibirás un mensaje en tu correo con la respuesta a tu comentario.
            </div>
            <v-btn color="primary" block rounded @click="closeDialog" class="elevation-0">
              Continuar
            </v-btn>
          </v-container>
        </div>
      </v-card>
      <v-card v-else class="dialog-loading ma-0 secondary-color d-flex align-center">
        <v-icon class="btn-close-dialog" @click="closeDialog">mdi-close</v-icon>
        <div v-if="data.loading" class="row ma-0 d-flex flex-column align-center">
          <v-progress-circular class="progress-loading"
            indeterminate color="#41A255" :width="6" :size="80"/>
          <div v-if="data.wallet" class="text-primary s1-pop-ups text-description mt-9">
            {{$t('dialog.loading.description1')}}
          </div>
          <div v-else class="text-primary s1-pop-ups text-description mt-9">
            {{$t('dialog.loading.description2')}}

          </div>
        </div>
        <div v-else class="row ma-0 d-flex flex-column align-center">
          <v-img width="150" height="150" src="@/assets/dialog/success.svg" alt=""/>
          <div class="text-primary s1-pop-ups text-deposit">
            {{ data.borrow
              ? $t('dialog.loading.description5')
              : $t('dialog.loading.description6')
            }} <br />
            {{data.amount | formatDecimals(data.symbol) }}
            <span class="">{{data.symbol}}</span>
          </div>
          <v-btn @click="closeDialog" class="btn btn-primary">
            <span class="b1-main white--text">
             {{$t('dialog.loading.btn')}}
            </span>
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>

export default {
  name: 'Loading',
  data() {
    return {
      dialog: this.showModal,
    };
  },
  props: {
    showModal: {
      type: Boolean,
    },
    data: {
      type: Object,
      require: true,
    },
  },
  watch: {
    showModal() {
      this.dialog = this.showModal;
    },
  },
  methods: {
    closeDialog() {
      this.$emit('closed');
    },
  },
};
</script>
