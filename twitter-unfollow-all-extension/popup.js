document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const status = document.getElementById('status');

  startButton.addEventListener('click', () => {
    startButton.disabled = true;
    status.textContent = 'Starting...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab.url.includes('x.com')) {
        status.textContent = 'Please navigate to x.com first!';
        startButton.disabled = false;
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          if (typeof unfollowAll === 'function') {
            unfollowAll();
          } else {
            console.error('unfollowAll function not found!');
          }
        }
      }, () => {
        status.textContent = 'Running... Check console for progress.';
      });
    });
  });
});