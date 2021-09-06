import CRBTCAbi from '@/abis/CRBTC.json';
import * as constants from '@/store/constants';
import Market from './market';

export default class CRbtc extends Market {
  constructor(address = '', chainId) {
    super(address, CRBTCAbi, chainId);
    this.internalUnderlyingAssetSymbol = constants.RBTC_SYMBOL;
  }

  async underlyingAssetSymbol() {
    return this.internalUnderlyingAssetSymbol;
  }

  // eslint-disable-next-line class-methods-use-this
  async balanceOfUnderlyingInWallet(account) {
    return Number(await account.getBalance()) / 1e18;
  }

  async supply(account, amountIntended) {
    return super.supply(account, amountIntended, true);
  }

  // eslint-disable-next-line class-methods-use-this
  async underlyingAssetName() {
    return `${this.internalUnderlyingAssetSymbol} Bitcoin`;
  }

  async getSubsidyFound() {
    return super.getSubsidyFound(true);
  }

  async getEarnings(address) {
    return super.getEarnings(address, true);
  }
}
