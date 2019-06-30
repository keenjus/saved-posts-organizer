import 'babel-polyfill';

import { el, list, mount } from 'redom';

import store, { dispatch, actions } from './store';
import { clearChildren } from '../util';

class Post {
  constructor() {
    this.el = el("div")
  }

  update(post) {
    const title = post.title.replace(/"/g, "'");
    const type = post.type === 't1' ? '(comment)' : '';
  
    function onPostClick() {
      const link = post.permalink;
      const href = link.startsWith('/r/') ? 'https://www.reddit.com' + link : link;
      chrome.tabs.create({ active: true, url: href });
    }
  
    function onPostEdit() {
      // editPostCategory(id);
    }
  
    this.el = el('div.row.editPost',
      el('i.fas.fa-edit', { title: 'Move post', onclick: onPostEdit }),
      el('div.post', { textContent: `${title} ${type}`, onclick: onPostClick }),
    );
  }
}

async function run() {
  const $username = document.querySelector('#username');
  const $postsContainer = document.querySelector('#postContainer');
  const $lastUpdated = document.querySelector('#lastUpdated');
  const $sync = document.querySelector('#sync');

  $sync.addEventListener('click', () => {
    store.dispatch(actions.sync());
  }, false);

  const postList = list("div", Post);
  mount($postsContainer, postList);

  function renderPosts(state) {
    postList.update(state.posts);
  }

  function renderUsername(state) {
    $username.textContent = state.username;
  }

  function renderLastSync(state) {
    const date = state.lastSync;

    if (!date) {
      $lastUpdated.textContent = '';
    } else {
      const minutes = ('0' + date.getMinutes()).slice(-2);
      const hours = ('0' + date.getHours()).slice(-2);
      $lastUpdated.textContent = `${date.getDate()}/${date.getMonth() + 1} - ${hours}:${minutes}`;
    }
  }

  function render(state) {
    if (state.isLoading) {
      $sync.classList.add('spin');
    } else {
      $sync.classList.remove('spin');
    }

    renderUsername(state);
    renderPosts(state);
    renderLastSync(state);
  }

  // Initial call
  render(store.getState());

  // React to changes and render
  store.subscribe(() => {
    render(store.getState());
  });

  store.dispatch(actions.initialize());
}

run().catch(err => {
  console.error('Something went wrong', err);
});
