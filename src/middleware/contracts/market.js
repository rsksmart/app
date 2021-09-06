import CTokenAbi from '@/abis/CErc20Immutable.json';
import PriceOracleProxyAbi from '@/abis/PriceOracleProxy.json';
import StandardTokenAbi from '@/abis/StandardToken.json';
import TropykusLensAbi from '@/abis/TropykusLens.json';
import { ethers } from 'ethers';
import Vue from 'vue';
import * as constants from '@/store/constants';
import { addresses } from './constants';
import signer from './utils';

const blocksPerDay = 2 * 60 * 24;
const daysPerYear = 365;
const factor = 1e18;

export default class Market {
  constructor(address = '', MarketAbi, chainId) {
    this.marketAddress = address.toLowerCase();
    this.lens = new ethers.Contract(addresses[chainId].tropykusLens, TropykusLensAbi, Vue.web3);
    this.instance = new ethers.Contract(this.marketAddress, MarketAbi, Vue.web3);
    this.wsInstance = new ethers.Contract(this.marketAddress, MarketAbi, Vue.web3Ws);
    this.gasLimit = 400000;
  }

  static async isCRbtc(address) {
    const instance = new ethers.Contract(address.toLowerCase(), CTokenAbi, Vue.web3);
    try {
      const result = await instance.callStatic.symbol();
      return result === constants.CRBTC_SYMBOL;
    } catch (e) {
      return false;
    }
  }

  static async isCSat(address) {
    const instance = new ethers.Contract(address.toLowerCase(), CTokenAbi, Vue.web3);
    try {
      const result = await instance.callStatic.symbol();
      return result === constants.CSAT_SYMBOL;
    } catch (e) {
      return false;
    }
  }

  get name() {
    return this.instance.callStatic.name();
  }

  get symbol() {
    return this.instance.callStatic.symbol();
  }

  get decimals() {
    return this.instance.callStatic.decimals();
  }

  async totalSupplyInUnderlying() {
    const totalSupply = Number(await this.instance.callStatic.totalSupply()) / 1e18;
    const exchangeRate = await this.exchangeRateStored();
    return totalSupply * exchangeRate;
  }

  async totalBorrowsInUnderlying() {
    return Number(await this.instance.callStatic.totalBorrows()) / 1e18;
  }

  async totalSupplyUSD(chainId) {
    const totalSupplyInUnderlying = await this.totalSupplyInUnderlying();
    const price = await this.underlyingCurrentPrice(chainId);
    return totalSupplyInUnderlying * price;
  }

  async totalBorrowsUSD(chainId) {
    const totalBorrowsInUnderlying = await this.totalBorrowsInUnderlying();
    const price = await this.underlyingCurrentPrice(chainId);
    return totalBorrowsInUnderlying * price;
  }

  async reservesInUSD(chainId) {
    const reserves = await this.getReserves();
    const price = await this.underlyingCurrentPrice(chainId);
    return price * reserves;
  }

  async underlying() {
    const { underlyingAssetAddress } = await this
      .lens.callStatic.cTokenMetadata(this.marketAddress);
    return underlyingAssetAddress;
  }

  async underlyingAssetName() {
    const underlyingAsset = new ethers.Contract(
      await this.underlying(),
      StandardTokenAbi,
      Vue.web3,
    );
    return underlyingAsset.callStatic.name();
  }

  async underlyingAssetSymbol() {
    const underlyingAsset = new ethers.Contract(
      await this.underlying(),
      StandardTokenAbi,
      Vue.web3,
    );
    return underlyingAsset.callStatic.symbol();
  }

  async underlyingAssetDecimals() {
    const underlyingAsset = new ethers.Contract(
      await this.underlying(),
      StandardTokenAbi,
      Vue.web3,
    );
    return underlyingAsset.callStatic.decimals();
  }

  async supplyRateAPY() {
    let supplyRatePerBlock = await this.instance.callStatic.supplyRatePerBlock();
    supplyRatePerBlock = Number(supplyRatePerBlock) / factor;
    return ((Number(supplyRatePerBlock) * blocksPerDay + 1) ** (daysPerYear - 1) - 1) * 100;
  }

  async borrowRateAPY() {
    let borrowRatePerBlock = await this.instance.callStatic.borrowRatePerBlock();
    borrowRatePerBlock = Number(borrowRatePerBlock) / factor;
    return ((Number(borrowRatePerBlock) * blocksPerDay + 1) ** (daysPerYear - 1) - 1) * 100;
  }

  async balanceOf(address) {
    return Number(await this.instance.callStatic.balanceOf(address)) / factor;
  }

