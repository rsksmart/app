<template>
  <div>
    <template v-if="isLoading">
      <loading :showModal="isLoading" :data="dataLoading" @closed="closeDialog" />
    </template>
    <div class="content-notifications">
      <template v-for="(noti, i) in notifications">
        <notification :noti="noti" :key="i"/>
      </template>
    </div>
  </div>
</template>
<script>
import Loading from '@/components/modals/Loading.vue';
import Notification from '@/components/general/Notifications.vue';
import { mapActions, mapState } from 'vuex';
import * as constants from '@/store/constants';

export default {
  components: {
    Loading,
    Notification,
  },
  data() {
    return {
      isLoading: false,
      dataLoading: {},
      notify: [],
    };
  },
  watch: {
    dialogLoading() {
      this.isLoading = this.dialogLoading;
    },
    infoLoading() {
      this.dataLoading = this.infoLoading;
    },
    notifications() {
      this.notify = this.notifications;
    },
  },
  computed: {
    ...mapState({
      infoLoading: (state) => state.Users.infoLoading,
      dialogLoading: (state) => state.Users.dialogLoading,
      notifications: (state) => state.Users.notifications,
    }),
  },
  methods: {
    ...mapActions({
      setDialogLoading: constants.USER_ACTION_DIALOG,
    }),
    closeDialog() {
      this.setDialogLoading(false);
    },
  },
};
</script>
