// Local storages:
// username           : the user's reddit username
// posts              : all user's saved posts
// categorizedPosts   : all user's saved posts categorized by themselves
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
var categorizedPosts = storage.getCategorizedPosts();
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

  posts = [];

  reddit
    .getSavedPosts()
    .then(data => {
      posts = data.posts;

      username = data.user;
      localStorage.setItem('username', data.user);
      storage.setPosts(posts);

      updateCategorized();
    })
    .catch(err => {
      openErrorMenu("Couldn't get saved posts. Not logged into reddit.");
    });
}

function updateCategorized() {
  let tempJSON = [];

  //checks if there is any previously saved and categorized posts, that have now been unsaved
  for (var i = 0; i < categorizedPosts.length; i++) {
    const postFound = !!posts.find(p => p.id === categorizedPosts[i].id);

    //adds all matching posts to a temporary array, that will be assigned to categorizedPosts
    if (postFound) {
      tempJSON[i] = categorizedPosts[i];
    }
  }

  categorizedPosts = tempJSON;

  //checks if there is any new saved posts that have not yet been categorized
  for (var i = 0; i < posts.length; i++) {
    var postFound = !!categorizedPosts.find(c => c.id === posts[i].id);
    if (!postFound) {
      var k = categorizedPosts.length;
      categorizedPosts[k] = posts[i];
      categorizedPosts[k].category = 'Uncategorized';
    }
  }

  storage.setCategorizedPosts(categorizedPosts);

  initView(lastClickedCategory);
}

//sets up the view with categories buttons and default post category (all)
//should only be called at the start of the session or when adding/deleting a category
function initView(category) {
  if (categorizedPosts.length == 0) {
    return;
  }

  document.getElementById('username').innerHTML = username;

  var folders = document.getElementById('folders');

  folders.innerHTML = '<div class="folder" id="all">All posts</div>';

  for (var i = 0; i < categorizedPosts.length; i++) {
    if (!categories.includes(categorizedPosts[i].category)) {
      categorizedPosts[i].category = 'Uncategorized';
    }
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];

    folders.innerHTML = folders.innerHTML + '<div class="folder" id="' + s + '">' + s + '</div>';
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];

    document.getElementById(s).addEventListener('click', function() {
      updateView(this.id);
    });
  }

  document.getElementById('all').addEventListener('click', function() {
    updateView('All posts');
  });

  updateView(category);
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
    editPostCategory(this.id.replace('button', ''));
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
    for (var i = 0; i < categorizedPosts.length; i++) {
      if (!categorizedPosts[i].title) continue;
      postContainer.appendChild(createPostElement(categorizedPosts[i]));
    }
  } else {
    for (var i = 0; i < categorizedPosts.length; i++) {
      if (!categorizedPosts[i].title) continue;
      if (categorizedPosts[i].category !== category) continue;
      postContainer.appendChild(createPostElement(categorizedPosts[i]));
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
  for (var i = 0; i < categories.length; i++) {
    if (categories[i] == category) {
      categories.splice(i, 1);
    }
  }

  //moves all posts from the deleted category to "Uncategorized"
  for (var i = 0; i < categorizedPosts.length; i++) {
    if (categorizedPosts[i].category == category) {
      categorizedPosts[i].category = 'Uncategorized';
    }
  }

  storage.setCategories(categories);

  initView('All posts');
}

function editPostCategory(id) {
  var foldersMovePostMenu = document.getElementById('foldersMovePostMenu');

  foldersMovePostMenu.innerHTML = '';

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];
    foldersMovePostMenu.innerHTML =
      foldersMovePostMenu.innerHTML + '<div class="folder" id="' + s + 'move">' + s + '</div>';
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];
    document.getElementById(s + 'move').addEventListener('click', function() {
      movePost(id, this.id.replace('move', ''));
    });
  }

  document.getElementById('closeMovePostMenu').addEventListener('click', function() {
    document.getElementById('movePostMenu').style.opacity = 0;
    document.getElementById('movePostMenu').style.visibility = 'hidden';
  });

  document.getElementById('movePostMenu').style.visibility = 'visible';
  document.getElementById('movePostMenu').style.opacity = 1;
}

function movePost(id, category) {
  for (var i = 0; i < categorizedPosts.length; i++) {
    if (categorizedPosts[i].id == id) {
      categorizedPosts[i].category = category;
    }
  }

  updateView(lastClickedCategory);

  storage.setCategorizedPosts(categorizedPosts);

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
  console.error('Something went wrong', err);
});
