// Local storages:
// username           : the user's reddit username
// posts              : all user's saved posts
// categories         : the user's custom categories

import 'babel-polyfill';

import reddit from '../reddit';

import CategoryInput from './categoryInput';
import UserStorage from './userStorage';

let username = localStorage.getItem('username');

const $categoryInput = new CategoryInput('#input');
const storage = new UserStorage(username);

var lastClickedCategory = 'All posts';

var posts = storage.getPosts();
var categories = storage.getCategories();

document.getElementById('sync').addEventListener('click', getSavedPostsFromFeed);
document.getElementById('addFolder').addEventListener('click', addFolder);

function startLoading() {
  document.getElementById('sync').classList.add('spin');
}

function stopLoading() {
  document.getElementById('sync').classList.remove('spin');
}

function refreshLastUpdated() {
  const date = storage.lastUpdated();
  const minutes = date.getMinutes().toString();
  const hours = date.getHours().toString();
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (hours < 10) {
    hours = '0' + hours;
  }
  document.getElementById('lastUpdated').innerHTML = `${date.getDate()}/${date.getMonth() + 1} - ${hours}:${minutes}`;
}

function getSavedPostsFromFeed() {
  startLoading();

  reddit
    .getSavedPosts()
    .then(data => {
      // Get the saved posts from reddit api
      const savedPosts = data.posts;

      // Find new posts
      const newSavedPosts = savedPosts.filter(p => !posts.find(x => x.id === p.id));
      // Find deleted posts
      const deletedSavedPosts = posts.filter(p => !savedPosts.find(x => x.id === p.id));

      // Remove deleted posts from local array
      for (const deletedPost of deletedSavedPosts) {
        posts.splice(posts.indexOf(deletedPost), 1);
      }

      // Add new posts to local array
      posts.push(...newSavedPosts);
      storage.setPosts(posts);

      username = data.user;
      localStorage.setItem('username', data.user);

      initView(lastClickedCategory);
    })
    .catch(err => {
      openErrorMenu("Couldn't get saved posts. Not logged into reddit.");
    });
}

//sets up the view with categories buttons and default post category (all)
//should only be called at the start of the session or when adding/deleting a category
function initView(category) {
  if (posts.length == 0) {
    return;
  }

  document.getElementById('username').innerHTML = username;

  var folders = document.getElementById('folders');

  folders.innerHTML = '<div class="folder" id="all">All posts</div>';

  for (var i = 0; i < posts.length; i++) {
    if (!categories.includes(posts[i].category)) {
      posts[i].category = 'Uncategorized';
    }
  }

  for (var i = 0; i < categories.length; i++) {
    folders.appendChild(createCategoryElement(categories[i], categoryName => updateView(categoryName)));
  }

  document.getElementById('all').addEventListener('click', function() {
    updateView('All posts');
  });

  updateView(category);
}

function createCategoryElement(categoryName, onClick) {
  const html = `<div class="folder" id="${categoryName}">${categoryName}</div>`;

  const element = document.createElement('div');
  element.innerHTML = html;
  const categoryElement = element.firstChild;

  categoryElement.addEventListener('click', () => onClick(categoryName));

  return categoryElement;
}

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

function updateView(category) {
  lastClickedCategory = category;

  document.getElementById('categoryTitle').innerHTML = category;

  var deleteCategoryButton = document.getElementById('deleteCategory');
  if (category == 'All posts' || category == 'Uncategorized') {
    deleteCategoryButton.style.visibility = 'hidden';
  } else {
    deleteCategoryButton.style.visibility = 'visible';
    deleteCategoryButton.onclick = function() {
      deleteCategory(category);
    };
  }

  postContainer = document.getElementById('postContainer');
  postContainer.innerHTML = '';

  if (category == 'All posts') {
    for (const post of posts) {
      if (!post.title) continue;
      postContainer.appendChild(createPostElement(post));
    }
  } else {
    for (const post of posts) {
      if (!post.title) continue;
      if (post.category !== category) continue;
      postContainer.appendChild(createPostElement(post));
    }
  }

  refreshLastUpdated();

  stopLoading();
}

function deleteCategory(category) {
  document.getElementById('deletedCategory').innerHTML = category;
  document.getElementById('confirmDeletion').style.visibility = 'visible';
  document.getElementById('confirmDeletion').style.opacity = 1;
  document.getElementById('deny').addEventListener('click', function() {
    document.getElementById('confirmDeletion').style.visibility = 'hidden';
    document.getElementById('confirmDeletion').style.opacity = 0;
  });
  document.getElementById('confirm').addEventListener('click', function() {
    document.getElementById('confirmDeletion').style.visibility = 'hidden';
    document.getElementById('confirmDeletion').style.opacity = 0;
    deletionConfirmed(category);
  });
}

function deletionConfirmed(category) {
  //deletes category from categories array
  categories.splice(categories.indexOf(category), 1);

  //moves all posts from the deleted category to "Uncategorized"
  for (const post of posts) {
    if (post.category === category) {
      post.category = 'Uncategorized';
    }
  }

  storage.setCategories(categories);

  initView('All posts');
}

function editPostCategory(id) {
  var foldersMovePostMenu = document.getElementById('foldersMovePostMenu');

  foldersMovePostMenu.innerHTML = '';

  for (var i = 0; i < categories.length; i++) {
    foldersMovePostMenu.appendChild(createCategoryElement(categories[i], categoryName => movePost(id, categoryName)));
  }

  document.getElementById('closeMovePostMenu').addEventListener('click', function() {
    document.getElementById('movePostMenu').style.opacity = 0;
    document.getElementById('movePostMenu').style.visibility = 'hidden';
  });

  document.getElementById('movePostMenu').style.visibility = 'visible';
  document.getElementById('movePostMenu').style.opacity = 1;
}

function movePost(id, category) {
  const post = posts.find(p => p.id === id);
  if (post) {
    post.category = category;
  }

  updateView(lastClickedCategory);

  storage.setPosts(posts);

  document.getElementById('movePostMenu').style.opacity = 0;
  document.getElementById('movePostMenu').style.visibility = 'hidden';
}

function addFolder() {
  if (!$categoryInput.isVisible) {
    $categoryInput.show();
    return;
  }

  const value = $categoryInput.getValue();
  if (value.length == 0) {
    return;
  }

  if (!categories.includes(value)) {
    categories.push(value);
    storage.setCategories(categories);
  }

  initView(lastClickedCategory);

  $categoryInput.hide();
  $categoryInput.clear();
}

function openErrorMenu(message) {
  document.getElementById('errorMessage').innerHTML = message;
  document.getElementById('errorMenu').style.visibility = 'visible';
  document.getElementById('errorMenu').style.opacity = 1;
}

async function run() {
  initView('All posts');
  getSavedPostsFromFeed();
}

run().catch(err => {
  debugger;
  console.error('Something went wrong', err);
});
