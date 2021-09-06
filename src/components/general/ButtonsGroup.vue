<template>
  <v-container class="pa-0">
    <v-row class="pa-0 ma-0">
      <template v-for="(button, index) in buttons">
        <v-col :cols="colSize" :key="index" class="px-1">
          <v-btn
            :color="selected === index ? 'primary' : '#ABD1B4'"
            block
            rounded
            small
            :outlined="selected !== index"
            @click="select(index)"
            class="buttons-group elevation-0"
          >
            {{ button }}
          </v-btn>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'ButtonsGroup',

  props: {
    buttons: {
      type: Array,
      require: true,
    },
  },

  data() {
    return {
      selected: -1,
    };
  },

  computed: {
    colSize() {
      return parseInt(12 / this.buttons.length, 10);
    },
  },

  methods: {
    select(index) {
      this.selected = index;
      this.$emit('input', this.buttons[index]);
    },
  },
};
</script>
