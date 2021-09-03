import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import VueGoogleCharts from 'vue-google-charts';

import FeedbackBubbleIcon from '@/components/icons/FeedbackBubbeIcon.vue';
import TelegramIcon from '@/components/icons/TelegramIcon.vue';

Vue.use(VueGoogleCharts);
Vue.use(Vuetify);

const theme = {
  primary: '#47B25F',
  secondary: '#E6F1EB',
  third: '#053126',
  warning: '#FCDE73',
  primary_bg: '#CFE7DA',
  secondary_bg: '#8AE39E',
  text_detail: '#196635',
  btn_wallet: '#E1F0E8',
  text_value: '#042F24',
  text_bg: '#63A47B',
};

export default new Vuetify({
  theme: {
    themes: {
      light: theme,
    },
  },
  icons: {
    values: {
      feedbackBubble: {
        component: FeedbackBubbleIcon,
      },
      telegram: {
        component: TelegramIcon,
      },
    },
  },
});
