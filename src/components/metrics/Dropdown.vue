<template>
  <div class="primary-bg select-box" style="width: 268px;">
    <v-menu>
      <template v-slot:activator="{ on, attrs }">
        <div class="selected-item d-flex align-center"
             v-bind="attrs" v-on="on">
          <div class="ml-3 b2-secondary">
            {{ selectedTitle }}
          </div>
          <v-icon class="select-icon" large color="text-primary">
            mdi-chevron-down
          </v-icon>
        </div>
      </template>
      <v-list>
        <v-list-item
          v-for="{ title, collection, index } in $t('internal-metrics.dropdown')"
          :key="index" class="metrics-select-menu-item"
          :class="collection === select ? 'active' : ''"
          @click="setSelected({ title, collection, index })"
        >
          <div class="b2-secondary">
            {{ title }}
          </div>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'Dropdown',
  data() {
    return {
      select: this.defaultSelection,
    };
  },
  props: {
    defaultSelection: {
      required: true,
      type: Object,
    },
  },
  computed: {
    selectedTitle() {
      return this.select.title;
    },
  },
  methods: {
    setSelected(data) {
      this.select = data;
      this.$emit('saveSelected', data);
    },
  },
};
</script>
