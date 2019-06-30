import { createStore } from 'redux';
import reddit from "../reddit";

class State {
  constructor() {
    this.posts = [];
    this.lastSync = null;
    this.username = null;
  }
}

const actions = {
  initialize(state, params) {
    return reddit.getSavedPosts().then(result => {
      state.posts = result.posts;
      state.username = result.user;
      state.lastSync = new Date();
    });
  },
  loadMore(state, params) {

  }
};

// TODO: should use redux-thunk?
// TOTAL HACK BY ME
const reducer = (state = new State(), action) => {
  const actionFunc = actions[action.type];
  if (actionFunc) {
    actionFunc(state, action.params).then(action.resolve);
  }
  return state;
};

let store = createStore(reducer);

export function dispatch(action, params) {
  return new Promise((resolve, reject) => {
    store.dispatch({ type: action, params, resolve });
  });
}

export default store;
