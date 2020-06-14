import rootReducer from './reducers/rootReducer';
import {createStore, AnyAction, applyMiddleware} from 'redux';
import {MakeStore, createWrapper, Context, HYDRATE} from 'next-redux-wrapper';
import thunkMiddleware from "redux-thunk";

import { CookieStorage, NodeCookiesWrapper } from 'redux-persist-cookie-storage'
import ClientCookies from "cookies-js";
import ServerCookies from "cookies";
import { REHYDRATE } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import cloneDeep from 'lodash/cloneDeep';

import {
  getStoredState,
} from "redux-persist";


// BINDING MIDDLEWARE
const bindMiddleware = (middleware) => {
  if (process.env.NODE_ENV !== "production") {
    const { composeWithDevTools } = require("redux-devtools-extension");
    return composeWithDevTools(applyMiddleware(...middleware));
  }
  return applyMiddleware(...middleware);
};

const reducer = (state, action) => {
  if (action.type === HYDRATE) {
    if (action.payload.app === 'init') delete action.payload.app;
    if (action.payload.page === 'init') delete action.payload.page;
    return {...state, ...action.payload};
  } else if(action.type === 'APP') {
    return {...state, app: action.payload};
  } else if(action.type === 'PAGE') {
    return {...state, page: action.payload};
  } else if(action.type === REHYDRATE){
    const nextState = {...action.payload, ...state}
    return cloneDeep(nextState)
  } else {
    const finalState = rootReducer(state, action)
    return finalState
  }
}

// Creating client store only once in the full lifetime [Optimization]
let clientStore;


// create a makeStore function
export const makeStore = ({AppTree, Component, ctx}) => {
  const isServer = typeof window === 'undefined'
  if (isServer){
    if(typeof ctx !== 'undefined') {
      let initialState = extractStateFromCookies(ctx.req, ctx.res);
      return createStore(reducer, initialState, bindMiddleware([thunkMiddleware]));
    }
    return createStore(reducer, bindMiddleware([thunkMiddleware]));
  } else {
    // It's on client side, creating a store which will persist
    const { persistStore, persistReducer } = require("redux-persist");
    const persistConfig = {
      key: "sample-app",
      // whitelist: ["counter"], // only counter will be persisted, add other reducers if needed
      storage: new CookieStorage(ClientCookies), // if needed, use a safer storage
      stateReconciler: autoMergeLevel2
    };

    // Creating a new reducer with our existing reducer
    const persistedReducer = persistReducer(persistConfig, reducer);

    // Early return if clientStore exists
    if(clientStore)
      return clientStore
    // Creating the store again
    clientStore = createStore(
      persistedReducer,
      bindMiddleware([thunkMiddleware])
    );

    // This creates a persistor object & push that persisted object to .__persistor, so that we can avail the persistability feature
    clientStore.__persistor = persistStore(clientStore);
    return clientStore;
  }
};

export const extractStateFromCookies = (req, res) => {
  // Server Cookie initialisation with the passed headers
  const serverCookie = new ServerCookies(req, res)
  const cookies = new NodeCookiesWrapper(serverCookie);

  const config = {
    key: "sample-app",
    storage: new CookieStorage(cookies),
  };
  const debug = config.debug
  let state = {};

  // Trying to extract redux state present inside the cookie
  try {
    // Provided by redux-persist to keep a check of whitelist and blacklist
    const transforms = config.transforms || []
    // Initial constant from redux-persist library
    const KEY_PREFIX = 'persist:'
    // Forming the actual storage key from the config passed
    const storageKey = `${
      config.keyPrefix !== undefined ? config.keyPrefix : KEY_PREFIX
    }${config.key}`
    let cookieData = serverCookie.get(encodeURIComponent(storageKey))
    let rawState = defaultDeserialize(cookieData)
    // Iterating over keys, transforming them from raw state to state
    Object.keys(rawState).forEach(key => {
      state[key] = transforms.reduceRight((subState, transformer) => {
        return transformer.out(subState, key, rawState)
      }, defaultDeserialize(rawState[key]))
    })
    return state
  } catch (error) {
    if (debug) {
      console.log(
        "getStoredState() failed (this happens when the index storage item is not set):\n",
        error
      );
    }
  }

  // Removing the state's _persist key for the server-side (non-persisted) redux store
  if (state && typeof state._persist !== "undefined") {
    const { _persist, ...cleanedState } = state;
    state = cleanedState;
  }
  return state;
};

function defaultDeserialize(serial) {
  return JSON.parse(decodeURIComponent(serial))
}

// export an assembled wrapper
// export const wrapper = createWrapper(makeStore, {debug: true});
export const wrapper = createWrapper(makeStore);