  async currentBalanceOfCTokenInUnderlying(address) {
    const cTokenBalance = await this.balanceOf(address);
    const exchangeRate = await this.exchangeRateCurrent();
    return (cTokenBalance * exchangeRate);
  }

  async borrowBalanceStored(address) {
    return Number(await this.instance.callStatic.borrowBalanceStored(address)) / factor;
  }

  async borrowBalanceCurrent(address) {
    return Number(await this.instance.callStatic.borrowBalanceCurrent(address)) / factor;
  }

  async borrowBalanceInUSD(chainId, address) {
    const price = await this.underlyingCurrentPrice(chainId);
    return await this.borrowBalanceStored(address) * price;
  }

  async exchangeRateCurrent() {
    return Number(await this.instance.callStatic.exchangeRateCurrent()) / factor;
  }

  async exchangeRateStored() {
    return Number(await this.instance.callStatic.exchangeRateStored()) / factor;
  }

  async getTotalSupply() {
    return Number(await this.instance.callStatic.totalSupply()) / factor;
  }

  async getReserves() {
    return Number(await this.instance.callStatic.totalReserves()) / factor;
  }

  async getSubsidyFound(isRbtc = false) {
    return isRbtc
      ? Number(this.instance.callStatic.subsidyFund
        ? await this.instance.callStatic.subsidyFund() : 0) / factor : 0;
  }

  async getInitialSupply(address) {
    const supplyEvents = await this.instance.queryFilter('Mint', -500000);
    let addressSupplied = 0;
    supplyEvents.forEach((supply) => {
      const [minter, mintAmount] = supply.args;
      if (minter === address) addressSupplied += Number(mintAmount) / factor;
    });
    const redeemAmount = await this.getRedeems(address);
    // const supplyBalance = await this.currentBalanceOfCTokenInUnderlying(address);
    const initial = addressSupplied - redeemAmount;
    return initial; // >= 0 ? initial : supplyBalance;
  }

  async getRedeems(address) {
    const redeemEvents = await this.instance.queryFilter('Redeem', -500000);
    let addressRedeem = 0;
    redeemEvents.forEach((redeem) => {
      const [redeemer, redeemAmount] = redeem.args;
      if (redeemer === address) addressRedeem += Number(redeemAmount) / factor;
    });
    return addressRedeem;
  }

  async getInitialBorrow(address) {
    const borrowEvents = await this.instance.queryFilter('Borrow', -500000);
    let addressBorrowed = 0;
    borrowEvents.forEach((borrow) => {
      const [borrower, borrowAmount] = borrow.args;
      if (borrower === address) addressBorrowed += Number(borrowAmount) / factor;
    });
    const repayAmount = await this.getRepays(address);
    // const borrowBalance = await this.borrowBalanceCurrent(address);
    const initial = addressBorrowed - repayAmount;
    return initial; // >= 0 ? initial : borrowBalance;
  }

  async getRepays(address) {
    const supplyEvents = await this.instance.queryFilter('RepayBorrow', -500000);
    let addressRepayed = 0;
    supplyEvents.forEach((repay) => {
      const [borrower, repayAmount] = repay.args;
      if (borrower === address) addressRepayed += Number(repayAmount) / factor;
    });
    return addressRepayed;
  }

  async getDebtInterest(address) {
    const borrowBalanceStored = await this.borrowBalanceStored(address);
    const borrowAPY = await this.borrowRateAPY();
    return borrowBalanceStored * (borrowAPY / 100);
  }

  async getEarnings(address, isRbtc = false) {
    const updatedSupply = await this.currentBalanceOfCTokenInUnderlying(address, isRbtc);
    const supplyAPY = await this.supplyRateAPY();
    return updatedSupply * (supplyAPY / 100);
  }

  async eventsEarnings(address) {
    const initial = await this.getInitialSupply(address);
    const total = await this.currentBalanceOfCTokenInUnderlying(address);
    return total - initial;
  }

  async eventsInterest(address) {
    const initial = await this.getInitialBorrow(address);
    const total = await this.borrowBalanceStored(address);
    return total - initial;
  }

  async getCash() {
    return Number(await this.instance.callStatic.getCash()) / factor;
  }

  async balanceOfUnderlyingInWallet(account) {
    const address = await account.getAddress();
    const underlyingAssetSymbol = await this.underlying();
    const underlyingAsset = new ethers.Contract(
      underlyingAssetSymbol,
      StandardTokenAbi,
      Vue.web3,
    );
    return Number(await underlyingAsset.callStatic.balanceOf(address)) / factor;
  }

