import 'babel-polyfill';

import store, { dispatch, actions } from './store';
import { clearChildren } from '../util';

import CategoryInput from './categoryInput';

function createPostElement(post) {
  const id = post.id;
  const title = post.title.replace(/"/g, "'");
  const permalink = post.permalink;

  const type = post.type === 't1' ? '(comment)' : '';

  const html = `<div class="row editPost">
    <i title="Move post" class="fas fa-edit"></i>
    <div id="${id}" class="post ${title ? '' : 'untitled'}" data-link="${post.permalink}">${title ||
    'untitled'} ${type}</div>
  </div>`;

  // Create a wrapper div and inject the html string
  const element = document.createElement('div');
  element.innerHTML = html;
  // Select the first child aka injected html element
  const postElement = element.firstChild;

  //adds onclick listeners to posts
  postElement.querySelector('.post').addEventListener('click', function() {
    const link = this.dataset.link;
    const href = link.startsWith('/r/') ? 'https://www.reddit.com' + link : link;
    chrome.tabs.create({ active: true, url: href });
  });

  //adds onclick listeners to editpost-buttons
  postElement.querySelector('.fa-edit').addEventListener('click', function() {
    editPostCategory(id);
  });

  return postElement;
}

async function run() {
  const $username = document.querySelector('#username');
  const $postContainer = document.querySelector('#postContainer');
  const $lastUpdated = document.querySelector('#lastUpdated');
  const $sync = document.querySelector('#sync');

  $sync.addEventListener('click', () => {
      store.dispatch(actions.sync());
  }, false);

  function renderPosts(state) {
    clearChildren($postContainer);
    for (const post of state.posts) {
      $postContainer.appendChild(createPostElement(post));
    }
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
