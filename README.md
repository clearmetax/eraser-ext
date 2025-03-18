# Twitter Unfollow All Extension

A sleek Chrome extension to unfollow Twitter/X accounts with intelligent batch processing and real-time progress tracking.


## 🌟 Features

### Smart Processing
- **Batch Processing**: Unfollows accounts in sets of 25 for optimal performance
- **Intelligent Loading**: Dynamically loads accounts as needed
- **Rate Limit Protection**: Built-in delays and automatic pausing
- **State Persistence**: Maintains progress even when popup is closed

###Real-time Updates
  - Live progress tracking
  - Batch status display
  - Time elapsed counter
  - Rate limit warnings

### 💡 Smart Features
- **Flexible Usage**: Works from both profile and following pages
- **Progress Tracking**:
  - Persistent progress bar
  - Account counters
  - Time tracking
  - Status updates
- **Batch Management**:
  - Processes 25 accounts at a time
  - Smart scroll detection
  - Automatic next batch loading
- **Reliability**:
  - Automatic retry mechanism
  - Error recovery system
  - Rate limit detection
  - Progress persistence

## 🚀 Installation
1. **Download**: Clone or download this repository
2. **Load Extension**:
   - Open Chrome
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the extension folder
3. **Icons**: Ensure `icon16.png`, `icon48.png`, and `icon128.png` are present

## 🎯 Usage
1. **Navigate**: Go to either:
   - Your Twitter/X profile (`twitter.com/yourusername` or `x.com/yourusername`)
   - Your following page (`twitter.com/yourusername/following` or `x.com/yourusername/following`)
2. **Start**: Click the extension icon and press "Start Unfollowing"
3. **Monitor**: Track progress in real-time:
   - Current batch status
   - Total accounts found
   - Accounts unfollowed
   - Time elapsed
   - Rate limit warnings
4. **Control**: 
   - Stop anytime with the stop button
   - Progress saves automatically
   - Resume from where you left off

## ⚙️ Technical Details
- **Batch Processing**:
  - 25 accounts per batch
  - Dynamic loading between batches
  - Smart scroll management
- **State Management**:
  - Chrome storage API for persistence
  - Real-time sync with content script
  - Automatic progress recovery
- **Rate Limiting Protection**:
  - Random delays (3-5 seconds between actions)
  - Automatic 5-minute pause on rate limits
  - Consecutive error tracking
- **Error Handling**:
  - Automatic retries
  - Graceful error recovery
  - Clear error messages
  - Progress preservation

## 🔧 Troubleshooting
- **Progress Not Updating**: Close and reopen the extension popup
- **Rate Limited**: Extension will pause automatically for 5 minutes
- **Stops Early**: Check for Twitter UI changes or try refreshing
- **Not Starting**: Ensure you're on a Twitter/X profile or following page

## 🤝 Contributing
Contributions welcome! Feel free to:
- Submit issues
- Create pull requests
- Suggest improvements
- Report bugs

## 📜 License
MIT License - see [LICENSE](LICENSE)

## ⚠️ Disclaimer
- Use responsibly and at your own risk
- Respects Twitter's rate limits
- Not affiliated with Twitter/X
- May need updates if Twitter's UI changes
