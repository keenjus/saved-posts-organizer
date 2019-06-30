import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import reddit from '../../reddit';

class State {
  constructor() {
    this.posts = [];
    this.lastSync = null;
    this.username = null;
    this.isLoading = false;
  }
}

export const actionCreators = {
  setIsLoading(value) {
    return {
      type: 'SET_ISLOADING',
      value,
    };
  },
  setUsername(value) {
    return {
      type: 'SET_USERNAME',
      value,
    };
  },
  setPosts(value) {
    return {
      type: 'SET_POSTS',
      value,
    };
  },
  lastSync() {
    return {
      type: 'LASTSYNC',
    };
  },
};

export const actions = {
  initialize() {
    return this.sync();
  },
  sync() {
    return function(dispatch) {
      dispatch(actionCreators.setIsLoading(true));

      return reddit
        .getSavedPosts()
        .then(result => {
          dispatch(actionCreators.setPosts(result.posts));
          dispatch(actionCreators.setUsername(result.user));
          dispatch(actionCreators.lastSync());

          dispatch(actionCreators.setIsLoading(false));
        })
        .catch(() => {
          dispatch(actionCreators.setPosts([]));
          dispatch(actionCreators.setUsername(null));
          dispatch(actionCreators.setIsLoading(false));
        });
    };
  },
};

const reducer = (state = new State(), action) => {
  switch (action.type) {
    case 'SET_ISLOADING':
      state.isLoading = action.value;
      return state;
    case 'SET_POSTS':
      state.posts = action.value;
      return state;
    case 'SET_USERNAME':
      state.username = action.value;
      return state;
    case 'LASTSYNC':
      state.lastSync = new Date();
      return state;
    default:
      return state;
  }
};

export default createStore(reducer, applyMiddleware(thunk));
