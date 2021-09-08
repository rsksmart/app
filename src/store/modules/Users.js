import * as constants from '@/store/constants';
import { addresses } from '@/middleware/contracts/constants';
import store from '@/store';
import {
  Comptroller,
  Firestore,
  SovrynSwap,
} from '@/middleware';

const state = {
  user: [],
  dialogLoading: false,
  notifications: [],
  infoLoading: {
    type: '',
    amount: '',
    symbol: '',
    wallet: true,
    loading: true,
    deposit: true,
    success: null,
    firstTx: false,
  },
  swapDialog: false,
  swapInfo: {
    type: '',
    amount: '',
    symbol: '',
    wallet: true,
    loading: false,
    exchange: true,
    sign: false,
    success: null,
    time: 0,
  },
};
const actions = {
  [constants.USER_ACTION]: ({ dispatch }, data) => {
    const { action, market } = data;

    dispatch(constants.USER_ACTION_DIALOG, true);

    switch (action) {
      case constants.USER_ACTION_MINT:
        dispatch(constants.USER_ACTION_MINT, data);
        break;
      case constants.USER_ACTION_REDEEM:
        dispatch(constants.USER_ACTION_REDEEM, data);
        break;
      case constants.USER_ACTION_BORROW:
        dispatch(constants.USER_ACTION_BORROW, data);
        break;
      case constants.USER_ACTION_REPAY:
        dispatch(constants.USER_ACTION_REPAY, data);
        break;
      default:
        break;
    }

    market.wsInstance.on('TokenFailure', (from, to, amount, event) => {
      console.info(`Failure from ${from} Event: ${JSON.stringify(event)}`);
      const { error, detail, info } = event.args;
      console.log(`Error: ${error}, detail: ${detail}, info: ${info}`);
      if (this.walletAddress === from) {
        console.log('tx error');
      }
    });
  },

  [constants.USER_ACTION_DIALOG]: ({ commit }, data) => {
    commit(constants.USER_ACTION_DIALOG, data);
  },

  [constants.USER_ACTION_SWAP_DIALOG]: ({ commit }, info) => {
    const { data } = info;
    commit(constants.USER_ACTION_SWAP_DIALOG, data);
  },

  [constants.USER_ACTION_MINT]: async ({ commit, dispatch }, data) => {
    let actionMint = true;
    const { state: { Session, Market } } = store;
    const {
      market,
      amount,
      symbol,
      price,
    } = data;
    const comptroller = new Comptroller(Session.chainId);
    const firestore = new Firestore();

    const info = {};
    info.type = 'deposit';
    info.loading = true;
    info.symbol = symbol;
    info.wallet = true;
    commit(constants.USER_ACTION_INFO_DIALOG, info);

    const assetsIn = await comptroller.getAssetsIn(Session.walletAddress);
    const allMarkets = await comptroller.allMarkets();
    if (assetsIn.indexOf(market.marketAddress) === -1) {
      info.firstTx = true;
      commit(constants.USER_ACTION_INFO_DIALOG, info);
      await comptroller.enterMarkets(Session.account, allMarkets)
        .then((tx) => firestore.saveUserAction(
          comptroller.comptrollerAddress,
          Session.walletAddress,
          'MarketEntered',
          0,
          null,
          null,
          null,
          new Date(),
          tx.hash,
        ))
        .catch();
      info.firstTx = false;
      commit(constants.USER_ACTION_INFO_DIALOG, info);
    }

    await market.supply(Session.account, amount)
      .then((tx) => {
        info.wallet = false;
        commit(constants.USER_ACTION_INFO_DIALOG, info);
        market.wsInstance.on('Mint', async (from, actualMintAmount) => {
          // console.log('mint');
          if (from === Session.walletAddress && Number(amount) === actualMintAmount / 1e18) {
            // console.log('cantidad depositada', actualMintAmount / 1e18);
            info.loading = false;
            info.deposit = true;
            info.amount = actualMintAmount / 1e18;
            info.action = 'Mint';
            info.hash = tx.hash;
            commit(constants.USER_ACTION_INFO_DIALOG, info);
            if (actionMint) {
              await firestore.saveUserAction(
                comptroller.comptrollerAddress,
                Session.walletAddress,
                'Mint',
                actualMintAmount / 1e18,
                symbol,
                market.marketAddress,
                price,
                new Date(),
                tx.hash,
              );
              actionMint = false;
              // console.log('actionMint', actionMint);
              // notify
              if (!state.dialogLoading) {
                dispatch(constants.USER_ACTION_NOTIFICATIONS, info);
              }
              if (market.marketAddress === Market.market.marketAddress) {
                setTimeout(() => {
                  dispatch(constants.MARKET_UPDATE_MARKET,
                    {
                      walletAddress: Session.walletAddress,
                      account: Session.account,
                      page: constants.ROUTE_NAMES.DEPOSITS,
                    });
                }, 2000);
              }
            }
          }
        });
      })
      .catch(console.error);
  },

  [constants.USER_ACTION_REDEEM]: async ({ commit, dispatch }, data) => {
    let actionRedeem = true;
    const { state: { Session, Market } } = store;
    const {
      market,
      amount,
      symbol,
      price,
    } = data;
    const comptroller = new Comptroller(Session.chainId);
    const firestore = new Firestore();

    // console.log('toState', data);
    const info = {};
    info.type = 'deposit';
    info.loading = true;
    info.symbol = symbol;
    info.wallet = true;

    commit(constants.USER_ACTION_INFO_DIALOG, info);

    await market.redeem(Session.account, amount)
      .then((tx) => {
        // console.log(tx);
        info.wallet = false;
        commit(constants.USER_ACTION_INFO_DIALOG, info);
        market.wsInstance.on('Redeem', async (from, redeemAmount) => {
          if (from === Session.walletAddress) {
            info.loading = false;
            info.deposit = false;
            info.amount = redeemAmount / 1e18;
            info.action = 'Redeem';
            info.hash = tx.hash;
            commit(constants.USER_ACTION_INFO_DIALOG, info);
            if (actionRedeem) {
              await firestore.saveUserAction(
                comptroller.comptrollerAddress,
                Session.walletAddress,
                'Redeem',
                redeemAmount / 1e18,
                symbol,
                market.marketAddress,
                price,
                new Date(),
                tx.hash,
              );
              actionRedeem = false;
              // console.log('actionRedeem', actionRedeem);
              // notify
              if (!state.dialogLoading) {
                dispatch(constants.USER_ACTION_NOTIFICATIONS, info);
              }
              if (market.marketAddress === Market.market.marketAddress) {
                setTimeout(() => {
                  dispatch(constants.MARKET_UPDATE_MARKET,
                    {
                      walletAddress: Session.walletAddress,
                      account: Session.account,
                      page: constants.ROUTE_NAMES.DEPOSITS,
                    });
                }, 2000);
              }
            }
          }
        });
      })
      .catch(console.error);
  },

  [constants.USER_ACTION_BORROW]: async ({ commit, dispatch }, data) => {
    let actionBorrow = true;
    const { state: { Session, Market } } = store;
    const {
      market,
      amount,
      symbol,
      price,
    } = data;
    const comptroller = new Comptroller(Session.chainId);
    const firestore = new Firestore();

    // console.log('toState', data);
    const info = {};
    info.type = 'borrow';
    info.loading = true;
    info.wallet = true;
    info.symbol = symbol;

    commit(constants.USER_ACTION_INFO_DIALOG, info);

    await market.borrow(Session.account, amount)
      .then((tx) => {
        // console.log(tx);
        info.wallet = false;
        commit(constants.USER_ACTION_INFO_DIALOG, info);
        market.wsInstance.on('Borrow', async (from, borrowAmount) => {
          if (from === Session.walletAddress && Number(amount) === borrowAmount / 1e18) {
            info.loading = false;
            info.borrow = true;
            info.amount = borrowAmount / 1e18;
            info.action = 'Borrow';
            info.hash = tx.hash;
            commit(constants.USER_ACTION_INFO_DIALOG, info);
            if (actionBorrow) {
              await firestore.saveUserAction(
                comptroller.comptrollerAddress,
                Session.walletAddress,
                'Borrow',
                borrowAmount / 1e18,
                symbol,
                market.marketAddress,
                price,
                new Date(),
                tx.hash,
              );
              actionBorrow = false;
              // console.log('actionBorrow', actionBorrow);
              // notify
              if (!state.dialogLoading) {
                dispatch(constants.USER_ACTION_NOTIFICATIONS, info);
              }
              if (market.marketAddress === Market.market.marketAddress) {
                setTimeout(() => {
                  dispatch(constants.MARKET_UPDATE_MARKET,
                    {
                      walletAddress: Session.walletAddress,
                      account: Session.account,
                      page: constants.ROUTE_NAMES.BORROWS,
                    });
                }, 2000);
              }
            }
          }
        });
      })
      .catch(console.error);
  },

  [constants.USER_ACTION_REPAY]: async ({ commit, dispatch }, data) => {
    let actionRepay = true;
    const { state: { Session, Market } } = store;
    const {
      market,
      amount,
      symbol,
      price,
    } = data;
    const comptroller = new Comptroller(Session.chainId);
    const firestore = new Firestore();

    // console.log('toState', data);
    const info = {};
    info.type = 'borrow';
    info.loading = true;
    info.wallet = true;
    info.symbol = symbol;

    commit(constants.USER_ACTION_INFO_DIALOG, info);
    let amountPay = amount;
    if (Number(amount) === Market.info.borrowBalance) amountPay = -1;
    console.log('amountPay', amountPay);
    await market.repay(Session.account, amountPay, Session.walletAddress)
      .then((tx) => {
        // console.log(tx);
        info.wallet = false;
        commit(constants.USER_ACTION_INFO_DIALOG, info);
        market.wsInstance.on('RepayBorrow', async (from, _, borrowAmount) => {
          if (from === Session.walletAddress) {
            info.loading = false;
            info.borrow = false;
            info.amount = borrowAmount / 1e18;
            info.action = 'RepayBorrow';
            info.hash = tx.hash;
            commit(constants.USER_ACTION_INFO_DIALOG, info);
            if (actionRepay) {
              await firestore.saveUserAction(
                comptroller.comptrollerAddress,
                Session.walletAddress,
                'RepayBorrow',
                borrowAmount / 1e18,
                symbol,
                market.marketAddress,
                price,
                new Date(),
                tx.hash,
              );
              actionRepay = false;
              // console.log('actionRepay', actionRepay);
              // notify
              if (!state.dialogLoading) {
                dispatch(constants.USER_ACTION_NOTIFICATIONS, info);
              }
              if (market.marketAddress === Market.market.marketAddress) {
                setTimeout(() => {
                  dispatch(constants.MARKET_UPDATE_MARKET,
                    {
                      walletAddress: Session.walletAddress,
                      account: Session.account,
                      page: constants.ROUTE_NAMES.BORROWS,
                    });
                }, 2000);
              }
            }
          }
        });
      })
      .catch(console.error);
  },

  [constants.USER_ACTION_NOTIFICATIONS]: async ({ commit }, data) => {
    const notification = state.notifications;
    let notifyCopy = [];

    if (notification.length > 0) {
      notifyCopy = notification.filter((noti) => noti.hash !== data.hash);
      commit(constants.USER_ACTION_NOTIFICATIONS, notifyCopy);
      // console.log('notifications copy', notifyCopy);
    } else {
      notifyCopy.push(data);
      commit(constants.USER_ACTION_NOTIFICATIONS, notifyCopy);
      // console.log('notifications data', notifyCopy);
    }
  },

  [constants.USER_FEEDBACK]: async ({ dispatch, commit }, data) => {
    const info = {
      type: 'feedback',
      loading: true,
    };
    commit(constants.USER_ACTION_INFO_DIALOG, info);
    dispatch(constants.USER_ACTION_DIALOG, true);

    const firebase = (new Firestore()).db;
    firebase.collection('feedback')
      .add(data)
      .then(() => {
        info.loading = false;
        info.success = true;
        commit(constants.USER_ACTION_INFO_DIALOG, info);
      }).catch(() => {
        info.loading = false;
        info.success = false;
        commit(constants.USER_ACTION_INFO_DIALOG, info);
      });
  },

  [constants.USER_ACTION_SWAP]: async ({ commit, dispatch }, data) => {
    let actionExchange = true;
    const { state: { Session } } = store;
    const sovrynSwap = new SovrynSwap(Session.chainId);
    // const firestore = new Firestore();
    // const comptroller = new Comptroller(Session.chainId);
    let resp = '';
    const info = {};

    const {
      sourceToken,
      destToken,
      amount,
      minReturn,
      amountToReceive,
      conversionPath,
      // select,
      selectI,
    } = data;

    try {
      info.sign = true;
      info.wallet = true;
      info.exchange = false;
      commit(constants.USER_ACTION_SWAP, info);

      if (sourceToken === addresses[Session.chainId].wRBTC) {
        resp = await sovrynSwap
          .convertFromRBTC(Session.account, conversionPath, amount, minReturn);
      } else if (destToken === addresses[Session.chainId].wRBTC) {
        resp = await sovrynSwap
          .convertToRBTC(Session.account, conversionPath, amount, minReturn);
        console.log('res', resp);
      } else {
        resp = await sovrynSwap
          .convertByPath(Session.account, Session.walletAddress,
            conversionPath, amount, minReturn);
      }

      info.wallet = false;
      info.loading = true;
      info.exchange = false;
      info.symbol = selectI.underlyingSymbol;

      commit(constants.USER_ACTION_SWAP, info);

      sovrynSwap.wsSovrynSwapNetwork.on('Conversion', async () => {
        if (actionExchange) {
          actionExchange = false;

          info.loading = false;
          info.action = 'Exchange';
          info.exchange = true;
          info.amount = amountToReceive;
          info.hash = resp.hash;

          commit(constants.USER_ACTION_SWAP, info);

          if (!state.swapDialog) {
            dispatch(constants.USER_ACTION_NOTIFICATIONS, info);
          }
          // await firestore.saveUserAction(
          //   comptroller.comptrollerAddress,
          //   Session.walletAddress,
          //   'Exchange',
          //   amount,
          //   select.underlyingSymbol,
          //   amountToReceive,
          //   selectI.underlyingSymbol,
          //   new Date(),
          //   resp.hash,
          // );
          setTimeout(() => {
            dispatch(constants.MARKET_UPDATE_MARKET,
              {
                walletAddress: Session.walletAddress,
                account: Session.account,
              });
          }, 2000);
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
};

const mutations = {

  // eslint-disable-next-line no-shadow
  [constants.USER_ACTION_INFO_DIALOG]: (state, payload) => {
    state.infoLoading = { ...state.infoLoading, ...payload };
  },

  // eslint-disable-next-line no-shadow
  [constants.USER_ACTION_NOTIFICATIONS]: (state, payload) => {
    state.notifications = payload;
  },

  // eslint-disable-next-line no-shadow
  [constants.USER_ACTION_DIALOG]: (state, payload) => {
    state.dialogLoading = payload;
  },

  // eslint-disable-next-line no-shadow
  [constants.USER_ACTION_SWAP]: (state, payload) => {
    state.swapInfo = { ...state.swapInfo, ...payload };
  },

  // eslint-disable-next-line no-shadow
  [constants.USER_ACTION_SWAP_DIALOG]: (state, payload) => {
    state.swapDialog = payload;
  },
};

export default {
  state,
  actions,
  mutations,
};