  async underlyingCurrentPrice(chainId) {
    const priceOracleProxyInstance = new ethers.Contract(
      addresses[chainId].priceOracleProxy,
      PriceOracleProxyAbi,
      Vue.web3,
    );
    return Number(await priceOracleProxyInstance.callStatic.getUnderlyingPrice(this.marketAddress))
      / factor;
  }

  static getAmountDecimals(amount) {
    const decimalToFix = 18;
    return ethers.utils.parseUnits(
      typeof amount === 'string' ? amount : amount.toFixed(decimalToFix),
      decimalToFix,
    );
  }

  async supply(account, amountIntended, isCRbtc = false) {
    const accountSigner = signer(account);
    const value = Market.getAmountDecimals(amountIntended);
    if (isCRbtc) {
      return this.instance.connect(accountSigner).mint({ value, gasLimit: this.gasLimit });
    }
    const underlyingAsset = new ethers.Contract(
      await this.underlying(),
      StandardTokenAbi,
      Vue.web3,
    );
    await underlyingAsset.connect(accountSigner).approve(this.marketAddress, value);
    return this.instance.connect(accountSigner).mint(value, { gasLimit: this.gasLimit });
  }

  async borrow(account, amountIntended) {
    const accountSigner = signer(account);
    const amount = await Market.getAmountDecimals(amountIntended);
    return this.instance.connect(accountSigner).borrow(amount, { gasLimit: this.gasLimit });
  }

  async redeem(account, amountIntended) {
    const accountSigner = signer(account);
    const amount = await Market.getAmountDecimals(amountIntended);
    return this.instance.connect(accountSigner).redeem(amount, { gasLimit: this.gasLimit });
  }

  async repay(account, amountIntended, walletAddress) {
    console.log('amountIntended', amountIntended);
    console.log('account', account);
    const accountSigner = signer(account);
    let value = 0;
    if (await Market.isCRbtc(this.marketAddress) || await Market.isCSat(this.marketAddress)) {
      const borrowBalanceCurrent = await this.borrowBalanceCurrent(walletAddress);
      console.log('borrowBalanceCurrent', borrowBalanceCurrent);
      value = amountIntended === -1 ? Market.getAmountDecimals(borrowBalanceCurrent)
        : Market.getAmountDecimals(amountIntended);
      console.log(value);
      return this.instance.connect(accountSigner).repayBorrow({ value, gasLimit: this.gasLimit });
    }
    value = amountIntended === -1 ? '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      : Market.getAmountDecimals(amountIntended);
    const underlyingAsset = new ethers.Contract(
      await this.underlying(),
      StandardTokenAbi,
      Vue.web3,
    );
    await underlyingAsset.connect(accountSigner).approve(this.marketAddress, value);
    return this.instance.connect(accountSigner).repayBorrow(value, { gasLimit: this.gasLimit });
  }

  // async repay(account, amountIntended) {
  //   const accountSigner = signer(account);
  //   let value = 0;
  //   // : await ethers.utils.parseEther(`${amountIntended}`);
  //   if (amountIntended === -1) {
  //     value = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  //   } else {
  //     value = Market.getAmountDecimals(amountIntended);
  //   }

  //   if (await Market.isCRbtc(this.marketAddress) || await Market.isCSat(this.marketAddress)) {
  //     return this.instance.connect(accountSigner)
  //      .repayBorrow({ value, gasLimit: this.gasLimit });
  //   }
  //   const underlyingAsset = new ethers.Contract(
  //     await this.underlying(),
  //     StandardTokenAbi,
  //     Vue.web3,
  //   );
  //   await underlyingAsset.connect(accountSigner).approve(this.marketAddress, value);
  //   return this.instance.connect(accountSigner).repayBorrow(value, { gasLimit: this.gasLimit });
  // }

  async suppliedLast24Hours(chainId) {
    const supplyEvents = await this.instance.queryFilter('Mint', -2880);
    const price = await this.underlyingCurrentPrice(chainId);
    let total = 0;
    const accounts = [];
    supplyEvents.forEach((supply) => {
      if (accounts.indexOf(supply.args.minter) === -1) {
        accounts.push(supply.args.minter);
        total += (Number(supply.args.mintAmount) / 1e18) * price;
      }
    });
    return { total, accounts };
  }

  async borrowedLast24Hours() {
    const borrowEvents = await this.instance.queryFilter('Borrow', -2880);
    let total = 0;
    const accounts = [];
    borrowEvents.forEach((borrow) => {
      if (accounts.indexOf(borrow.args.borrower) === -1) {
        accounts.push(borrow.args.borrower);
        total += (Number(borrow.args.borrowAmount) / 1e18);
      }
    });
    return { total, accounts };
  }
}
