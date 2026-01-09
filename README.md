# 🎮 X Controller

<div align="center">

**Control X/Twitter with an Xbox controller**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange)](https://developer.chrome.com/docs/extensions/mv3/intro)

Navigate, scroll, and interact with tweets without touching your mouse or keyboard!

</div>

---

## ✨ Features

- 🕹️ **Full Gamepad Support** - Use your Xbox controller to navigate X/Twitter
- 🎯 **Tweet Selection** - Visual highlighting shows your current position
- 📜 **Smooth Scrolling** - Analog stick control with boost option
- 💬 **Quick Interactions** - Like, reply, repost, and more with button presses
- 🔄 **Navigate Efficiently** - Jump between tweets or back to top instantly
- 🌐 **Works Everywhere** - Compatible with both `x.com` and `twitter.com`

---

## 📥 Installation

### Install as Unpacked Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **"Developer mode"** (toggle in the top right)
3. Click **"Load unpacked"** button
4. Select the `xctr` folder containing this extension
5. Visit `https://x.com` or `https://twitter.com`

> **💡 Pro Tip:** Click the page once after it loads to activate the Gamepad API!

---

## 🎮 Controls

### Movement & Navigation

| Button | Action |
|--------|--------|
| **Left Stick** | Smooth scroll (in any direction) |
| **RT (Right Trigger)** | Boost scroll speed while scrolling |
| **D-Pad Up/Down** | Page step scroll |
| **D-Pad Left/Right** | Previous/next tweet |
| **LB / RB** | Previous/next tweet |
| **View (Back)** | Jump to top of timeline |

### Tweet Interactions

| Button | Action |
|--------|--------|
| **A** | Like tweet |
| **A (double press)** | Unlike tweet |
| **X** | Reply to tweet |
| **Y** | Repost/undo repost (confirms automatically) |
| **B** | Go back / close dialog |
| **Menu (Start)** | Open selected tweet |

---

## 🔧 Technical Details

- **Tweet Highlighting:** Selected tweets are outlined in blue for easy identification
- **Platform Support:** Works on both `x.com` and `twitter.com`
- **Maintenance:** If X changes its DOM structure, CSS selectors may need updates
- **Gamepad API:** Uses the browser's native Gamepad API for input handling

---

## 🛠️ Development

### Project Structure

```
xctr/
├── manifest.json          # Chrome extension configuration
├── content.js             # Main content script
├── popup.html             # Extension popup UI
├── popup.css              # Popup styling
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── generate_gamepad_icons.py  # Icon generation script
└── README.md              # This file
```

### Modifying Icons

The gamepad icons can be regenerated using Python:

```bash
pip install Pillow
python generate_gamepad_icons.py
```

This will create new icons in all required sizes (16, 32, 48, 128px).

### Loading for Development

1. Make your changes to the source files
2. Go to `chrome://extensions`
3. Click the **reload** icon on the X Controller extension card
4. Refresh X/Twitter to test changes

---

## ❓ Troubleshooting

### Controller not working?

- **Click the page** - The Gamepad API requires user interaction to activate
- **Check connection** - Ensure your controller is properly connected
- **Test Gamepad API** - Visit a gamepad test site to verify browser detection
- **Try refreshing** - Reload the X/Twitter page after connecting

### Tweets not highlighting?

- The extension uses specific CSS selectors that may break if X updates their DOM
- Check the browser console for any selector errors
- Feel free to submit an issue or PR if selectors need updating!

### Scroll speed issues?

- Use **RT (Right Trigger)** while scrolling for a speed boost
- Adjust your analog stick movement for finer control
- Try **D-Pad** for more predictable page-by-page scrolling

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! If you find bugs or have suggestions:

1. Check existing issues
2. Create a new issue with details
3. Submit a pull request with your changes

---

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Gamepad API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro)

---

<div align="center">

Made with ❤️ for comfortable X/Twitter browsing

**Enjoy browsing hands-free!** 🎮

</div>
