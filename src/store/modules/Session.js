import store from '@/store';
import * as constants from '@/store/constants';
import Vue from 'vue';
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';

const state = {
  walletAddress: undefined,
  account: undefined,
  wallet: undefined,
  chainId: 31,
  provider: undefined,
  markets: [],
};

if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => {
    store.dispatch(constants.SESSION_CONNECT_WEB3, state.wallet);
  });
  window.ethereum.on('chainChanged', () => {
    store.dispatch(constants.SESSION_CONNECT_WEB3, state.wallet);
  });
}

const actions = {
  [constants.SESSION_CONNECT_WEB3]: async ({ commit, dispatch }, wallet) => {
    let provider = null;
    if (window.ethereum) {
      provider = window.ethereum;
      if (wallet === constants.WALLET_LIQUALITY && window.ethereum.isLiquality) {
        provider = window.rsk;
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else if (wallet === constants.WALLET_METAMASK && window.ethereum.isMetaMask) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x1f',
              chainName: 'RSK Testnet',
              nativeCurrency: {
                name: 'Test RBTC',
                symbol: 'tRBTC',
                decimals: 18,
              },
              rpcUrls: ['https://public-node.testnet.rsk.co'],
              blockExplorerUrls: ['https://explorer.testnet.rsk.co'],
            },
          ],
        });
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else if (wallet === constants.WALLET_CONNECT) {
        provider = new WalletConnectProvider({
          rpc: { 31: process.env.VUE_APP_RSK_NODE },
        });
        await provider.enable();
      } else {
        return;
      }
      // eslint-disable-next-line no-multi-assign
      Vue.prototype.$web3 = Vue.web3 = new ethers.providers.Web3Provider(provider);
      const account = await Vue.web3.getSigner();
      const walletAddress = await account.getAddress();
      commit(constants.SESSION_SET_PROPERTY, { provider });
      commit(constants.SESSION_SET_PROPERTY, { account });
      commit(constants.SESSION_SET_PROPERTY, { walletAddress });
      commit(constants.SESSION_SET_PROPERTY, { wallet });
      dispatch(constants.SESSION_GET_CHAIN_ID);
    }
  },
  [constants.SESSION_GET_CHAIN_ID]: ({ commit }) => {
    if (state.wallet === constants.WALLET_CONNECT) {
      commit(constants.SESSION_SET_PROPERTY, { chainId: state.provider.chainId });
      return;
    }
    if (window.ethereum) {
      const chainId = window?.ethereum?.chainId ?? 31;
      if (window.ethereum.isLiquality) {
        commit(constants.SESSION_SET_PROPERTY, { chainId: parseInt(Number(`0x${chainId}`), 10) });
        return;
      }
      if (window.ethereum.isMetaMask) {
        commit(constants.SESSION_SET_PROPERTY, { chainId: Number(chainId) });
      }
    }
  },
  [constants.SESSION_DISCONNECT_WALLET]: async ({ commit }) => {
    if (state.wallet === constants.WALLET_CONNECT) await state.provider.disconnect();
    commit(constants.SESSION_SET_PROPERTY, { walletAddress: undefined });
    commit(constants.SESSION_SET_PROPERTY, { account: undefined });
    commit(constants.SESSION_SET_PROPERTY, { wallet: undefined });
    commit(constants.SESSION_SET_PROPERTY, { provider: undefined });
    commit(constants.SESSION_SET_PROPERTY, { markets: [] });
    commit(constants.SESSION_SET_PROPERTY, { chainId: 31 });
    const web3 = new ethers.providers.JsonRpcProvider(process.env.VUE_APP_RSK_NODE);
    const format = web3.formatter.formats;
    format.receipt.root = format.receipt.logsBloom;
    Object.assign(web3.formatter, { format });
    // eslint-disable-next-line no-multi-assign
    Vue.prototype.$web3 = Vue.web3 = web3;
  },
  [constants.SESSION_ADD_MARKETS]: async ({ commit }, markets) => {
    commit(constants.SESSION_SET_PROPERTY, { markets });
  },
};

const mutations = {
  // eslint-disable-next-line no-shadow
  [constants.SESSION_SET_PROPERTY]: (state, data) => {
    const [[property, value]] = Object.entries(data);
    state[property] = value;
  },
};

const getters = {
  // eslint-disable-next-line no-shadow
  [constants.SESSION_GET_WALLET_NAME]: (state) => {
    switch (state.wallet) {
      case constants.WALLET_LIQUALITY:
        return 'Liquality';
      case constants.WALLET_METAMASK:
        return 'MetaMask';
      default:
        return 'wallet';
    }
  },
  // eslint-disable-next-line no-shadow
  [constants.SESSION_IS_CONNECTED]: (state) => !!state.account,
};

export default {
  state,
  actions,
  mutations,
  getters,
};
