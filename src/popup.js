// Local storages:
// username           : the user's reddit username
// posts              : all user's saved posts
// categorizedPosts   : all user's saved posts categorized by themselves
// categories         : the user's custom categories

var username = localStorage.getItem('username');

var posts = {}
var categorizedPosts = {}
var categories;
var lastClickedCategory = "All posts";
var inputVisible = false;

if (localStorage.getItem('posts' + username) != null) {
  posts = JSON.parse(localStorage.getItem('posts' + username));
}

if (localStorage.getItem('categorizedPosts' + username) != null) {
  categorizedPosts = JSON.parse(localStorage.getItem('categorizedPosts' + username));
}

if (localStorage.getItem('categories' + username) != null) {
  categories = JSON.parse(localStorage.getItem('categories' + username));
} else {
  categories = ["Uncategorized"];
  localStorage.setItem('categories' + username, JSON.stringify(categories));
}

document.getElementById("sync").addEventListener("click", getSavedPostsFromFeed);
document.getElementById("addFolder").addEventListener("click", addFolder);

function getRedditFeed(key) {
  return fetch(`https://www.reddit.com/saved.json?feed=${key}`)
    .then((res) => res.json())
    .catch((error) => {
      openErrorMenu("Couldn't get saved posts. Not logged into reddit.")
    });
}

function getSavedPostsFromFeed() {
  var user;

  document.getElementById('sync').classList.add("spin");

  posts = {}

  fetch('https://www.reddit.com/prefs/feeds')
    .then((res) => res.text())
    .then((data) => {
      var from = data.search('user=') + 5;
      var to = data.search('">RSS');
      user = data.substring(from, to);

      from = data.search('feed=') + 5;
      to = data.search('&amp;user=');
      var key = data.substring(from, to);
      return key;
    })
    .then((key) => getRedditFeed(key))
    .then((data) => {
      var content = data.data.children;

      for (var i = 0; i < content.length; i++) {
        //adds every fetched saved post to posts.
        //traverses from bottom up, but saves first elements last. That is because,
        //the most recent saved post is the first element in the JSON, and we want it to be last
        //so we easier can push most recent post to the end of the lists
        var ir = content.length - 1 - i;
        posts[ir] = {}
        posts[ir].title = content[i].data.title;
        posts[ir].permalink = content[i].data.permalink;
        posts[ir].id = content[i].data.id;
      }

      localStorage.setItem('username', user);

      username = localStorage.getItem('username');

      localStorage.setItem('posts' + username, JSON.stringify(posts));

      getFromMemory();
    });
}

function getFromMemory() {
  if (localStorage.getItem('posts' + username) != null) {
    posts = JSON.parse(localStorage.getItem('posts' + username));
  }

  if (localStorage.getItem('categorizedPosts' + username) != null) {
    categorizedPosts = JSON.parse(localStorage.getItem('categorizedPosts' + username));
  }

  if (localStorage.getItem('categories' + username) != null) {
    categories = JSON.parse(localStorage.getItem('categories' + username));
  } else {
    categories = ["Uncategorized"];
    localStorage.setItem('categories' + username, JSON.stringify(categories));
  }

  updateCategorized();
}

function updateCategorized() {
  tempJSON = {}

  //checks if there is any previously saved and categorized posts, that have now been unsaved
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    var postFound = false;

    for (var j = 0; j < Object.keys(posts).length; j++) {
      if (posts[j]['title'] == categorizedPosts[i]['title']) {
        var postFound = true;
        break;
      } else {
        continue;
      }
    }

    if (postFound) { //adds all matching posts to a temporary array, that will be assigned to categorizedPosts
      tempJSON[i] = categorizedPosts[i];
    }

  }

  categorizedPosts = tempJSON;

  //checks if there is any new saved posts that have not yet been categorized
  for (var i = 0; i < Object.keys(posts).length; i++) {
    var postFound = false;

    for (var j = 0; j < Object.keys(categorizedPosts).length; j++) {
      if (categorizedPosts[j] == undefined) {
        break;
      }
      if (categorizedPosts[j]['title'] == posts[i]['title']) {
        postFound = true;
        break;
      } else {
        continue;
      }
    }

    if (!postFound) {
      var k = Object.keys(categorizedPosts).length;
      categorizedPosts[k] = posts[i];
      categorizedPosts[k].category = 'Uncategorized';
    }


  }

  localStorage.setItem('categorizedPosts' + username, JSON.stringify(categorizedPosts));

  localStorage.setItem('lastUpdated' + username, new Date());

  initView(lastClickedCategory);
}

//sets up the view with categories buttons and default post category (all)
//should only be called at the start of the session or when adding/deleting a category
function initView(category) {
  if (Object.keys(categorizedPosts).length == 0) {
    return;
  }

  document.getElementById('username').innerHTML = username;

  var folders = document.getElementById('folders');

  folders.innerHTML = '<div class="folder" id="all">All posts</div>';

  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (!categories.includes(categorizedPosts[i].category)) {
      categorizedPosts[i].category = "Uncategorized";
    }
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];

    folders.innerHTML = folders.innerHTML + '<div class="folder" id="' + s + '">' + s + '</div>';
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];

    document.getElementById(s).addEventListener("click", function () {
      updateView(this.id);
    });
  }


  document.getElementById("all").addEventListener("click", function () {
    updateView("All posts");
  });

  updateView(category);

}

function getPostTitle(post) {
  return post.link_title || post.title || "";
}

