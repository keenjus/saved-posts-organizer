import queryString from "query-string";

class Reddit {
  getRedditFeed(key) {
    return fetch(`https://www.reddit.com/saved.json?feed=${key}`).then((res) => res.json());
  }

  async getUserAndFeedKey() {
    const feedHtml = await fetch('https://www.reddit.com/prefs/feeds').then((res) => res.text());

    const parser = new DOMParser();
    const wrapper = parser.parseFromString(feedHtml, 'text/html');

    const jsonFeedLinks = wrapper.querySelectorAll("a.feedlink.json-link");

    let savedPostsLink = null;
    jsonFeedLinks.forEach(elem => {
      if(elem.href.indexOf("saved.json") === -1 || savedPostsLink) return;
      savedPostsLink = elem.href;
    });

    if(!savedPostsLink) {
      throw new Error("Could not find saved posts json feed");
    }

    return queryString.parseUrl(savedPostsLink).query;
  }

  async getSavedPosts() {
    const userAndKey = await this.getUserAndFeedKey();
    const savedPostsFeed = await this.getRedditFeed(userAndKey.feed);

    const content = savedPostsFeed.data.children;

    const posts = [];
    for (var i = 0; i < content.length; i++) {
      //adds every fetched saved post to posts.
      //traverses from bottom up, but saves first elements last. That is because,
      //the most recent saved post is the first element in the JSON, and we want it to be last
      //so we easier can push most recent post to the end of the lists
      const post = {
        title: content[i].data.title,
        permalink: content[i].data.permalink,
        id: content[i].data.id,
      };
      posts.push(post);
    }

    return { user: userAndKey.user, posts };
  }
}

export default new Reddit();