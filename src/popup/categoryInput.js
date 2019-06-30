export default class CategoryInput {
  constructor(selector) {
    this.$categoryInput = document.querySelector(selector);
    this.registerListeners();

    this.isVisible = false;
  }

  show() {
    if (this.isVisible) return;

    this.$categoryInput.style.opacity = 1;
    this.$categoryInput.style.width = '260px';

    setTimeout(() => {
      this.$categoryInput.focus();
      this.isVisible = true;
    }, 500);
  }

  hide() {
    if (!this.isVisible) return;

    this.$categoryInput.style.width = '0px';

    setTimeout(() => {
      this.$categoryInput.style.opacity = 0;
      this.isVisible = false;
    }, 500);
  }

  clear() {
    this.$categoryInput.value = '';
  }

  getValue() {
    return this.$categoryInput.value;
  }

  registerListeners() {
    this.$categoryInput.addEventListener('focusout', () => this.hide());

    this.$categoryInput.addEventListener('keyup', event => {
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode !== 13) return;
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      document.getElementById('addFolder').click();
    });
  }
}
