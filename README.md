# eraser-ext
A Chrome browser extension to unfollow all accounts on Twitter/X with one click.

## Features
- Simple popup interface
- Automatically loads all followed accounts
- Unfollows with random delays to avoid rate limits
- Logs progress in the console

## Installation
1. **Clone or Download**: Get this repository from GitHub.
2. **Load in Chrome**:
   - Open Chrome, go to `chrome://extensions/`.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked" and select the `twitter-unfollow-all-extension` folder.
3. **Add Icons**: Place `icon16.png`, `icon48.png`, and `icon128.png` in the folder (create placeholders if needed).

## Usage
1. **Open Twitter**: Navigate to your Twitter/X profile (`https://x.com/yourusername`).
2. **Click Extension**: Click the extension icon in your toolbar, then "Start Unfollowing".
3. **Monitor**: Check the console (`Ctrl + Shift + J`) for progress logs.

## Notes
- **Permissions**: Requires `activeTab` and `scripting` to run on the active Twitter tab.
- **Rate Limits**: Adjust delays in `unfollow.js` if Twitter blocks rapid unfollows.
- **UI Changes**: Update selectors in `unfollow.js` if Twitter’s interface changes.

## Files
- `manifest.json`: Extension configuration
- `popup.html`: User interface
- `popup.js`: Popup logic
- `unfollow.js`: Core unfollow script

## Contributing
Fork, submit issues, or send pull requests with enhancements!

## License
MIT License - see [LICENSE](LICENSE).

## Disclaimer
Use at your own risk. Mass unfollowing may violate Twitter’s terms of service.