function createPostElement(post) {
  const id = post.id;
  const title = getPostTitle(post).replace(/"/g, "'");
  const permalink = post.permalink;

  return `<div class="row editPost"><i title="Move post" class="fas fa-edit" id="${id}button"></i><div class="post ${title ? "" : "untitled"}" id="${id}" data-link="${permalink}">${title || "untitled"}</div></div>`;
}

function updateView(category) {
  lastClickedCategory = category;

  document.getElementById('categoryTitle').innerHTML = category;

  var deleteCategoryButton = document.getElementById('deleteCategory');
  if (category == "All posts" || category == "Uncategorized") {
    deleteCategoryButton.style.visibility = "hidden";
  } else {
    deleteCategoryButton.style.visibility = "visible";
    deleteCategoryButton.onclick = function () {
      deleteCategory(category);
    }
  }

  postContainer = document.getElementById('postContainer');
  postContainer.innerHTML = "";

  if (category == "All posts") {
    //adds posts to DOM
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      postContainer.innerHTML += createPostElement(categorizedPosts[i]);
    }

    //adds onclick listeners to posts
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      var s = categorizedPosts[i].id;
      document.getElementById(categorizedPosts[i].id).addEventListener("click", function () {
        var href = "http://reddit.com" + this.dataset.link;
        chrome.tabs.create({ active: true, url: href });
      });
    }

    //adds onclick listeners to editpost-buttons
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      document.getElementById(categorizedPosts[i].id + "button").addEventListener("click", function () {
        editPostCategory(this.id.replace("button", ""));
      });
    }

  } else {

    //adds posts to DOM
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      if (categorizedPosts[i].category == category) {
        postContainer.innerHTML += createPostElement(categorizedPosts[i]);
      }
    }

    //adds onclick listeners to posts
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      if (categorizedPosts[i].category == category) {
        document.getElementById(categorizedPosts[i].id).addEventListener("click", function () {
          var href = "http://reddit.com" + this.dataset.link;
          chrome.tabs.create({ active: true, url: href });
        });
      }
    }

    //adds onclick listeners to editpost-buttons
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      if (categorizedPosts[i].category == category) {
        document.getElementById(categorizedPosts[i].id + "button").addEventListener("click", function () {
          editPostCategory(this.id.replace("button", ""));
        });

      }
    }

  }

  d = new Date(localStorage.getItem('lastUpdated' + username));
  var minutes = d.getMinutes();
  var hours = d.getHours();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (hours < 10) {
    hours = "0" + hours;
  }
  document.getElementById('lastUpdated').innerHTML = d.getDate() + "/" + (d.getMonth() + 1) + " - " + hours + ":" + minutes;

  document.getElementById('sync').classList.remove("spin");

}


function deleteCategory(category) {
  document.getElementById('deletedCategory').innerHTML = category;
  document.getElementById('confirmDeletion').style.visibility = "visible";
  document.getElementById('confirmDeletion').style.opacity = 1;
  document.getElementById("deny").addEventListener("click", function () {
    document.getElementById('confirmDeletion').style.visibility = "hidden";
    document.getElementById('confirmDeletion').style.opacity = 0;
  });
  document.getElementById("confirm").addEventListener("click", function () {
    document.getElementById('confirmDeletion').style.visibility = "hidden";
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
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (categorizedPosts[i].category == category) {
      categorizedPosts[i].category = "Uncategorized";
    }
  }

  localStorage.setItem('categories' + username, JSON.stringify(categories));

  initView("All posts");
}

function editPostCategory(id) {
  var foldersMovePostMenu = document.getElementById('foldersMovePostMenu');

  foldersMovePostMenu.innerHTML = "";

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];
    foldersMovePostMenu.innerHTML = foldersMovePostMenu.innerHTML + '<div class="folder" id="' + s + 'move">' + s + '</div>';
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];
    document.getElementById(s + "move").addEventListener("click", function () {
      movePost(id, this.id.replace("move", ""));
    });
  }

  document.getElementById('closeMovePostMenu').addEventListener("click", function () {
    document.getElementById('movePostMenu').style.opacity = 0;
    document.getElementById('movePostMenu').style.visibility = "hidden";
  });

  document.getElementById('movePostMenu').style.visibility = "visible";
  document.getElementById('movePostMenu').style.opacity = 1;
}

function movePost(id, category) {
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (categorizedPosts[i].id == id) {
      categorizedPosts[i].category = category;
    }
  }

  updateView(lastClickedCategory);

  localStorage.setItem('categorizedPosts' + username, JSON.stringify(categorizedPosts));

  document.getElementById('movePostMenu').style.opacity = 0;
  document.getElementById('movePostMenu').style.visibility = "hidden";

}

function addFolder() {
  if (!inputVisible) {
    input.style.opacity = 1;
    input.style.width = "260px";
    setTimeout(function () {
      input.focus();
      inputVisible = true;
    }, 500);
  } else {
    if (input.value.length == 0) {
      return;
    }
    if (!categories.includes(input.value)) {
      categories.push(input.value);
      localStorage.setItem('categories' + username, JSON.stringify(categories));
    }
    initView(lastClickedCategory);
    input.style.width = "0px";
    setTimeout(function () {
      input.style.opacity = 0;
      input.value = "";
      inputVisible = false;
    }, 500);
  }
}

input = document.getElementById('input');

$("input").focusout(function () {
  if (inputVisible) {
    input.style.width = "0px";
    setTimeout(function () {
      input.style.opacity = 0;
      inputVisible = false;
    }, 500);
  }
});

input.addEventListener("keyup", function (event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("addFolder").click();
  }
});

function openErrorMenu(message) {
  document.getElementById('errorMessage').innerHTML = message;
  document.getElementById('errorMenu').style.visibility = "visible";
  document.getElementById('errorMenu').style.opacity = 1;
}

initView("All posts");
getSavedPostsFromFeed();
