// unfollow.js
// Core script for unfollowing all Twitter/X accounts

function unfollowAll() {
  let totalFound = 0;
  let unfollowedCount = 0;
  let shouldStop = false;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 3;
  let rateLimitPause = false;
  const BATCH_SIZE = 25;

  // Listen for stop messages and progress requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'stop') {
      shouldStop = true;
      updateProgress('Stopping...', true);
    } else if (message.action === 'getProgress') {
      // Send current progress back to popup
      const progress = {
        type: 'progress',
        totalFound,
        unfollowed: unfollowedCount,
        status: rateLimitPause ? 'Rate limit detected. Waiting...' : 'Running...',
        rateLimited: rateLimitPause
      };
      sendResponse(progress);
      return true; // Required for async response
    }
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    if (!shouldStop) {
      updateProgress('Process interrupted - page closed', true);
    }
  });

  // Send progress updates to popup
  function updateProgress(status, completed = false, rateLimited = false) {
    const progress = {
      type: 'progress',
      totalFound,
      unfollowed: unfollowedCount,
      status,
      completed,
      rateLimited
    };

    // Save to storage first
    chrome.storage.local.set({
      progress,
      isRunning: !completed
    });

    // Then try to send message
    try {
      chrome.runtime.sendMessage(progress, (response) => {
        if (chrome.runtime.lastError) {
          // Ignore connection errors - popup might be closed
          console.log('Could not send progress update - popup might be closed');
        }
      });
    } catch (error) {
      // Ignore connection errors - popup might be closed
      console.log('Could not send progress update - popup might be closed');
    }
  }

  // Wait for an element to appear with timeout
  const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) resolve(element);
        else if (Date.now() - startTime > timeout) reject(new Error(`Timeout waiting for ${selector}`));
        else if (shouldStop) reject(new Error('Process stopped by user'));
        else setTimeout(checkElement, 100);
      };
      checkElement();
    });
  };

  // Delay function with random jitter
  const delay = (ms) => new Promise(resolve => {
    const timeout = setTimeout(resolve, ms + (Math.random() * 500));
    if (shouldStop) clearTimeout(timeout);
  });

  // Handle rate limiting
  async function handleRateLimit() {
    rateLimitPause = true;
    updateProgress('Rate limit detected. Waiting 5 minutes...', false, true);
    await delay(300000); // 5 minute delay
    consecutiveErrors = 0;
    rateLimitPause = false;
  }

  // Scroll to element function
  const scrollToElement = (element) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return delay(500);
  };

  // Extract username from current URL
  function getCurrentUsername() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(part => part);
    return parts[0];
  }

  // Check if we're on a valid profile or following page
  function isValidPage() {
    const path = window.location.pathname;
    const username = getCurrentUsername();
    return username && (path.endsWith('/following') || path === `/${username}`);
  }

  // Navigate to following page if needed
  async function ensureFollowingPage() {
    if (!window.location.pathname.endsWith('/following')) {
      const username = getCurrentUsername();
      if (!username) {
        throw new Error('Could not determine username from URL');
      }
      updateProgress('Navigating to following page...');
      window.location.href = `${window.location.origin}/${username}/following`;
      await delay(3000); // Wait for navigation
      return true; // Page was changed
    }
    return false; // Already on following page
  }

  // Process a batch of accounts
  async function processBatch() {
    const allButtons = document.querySelectorAll('[data-testid="UserCell"] button[role="button"]');
    console.log(`Processing batch: found ${allButtons.length} buttons, unfollowed ${unfollowedCount} so far`);
    
    // Calculate which accounts to process in this batch
    const remainingButtons = Array.from(allButtons).slice(unfollowedCount);
    const batchButtons = remainingButtons.slice(0, BATCH_SIZE);
    
    if (batchButtons.length === 0) {
      console.log('No more buttons to process in this batch');
      return false;
    }

    console.log(`Processing ${batchButtons.length} accounts in this batch`);
    updateProgress(`Processing accounts ${unfollowedCount + 1} to ${unfollowedCount + batchButtons.length}...`);

    for (const button of batchButtons) {
      if (shouldStop) {
        updateProgress('Process stopped by user', true);
        return false;
      }

      if (rateLimitPause) {
        await handleRateLimit();
      }

      if (button.textContent.includes('Following')) {
        try {
          await scrollToElement(button);
          let unfollowSuccess = false;
          let attempts = 0;
          const maxAttempts = 3;

          while (!unfollowSuccess && attempts < maxAttempts) {
            try {
              console.log(`Attempt ${attempts + 1} to unfollow account...`);
              button.click();
              await delay(1000);

              // Look for confirmation dialog
              const confirmButton = await waitForElement('[data-testid="confirmationSheetConfirm"]', 3000);
              if (confirmButton) {
                console.log('Found confirmation button, clicking...');
                await delay(300);
                confirmButton.click();
                
                // Wait for the "Following" button to change state
                await delay(1500);
                if (!button.textContent.includes('Following')) {
                  unfollowSuccess = true;
                  console.log('Unfollow successful');
                  break;
                }
              }
            } catch (error) {
              console.log(`Attempt ${attempts + 1} failed:`, error.message);
              attempts++;
              if (attempts >= maxAttempts) {
                throw new Error('Max attempts reached for this account');
              }
              await delay(1500);
            }
          }

          if (unfollowSuccess) {
            unfollowedCount++;
            consecutiveErrors = 0;
            
            // Save progress to storage first
            const progress = {
              totalFound,
              unfollowed: unfollowedCount,
              status: 'Running...',
              completed: false
            };
            
            try {
              await chrome.storage.local.set({
                progress,
                isRunning: true
              });
            } catch (error) {
              console.log('Failed to save progress to storage:', error);
            }

            // Then try to update popup
            try {
              updateProgress(`Unfollowed ${unfollowedCount} of ${totalFound} accounts...`);
            } catch (error) {
              console.log('Failed to update popup (might be closed):', error);
            }

            await delay(3000 + Math.random() * 2000);
          } else {
            console.log('Failed to unfollow after all attempts, skipping account');
            consecutiveErrors++;
          }
          
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            await handleRateLimit();
          }
        } catch (error) {
          console.log('Error unfollowing:', error);
          consecutiveErrors++;
          
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            await handleRateLimit();
          } else {
            await delay(5000);
          }
          continue;
        }
      }
    }

    // Return true if we still have more accounts to process
    const remainingAccounts = totalFound - unfollowedCount;
    console.log(`Batch complete. ${remainingAccounts} accounts remaining`);
    return remainingAccounts > 0;
  }

  // Load next batch of accounts
  async function loadNextBatch() {
    return new Promise(async (resolve) => {
      console.log('Loading next batch of accounts...');
      updateProgress('Loading more accounts...');
      
      let lastHeight = 0;
      let unchangedCount = 0;
      const maxUnchanged = 5;
      let currentCells = document.querySelectorAll('[data-testid="UserCell"]').length;
      let startingCount = currentCells;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (unchangedCount < maxUnchanged && !shouldStop && retryCount < maxRetries) {
        window.scrollTo(0, document.body.scrollHeight);
        await delay(1500);
        
        if (shouldStop) break;
        
        const newCells = document.querySelectorAll('[data-testid="UserCell"]').length;
        console.log(`Found ${newCells} cells (was ${currentCells})`);
        
        if (newCells === 0) {
          console.log('No cells found, retrying...');
          retryCount++;
          await delay(2000);
          continue;
        }
        
        // Check if we've loaded enough new accounts
        if (newCells > startingCount + BATCH_SIZE) {
          console.log('Loaded enough new accounts');
          break;
        }
        
        if (newCells > currentCells) {
          unchangedCount = 0;
          currentCells = newCells;
          retryCount = 0; // Reset retry count on successful load
        } else {
          unchangedCount++;
        }
        
        const newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight) {
          unchangedCount++;
        }
        lastHeight = newHeight;
      }
      
      const cells = document.querySelectorAll('[data-testid="UserCell"]');
      if (cells.length === 0 && retryCount >= maxRetries) {
        console.log('Failed to load any accounts after multiple retries');
        updateProgress('Error: Failed to load accounts. Please refresh and try again.', true);
        resolve(false);
        return;
      }
      
      totalFound = Math.max(totalFound, cells.length);
      console.log(`Loaded ${totalFound} total accounts (${cells.length} visible)`);
      resolve(true);
    });
  }

  (async () => {
    try {
      // Validate current page
      if (!isValidPage()) {
        updateProgress('Please navigate to a Twitter/X profile or following page.', true);
        return;
      }

      // Ensure we're on the following page
      const didNavigate = await ensureFollowingPage();
      if (didNavigate) {
        // Wait for page to load after navigation
        try {
          await waitForElement('[data-testid="UserCell"]', 10000);
        } catch (error) {
          updateProgress('Error: Could not load following page. Please refresh and try again.', true);
          return;
        }
      }

      if (shouldStop) {
        updateProgress('Process stopped by user', true);
        return;
      }

      // Initial load
      await loadNextBatch();
      
      if (shouldStop) {
        updateProgress('Process stopped by user', true);
        return;
      }

      // Get initial count
      const initialButtons = document.querySelectorAll('[data-testid="UserCell"] button[role="button"]');
      if (initialButtons.length === 0) {
        updateProgress('No accounts found to unfollow. Please check if you\'re on the right page.', true);
        return;
      }

      console.log(`Starting with ${initialButtons.length} accounts`);
      updateProgress(`Found ${initialButtons.length} accounts to process in batches...`);

      // Process in batches
      let hasMore = true;
      while (hasMore && !shouldStop) {
        hasMore = await processBatch();
        if (hasMore && !shouldStop) {
          await loadNextBatch();
        }
      }

      const finalMessage = `Finished! Successfully unfollowed ${unfollowedCount} accounts.`;
      console.log(finalMessage);
      updateProgress(finalMessage, true);
    } catch (error) {
      console.error('Script failed:', error);
      updateProgress(`Error: ${error.message}. Check console for details.`, true);
    }
  })();
}

// Make function available globally for popup.js to call
window.unfollowAll = unfollowAll;