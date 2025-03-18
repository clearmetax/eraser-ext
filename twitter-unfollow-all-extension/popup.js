document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const status = document.getElementById('status');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const totalAccounts = document.getElementById('totalAccounts');
  const unfollowedCount = document.getElementById('unfollowedCount');
  const timeElapsed = document.getElementById('timeElapsed');
  const warning = document.getElementById('warning');
  
  let startTime;
  let updateTimer;
  let syncTimer;
  let isFirstSync = true;

  function syncProgress() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) return;
      
      // First check storage
      chrome.storage.local.get(['isRunning', 'progress'], (result) => {
        if (result.isRunning && result.progress) {
          updateUI(result.progress);
        }
        
        // Then try to get live updates
        chrome.tabs.sendMessage(tab.id, { action: 'getProgress' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Connection failed:', chrome.runtime.lastError);
            // Check storage again for latest progress
            chrome.storage.local.get(['isRunning', 'progress'], (result) => {
              if (result.isRunning && result.progress) {
                updateUI(result.progress);
              } else if (isFirstSync) {
                resetUI();
              }
            });
            return;
          }

          isFirstSync = false;
          if (response && response.type === 'progress') {
            updateUI(response);
            // Save the latest progress
            chrome.storage.local.set({
              isRunning: true,
              progress: response
            });
          }
        });
      });
    });
  }

  function updateUI(progress) {
    if (!progress) return;
    
    startButton.style.display = 'none';
    stopButton.style.display = 'block';
    progressContainer.style.display = 'block';
    
    // Only update counts if they're higher than current values
    const currentTotal = parseInt(totalAccounts.textContent) || 0;
    const currentUnfollowed = parseInt(unfollowedCount.textContent) || 0;
    
    if (progress.totalFound > currentTotal) {
      totalAccounts.textContent = progress.totalFound;
    }
    if (progress.unfollowed > currentUnfollowed) {
      unfollowedCount.textContent = progress.unfollowed;
    }
    
    status.textContent = progress.status || 'Running...';
    warning.style.display = progress.rateLimited ? 'block' : 'none';
    
    if (progress.totalFound > 0) {
      const progressPercent = (progress.unfollowed / progress.totalFound) * 100;
      progressFill.style.width = `${progressPercent}%`;
    }

    if (progress.completed) {
      setTimeout(resetUI, 5000);
    }
  }

  // Load saved state and start syncing
  chrome.storage.local.get(['isRunning', 'progress'], (result) => {
    if (result.isRunning) {
      startButton.style.display = 'none';
      stopButton.style.display = 'block';
      progressContainer.style.display = 'block';
      
      if (result.progress) {
        totalAccounts.textContent = result.progress.totalFound || '0';
        unfollowedCount.textContent = result.progress.unfollowed || '0';
        status.textContent = result.progress.status || 'Running...';
        warning.style.display = result.progress.rateLimited ? 'block' : 'none';
        
        if (result.progress.totalFound > 0) {
          const progress = (result.progress.unfollowed / result.progress.totalFound) * 100;
          progressFill.style.width = `${progress}%`;
        }
        
        startTime = result.progress.startTime || Date.now();
        updateTimer = setInterval(updateElapsedTime, 1000);
      }
      
      // Start syncing progress
      syncTimer = setInterval(syncProgress, 1000);
      // Immediate first sync
      syncProgress();
    }
  });

  function updateElapsedTime() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timeElapsed.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function resetUI() {
    startButton.style.display = 'block';
    stopButton.style.display = 'none';
    startButton.disabled = false;
    status.textContent = 'Click to begin...';
    progressContainer.style.display = 'none';
    progressFill.style.width = '0%';
    totalAccounts.textContent = '0';
    unfollowedCount.textContent = '0';
    timeElapsed.textContent = '0:00';
    warning.style.display = 'none';
    if (updateTimer) clearInterval(updateTimer);
    if (syncTimer) clearInterval(syncTimer);
    chrome.storage.local.remove(['isRunning', 'progress']);
  }

  function isValidTwitterUrl(url) {
    try {
      const urlObj = new URL(url);
      const isTwitterDomain = urlObj.hostname === 'twitter.com' || 
                            urlObj.hostname === 'x.com' || 
                            urlObj.hostname === 'www.twitter.com' || 
                            urlObj.hostname === 'www.x.com';
      
      if (!isTwitterDomain) return false;
      
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      // Valid if we have a username and optionally /following
      return pathParts.length >= 1 && 
             (pathParts.length === 1 || 
              (pathParts.length === 2 && pathParts[1] === 'following'));
    } catch {
      return false;
    }
  }

  stopButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      chrome.tabs.sendMessage(tab.id, { action: 'stop' });
      resetUI();
    });
  });

  startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    stopButton.style.display = 'block';
    startButton.disabled = true;
    status.textContent = 'Starting...';
    progressContainer.style.display = 'block';
    startTime = Date.now();
    updateTimer = setInterval(updateElapsedTime, 1000);
    isFirstSync = true;

    chrome.storage.local.set({
      isRunning: true,
      progress: {
        startTime: startTime,
        status: 'Starting...',
        totalFound: 0,
        unfollowed: 0
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab.url || !isValidTwitterUrl(tab.url)) {
        status.textContent = 'Please navigate to a Twitter/X profile or following page!';
        resetUI();
        return;
      }

      try {
        // First inject the unfollow.js script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['unfollow.js']
        });

        // Then execute the unfollowAll function
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (typeof unfollowAll === 'function') {
              unfollowAll();
            } else {
              throw new Error('unfollowAll function not found!');
            }
          }
        });

        // Start syncing progress
        syncTimer = setInterval(syncProgress, 1000);
        // Immediate first sync
        syncProgress();
      } catch (error) {
        console.error('Script injection error:', error);
        status.textContent = 'Error starting unfollow process. Please refresh and try again.';
        resetUI();
      }
    });
  });
});