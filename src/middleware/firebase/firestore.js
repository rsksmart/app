import Vue from 'vue';
import {
  Comptroller,
  CRbtc,
  CToken,
  Market,
} from '../index';

export default class Firebase {
  constructor() {
    this.db = Vue.firebase.firestore();
  }

  async saveUserAction(
    comptrollerAddress, userAddress, event, amount, market,
    marketAddress, priceAt, timestamp, txHash,
  ) {
    const data = {
      event, amount, market, marketAddress, priceAt, timestamp, txHash, userAddress,
    };
    const comptroller = await this.db.collection('users-history').doc(comptrollerAddress).get();
    if (comptroller?.exists) {
      await this.db.collection('users-history').doc(comptrollerAddress).update({
        [`${userAddress}.activity.${timestamp}`]: data,
      });
    } else {
      await this.db.collection('users-history').doc(comptrollerAddress).set({
        [userAddress]: {
          activity: {
            [timestamp]: data,
          },
        },
      });
    }
  }

  async getUserActivity(comptrollerAddress, userAddress) {
    const activity = [];
    const comptroller = await this.db.collection('users-history').doc(comptrollerAddress).get();
    if (comptroller.exists) {
      const user = comptroller.data()[userAddress].activity;
      Object.keys(user).forEach((key) => {
        activity.push(user[key]);
      });
    }
    return activity;
  }

  async getActiveUsers(comptrollerAddress) {
    const now = new Date();
    const activeUsers = [];
    const comptroller = await this.db.collection('users-history').doc(comptrollerAddress).get();
    if (comptroller.exists) {
      const users = comptroller.data();
      Object.keys(users).forEach((userAddress) => {
        const usersWithActivity = comptroller.data()[userAddress].activity;
        Object.keys(usersWithActivity).forEach((timestamp) => {
          const date = new Date(timestamp);
          if (date.getFullYear() === now.getFullYear()
            && date.getMonth() === now.getMonth()
            && date.getDate() === now.getDate()) {
            if (activeUsers.indexOf(userAddress) === -1) activeUsers.push(userAddress);
          }
        });
      });
    }
    return activeUsers;
  }

  async getTodayNewDataForEvent(eventName, comptrollerAddress, now) {
    const news = [];
    const comptroller = await this.db.collection('users-history').doc(comptrollerAddress).get();
    if (comptroller.exists) {
      const users = comptroller.data();
      Object.keys(users).forEach((userAddress) => {
        const usersWithActivity = comptroller.data()[userAddress].activity;
        Object.keys(usersWithActivity).forEach((timestamp) => {
          const date = new Date(timestamp);
          if (usersWithActivity[timestamp].event === eventName
            && date.getFullYear() === now.getFullYear()
            && date.getMonth() === now.getMonth()
            && date.getDate() === now.getDate()
          ) {
            if (news.indexOf(userAddress) === -1) {
              news.push({
                event: eventName,
                userAddress,
                amount: usersWithActivity[timestamp].amount,
                marketAddress: usersWithActivity[timestamp].marketAddress,
                priceAt: usersWithActivity[timestamp].marketAddress,
              });
            }
          }
        });
      });
    }
    return news;
  }

  async getMetricsData(comptrollerAddress, metricName) {
    const metricData = [];
    const comptroller = await this.db.collection('internal-metrics').doc(comptrollerAddress).get();
    if (comptroller.exists) {
      const metrics = comptroller.data()[metricName];
      Object.keys(metrics).forEach((timestamp) => {
        metricData.push(metrics[timestamp]);
      });
    }
    return metricData;
  }

  async saveMetrics(chainId) {
    const timestamp = new Date();
    const comptrollerInstance = new Comptroller(chainId);
    const { comptrollerAddress } = comptrollerInstance;
    const marketAddresses = await comptrollerInstance.allMarkets();
    const marketsInstances = marketAddresses
      .map((marketAddress) => (Market.isCRbtc(marketAddress) || Market.isCSat(marketAddress)
        ? new CRbtc(marketAddress, chainId)
        : new CToken(marketAddress, chainId)));
    const lockedValues = await comptrollerInstance.totalValueLockedInUSD(marketsInstances, chainId);
    const reserves = await comptrollerInstance.totalReservesInUSD(marketsInstances, chainId);
    const uniqueUsers = await comptrollerInstance.getRegisteredAddresses();
    const activeUsers = await this.getActiveUsers(comptrollerAddress);
    const newUsers = await this.getTodayNewDataForEvent('MarketEntered', comptrollerAddress, timestamp);
    const newBorrows = await this.getTodayNewDataForEvent('Borrow', comptrollerAddress, timestamp);
    const newDeposits = await this.getTodayNewDataForEvent('Mint', comptrollerAddress, timestamp);
    const comptroller = await this.db.collection('internal-metrics').doc(comptrollerAddress).get();
    if (comptroller?.exists) {
      await this.updateMetric(
        'active-users',
        comptrollerAddress,
        timestamp,
        activeUsers,
        activeUsers.length,
      );
    } else {
      await this.setMetric(
        'active-users',
        comptrollerAddress,
        timestamp,
        activeUsers,
        activeUsers.length,
      );
    }
    await this.updateMetric(
      'unique-users',
      comptrollerAddress,
      timestamp,
      uniqueUsers,
      uniqueUsers.length,
    );
    await this.updateMetric(
      'new-users',
      comptrollerAddress,
      timestamp,
      newUsers,
      newUsers.length,
    );
    await this.updateMetric(
      'value-locked',
      comptrollerAddress,
      timestamp,
      lockedValues.data,
      lockedValues.number,
    );
    await this.updateMetric(
      'reserves',
      comptrollerAddress,
      timestamp,
      reserves.data,
      reserves.number,
    );
    await this.updateMetric(
      'new-borrows',
      comptrollerAddress,
      timestamp,
      newBorrows,
      newBorrows.length,
    );
    await this.updateMetric(
      'new-deposits',
      comptrollerAddress,
      timestamp,
      newDeposits,
      newDeposits.length,
    );
  }

  async setMetric(metric, comptrollerAddress, timestamp, data, number) {
    return this.db.collection('internal-metrics').doc(comptrollerAddress).set({
      [metric]: { [timestamp]: { timestamp, data, number } },
    });
  }

  async updateMetric(metric, comptrollerAddress, timestamp, data, number) {
    await this.db.collection('internal-metrics').doc(comptrollerAddress).update({
      [`${metric}.${timestamp}`]: { timestamp, data, number },
    });
  }
}
