import RBTCWrapperProxyAbi from '@/abis/RBTCWrapperProxy.json';
import SovrynSwapNetworkAbi from '@/abis/SovrynSwapNetwork.json';
import ERC20TokenAbi from '@/abis/ERC20Token.json';
import { ethers } from 'ethers';
import Vue from 'vue';
import { addresses } from './constants';
import signer from './utils';

export default class SovrynSwap {
  constructor(chainId) {
    this.sovrynSwapNetworkAddress = addresses[chainId].sovrynSwapNetwork;
    this.sovrynSwapNetwork = new ethers.Contract(this.sovrynSwapNetworkAddress,
      SovrynSwapNetworkAbi, Vue.web3);
    this.wsSovrynSwapNetwork = new ethers.Contract(this.sovrynSwapNetworkAddress,
      SovrynSwapNetworkAbi, Vue.web3Ws);

    this.rbtcWrapperProxyAddress = addresses[chainId].rbtcWrapperProxy;
    this.rbtcWrapperProxy = new ethers.Contract(this.rbtcWrapperProxyAddress,
      RBTCWrapperProxyAbi, Vue.web3);
    this.wsRbtcWrapperProxy = new ethers.Contract(this.rbtcWrapperProxyAddress,
      RBTCWrapperProxyAbi, Vue.web3Ws);

    this.gasLimit = 500000;
  }

  async getConversionPath(sourceTokenAddress, destTokenAddress) {
    const conversionPath = await this.sovrynSwapNetwork
      .callStatic.conversionPath(sourceTokenAddress, destTokenAddress);
    return conversionPath;
  }

  async getExpextedSwapAmount(conversionPath, amount) {
    const targetAmount = await this.sovrynSwapNetwork
      .callStatic.rateByPath(conversionPath, ethers.utils.parseEther(amount));
    return targetAmount;
  }

  // Swaps RBTC to any other token
  async convertFromRBTC(account, conversionPath, amount, minReturn) {
    const accountSigner = signer(account);
    return this.rbtcWrapperProxy.connect(accountSigner)
      .convertByPath(conversionPath, ethers.utils.parseEther(amount),
        ethers.utils.parseEther(minReturn), {
          value: ethers.utils.parseEther(amount),
          gasLimit: this.gasLimit,
        });
  }

  // Swaps any token to RBTC
  async convertToRBTC(account, conversionPath, amount, minReturn) {
    const accountSigner = signer(account);
    const ERC20Token = new ethers.Contract(conversionPath[0],
      ERC20TokenAbi, Vue.web3);
    await ERC20Token.connect(accountSigner).approve(this.rbtcWrapperProxy.address,
      ethers.utils.parseEther(amount));
    return this.rbtcWrapperProxy.connect(accountSigner)
      .convertByPath(conversionPath, ethers.utils.parseEther(amount),
        ethers.utils.parseEther(minReturn), { gasLimit: this.gasLimit });
  }

  // Swaps any token to any other token except for RBTC, instead it does the swap to wRBTC
  // NOTE: in case of using convertByPath to swap to RBTC is necesary to withdraw from
  // wRBTC token to get the RBTCs
  async convertByPath(account, beneficiary, conversionPath, amount, minReturn) {
    const accountSigner = signer(account);
    const ERC20Token = new ethers.Contract(conversionPath[0],
      ERC20TokenAbi, Vue.web3);
    await ERC20Token.connect(accountSigner).approve(this.sovrynSwapNetwork.address,
      ethers.utils.parseEther(amount));
    return this.sovrynSwapNetwork.connect(accountSigner)
      .convertByPath(conversionPath, ethers.utils.parseEther(amount),
        ethers.utils.parseEther(minReturn), beneficiary,
        '0x0000000000000000000000000000000000000000', 0, { gasLimit: this.gasLimit });
  }
}
