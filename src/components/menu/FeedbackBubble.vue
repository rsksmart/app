<template>
  <v-container class="feedback-bubble pa-0">
    <span class="feedback-button-container">
      <v-btn
        color="primary"
        fab
        @click="showDialog = true"
        class="elevation-0"
      >
        <v-icon large color="white">$vuetify.icons.values.feedbackBubble</v-icon>
      </v-btn>
    </span>

    <v-dialog v-model="showDialog" :width="dialogSizing">
      <span class="feedback-dialog">
        <v-card class="content-card pt-12">
          <v-icon class="btn-close-dialog" @click="reset()">mdi-close</v-icon>

          <v-container v-if="state === states['chooseAChannel']" class="px-10">
            <div class="primary-title text-center mb-5">
              ¿Necesitas ayuda?
            </div>
            <div class="primary-paragraph mb-10">
              Puedes pedir ayuda en nuestra comunidad de Telegram, o enviar un mensaje directo
              al equipo Tropykus.
            </div>
            <a href="https://t.me/joinchat/3Wn-b0_cNFs5OWYx" target="_blank" class="text-decoration-none">
              <div class="choose-option-button d-flex align-center elevation-3 mb-4">
                <v-icon color="primary" class="mr-3">$vuetify.icons.values.telegram</v-icon>
                Ir a Telegram
              </div>
            </a>
            <div
              @click="setState(states.sendAComment)"
              class="choose-option-button d-flex align-center elevation-3 mb-12"
            >
              <v-icon color="primary" class="mr-3">$vuetify.icons.values.feedbackBubble</v-icon>
              Enviar comentario
            </div>
          </v-container>

          <v-container v-else-if="state === states['sendAComment']" class="px-13 pb-6">
            <div class="secondary-title text-center mb-3">
              Envíanos tus comentarios
            </div>
            <div class="secondary-paragraph mb-2">
              *Obligatorio
            </div>
            <div class="primary-paragraph mb-1">
              Escribe tu email o usuario de telegram para poderte contactar*
            </div>
            <textarea
              v-model="email"
              placeholder="Escribe email o telegram"
              class="custom-textarea email-textarea mb-8"
            ></textarea>
            <div class="primary-paragraph mb-1">
              Selecciona la billetera que usaste
            </div>
            <buttons-group v-model="wallet" :buttons="wallets" class="buttons-group mb-4" />
            <div class="primary-paragraph mb-1">
              Elige la sección donde tuviste problemas
            </div>
            <buttons-group v-model="section" :buttons="sections" class="buttons-group mb-4" />
            <div class="primary-paragraph mb-1">
              Escribe el problema que estás teniendo*
            </div>
            <textarea
              v-model="problem"
              placeholder="Escribe tu mensaje"
              class="custom-textarea problem-textarea mb-6"
            ></textarea>
            <v-btn
              :color="sendButtonEnable ? 'primary' : 'secondary_bg'"
              block
              rounded
              class="white--text elevation-0"
              @click="sendFeedback()"
            >
              Enviar
            </v-btn>
          </v-container>
        </v-card>
      </span>
    </v-dialog>
  </v-container>
</template>

<script>
import ButtonsGroup from '@/components/general/ButtonsGroup.vue';

import * as constants from '@/store/constants';

export default {
  name: 'FeedbackBubble',

  components: {
    ButtonsGroup,
  },

  data() {
    return {
      showDialog: false,
      state: 0,
      states: {
        chooseAChannel: 0,
        sendAComment: 1,
      },
      wallets: [
        'Liquality',
        'Defiant',
        'Metamask',
        'Nifty',
      ],
      sections: [
        'Depósitos',
        'Préstamos',
        'Balance',
        'Intercambios',
      ],

      email: '',
      wallet: '',
      section: '',
      problem: '',
    };
  },

  computed: {
    dialogSizing() {
      switch (this.state) {
        case 0:
          return '380px';
        case 1:
          return '520px';
        default:
          return '380px';
      }
    },

    sendButtonEnable() {
      return this.email.length > 0 && this.problem.length > 0;
    },
  },

  methods: {
    reset() {
      this.showDialog = false;
      this.state = 0;

      this.email = '';
      this.wallet = '';
      this.section = '';
      this.problem = '';
    },

    setState(newState) {
      this.state = newState;
    },

    sendFeedback() {
      if (this.sendButtonEnable) {
        this.$store.dispatch(
          constants.USER_FEEDBACK,
          {
            email: this.email,
            wallet: this.wallet,
            section: this.section,
            problem: this.problem,
            isAnswered: false,
          },
        );
        this.reset();
      }
    },
  },
};
</script>
