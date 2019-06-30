class UserStorage {
  constructor(username) {
    this.username = username;
  }

  getPosts() {
    const posts = localStorage.getItem(this.wrapKey('posts'));
    if (!posts) return [];

    return JSON.parse(posts);
  }
  setPosts(posts) {
    localStorage.setItem(this.wrapKey('posts'), JSON.stringify(posts || []));
  }

  getCategorizedPosts() {
    const categorizedPosts = localStorage.getItem(this.wrapKey('categorizedPosts'));
    if (!categorizedPosts) return [];

    return JSON.parse(categorizedPosts);
  }
  setCategorizedPosts(categorizedPosts) {
    localStorage.setItem(this.wrapKey('categorizedPosts'), JSON.stringify(categorizedPosts || []));
    localStorage.setItem(this.wrapKey('lastUpdated'), new Date());
  }

  getCategories() {
    const categories = localStorage.getItem(this.wrapKey('categories'));

    if (!categories) {
      const defaultCategories = ['Uncategorized'];
      this.setCategories(defaultCategories);
      return defaultCategories;
    }

    return JSON.parse(categories);
  }
  setCategories(categories) {
    localStorage.setItem(this.wrapKey('categories'), JSON.stringify(categories || []));
  }

  lastUpdated() {
    return new Date(localStorage.getItem(this.wrapKey('lastUpdated')));
  }

  wrapKey(key) {
    return `${key}_${this.username}`;
  }
}

export default UserStorage;
