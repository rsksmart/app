import ComptrollerAbi from '@/abis/ComptrollerG6.json';
import { ethers } from 'ethers';
import Vue from 'vue';
import { addresses } from './constants';
import signer from './utils';

export default class Comptroller {
  constructor(chainId) {
    this.comptrollerAddress = addresses[chainId].comptroller;
    this.instance = new ethers.Contract(this.comptrollerAddress, ComptrollerAbi, Vue.web3);
    this.wsInstance = new ethers.Contract(this.comptrollerAddress, ComptrollerAbi, Vue.web3Ws);
  }

  get allMarkets() {
    return this.instance.callStatic.getAllMarkets();
  }

  getAssetsIn(address) {
    return this.instance.callStatic.getAssetsIn(address);
  }

  async getAccountLiquidity(address) {
    const liquidityResponse = await this.instance.callStatic.getAccountLiquidity(address);
    return liquidityResponse[1] / 1e18;
  }

  enterMarkets(account, marketAddresses) {
    const accountSigner = signer(account);
    return this.instance.connect(accountSigner).enterMarkets(marketAddresses);
  }

  async healthRatio(markets, chainId, address) {
    const numerador = await this.getAccountLiquidity(address);
    let denominador = 0;
    markets.forEach(async (market) => {
      denominador += await market.borrowBalanceInUSD(chainId, address);
    });
    return numerador / denominador;
  }

  async hypotheticalHealthRatio(markets, chainId, address, borrowBalanceInUSD) {
    const numerador = await this.getAccountLiquidity(address);
    let denominador = 0;
    markets.forEach(async (market) => {
      denominador += await market.borrowBalanceInUSD(chainId, address);
    });
    denominador += borrowBalanceInUSD;
    return numerador / denominador;
  }

  async healthFactor(markets, chainId, address) {
    return 1 - Math.min(1, 1 / await this.healthRatio(markets, chainId, address));
  }

  async hypotheticalHealthFactor(markets, chainId, address, borrowBalanceInUSD) {
    return 1 - Math.min(1, 1 / await this
      .hypotheticalHealthRatio(markets, chainId, address, borrowBalanceInUSD));
  }

  async totalBalanceInUSD(markets, accountAddress, chainId) {
    const deposits = await this.totalDepositsInUSD(markets, accountAddress, chainId);
    const debts = await this.totalBorrowsInUSD(markets, accountAddress, chainId);
    console.log('deposits', deposits);
    console.log('debts', debts);
    return deposits - debts;
  }

  // eslint-disable-next-line class-methods-use-this
  totalDepositsInUSD(markets, accountAddress, chainId) {
    return new Promise((resolve, reject) => {
      let totalDeposits = 0;
      let counter = 0;
      markets.forEach(async (market) => {
        await Promise.all([
          market.underlyingCurrentPrice(chainId),
          market.currentBalanceOfCTokenInUnderlying(accountAddress),
        ])
          .then(([price, totalDepositInUnderlying]) => {
            totalDeposits += totalDepositInUnderlying * price;
            counter += 1;
            if (counter === markets.length) resolve(totalDeposits);
          })
          .catch(reject);
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async totalBorrowsInUSD(markets, accountAddress, chainId) {
    return new Promise((resolve, reject) => {
      let totalBorrows = 0;
      let counter = 0;
      markets.forEach(async (market) => {
        await Promise.all([
          market.underlyingCurrentPrice(chainId),
          market.borrowBalanceCurrent(accountAddress),
        ])
          .then(([price, totalBorrowInUnderlying]) => {
            totalBorrows += totalBorrowInUnderlying * price;
            counter += 1;
            if (counter === markets.length) resolve(totalBorrows);
          })
          .catch(reject);
      });
    });
  }
}
