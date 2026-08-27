import { browser } from 'wxt/browser';

export default defineBackground(() => {
  browser.action.onClicked.addListener(() => browser.runtime.openOptionsPage());
});
