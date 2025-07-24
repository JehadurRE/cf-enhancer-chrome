# 🚀 Codeforces Enhancer - Modern Edition

Enhanced Codeforces experience with modern Chrome Extension standards. This is a modernized version of the original [cf-enhancer](https://github.com/agul/cf-enhancer) by [agul](https://github.com/agul), rebuilt from the ground up by [JehadurRE](https://github.com/JehadurRE) to follow current Chrome extension best practices and ensure compatibility with modern browsers.

## ✨ Features

### 📊 Multi-Account Rating Graph
- Compare rating progression across multiple Codeforces accounts
- Interactive graph with smooth animations
- Click on profile page legends to add/remove accounts
- Supports autocomplete for easy account selection

### 🎨 Colorized Standings
- Color-code contest standings by programming language
- **Dynamic language detection** - automatically adapts to any contest
- Supports 30+ programming languages with distinct colors
- **Interactive legend** with hover effects and submission counts
- Toggle individual language highlighting with persistent state

### 📝 Enhanced Attempt Display
- Show attempt counts for each problem in standings
- Integrated with colorized standings feature
- Helps analyze submission patterns

### 👁️ Hide/Show Solved Problems
- Toggle button to hide/show solved problems in problemset
- Keyboard shortcut support (Ctrl/Cmd + H)
- Persistent state across sessions
- Shows count of solved problems

### 🌙 Dark Mode
- **NEW!** Beautiful dark theme for CodeForces
- **Light mode by default** - dark mode is opt-in
- Easy toggle button (top-right corner)
- Eye-friendly colors and contrast
- Persistent across all pages and sessions
- Clean and modern dark design

### 📚 Recommended Questions
- **NEW!** Personalized problem recommendations
- Based on your current rating and solve history
- Shows problems slightly above your level
- Includes problem statistics and tags
- Smart filtering for optimal practice
- Refreshable recommendations panel

## 🆕 What's New in This Version

### Modern Architecture
- **Manifest V3** compliance for future Chrome compatibility
- **Async/await** patterns replacing deprecated synchronous APIs
- **ES6+ JavaScript** with modern class-based architecture
- **Content Security Policy** compliant code

### Enhanced User Experience
- **Beautiful modern UI** with gradient backgrounds and smooth animations
- **Responsive design** that works on all screen sizes
- **Quick access popup** for instant settings changes
- **Comprehensive options page** with detailed descriptions

### Developer Improvements
- **Modular code structure** with separate feature files
- **Comprehensive error handling** and logging
- **TypeScript-ready** code patterns
- **Extensive documentation** and comments

## 🛠️ Installation

### From Chrome Web Store
*Coming soon - This extension will be published to the Chrome Web Store*

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `src` folder
5. The extension should now be active on Codeforces

## 📁 Project Structure

```
src/
├── manifest.json           # Extension manifest (V3)
├── utils/
│   └── storage.js          # Modern storage utilities
├── features/
│   ├── multiGraph.js       # Multi-account rating graphs
│   ├── colorizeStandings.js# Standings colorization
│   └── hideSolved.js       # Hide solved problems
├── options.html            # Modern options page
├── optionsPage.js          # Options page functionality
├── popup.html              # Quick settings popup
├── popup.js                # Popup functionality
└── icons/                  # Extension icons
    ├── logo_16x16.png
    ├── logo_48x48.png
    └── logo_128x128.png
```

## ⚙️ Configuration

The extension provides two ways to manage settings:

### Quick Settings (Popup)
- Click the extension icon in the toolbar
- Toggle features on/off instantly
- Perfect for quick adjustments

### Full Options Page
- Right-click extension icon → "Options"
- Detailed feature descriptions
- Advanced settings and customization
- Reset to defaults option

## 🔧 Technical Details

### Browser Compatibility
- **Chrome**: 88+ (Manifest V3 support)
- **Edge**: 88+ (Chromium-based)
- **Opera**: 74+ (Chromium-based)

### Permissions Used
- `storage`: For saving user preferences
- `host_permissions`: Access to Codeforces domains

### Performance Optimizations
- Lazy loading of features based on page context
- Efficient DOM manipulation with minimal reflows
- Debounced event handlers for smooth interactions
- Memory leak prevention with proper cleanup

## 🤝 Contributing

Contributions are welcome! Please feel free to:

1. **Report bugs** by opening an issue
2. **Suggest features** through feature requests
3. **Submit pull requests** with improvements
4. **Help with documentation** and examples

### Development Setup
1. Clone the repository
2. Load the extension in developer mode
3. Make changes to the source files
4. Reload the extension to test changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Original Creator**: [agul](https://github.com/agul) for the original [cf-enhancer](https://github.com/agul/cf-enhancer)
- **Codeforces**: For providing an excellent competitive programming platform
- **Chrome Extension Community**: For best practices and modern standards

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/JehadurRE/cf-enhancer-chrome/issues) page
2. Create a new issue with detailed information
3. Contact [@JehadurRE](https://github.com/JehadurRE) directly

## 🔄 Version History

### v2.0.0 (Current)
- Complete rewrite using Manifest V3
- Modern UI with improved UX
- Enhanced performance and reliability
- Better error handling and logging

### v1.2 (Original)
- Legacy version by agul
- Manifest V2 based
- Basic functionality established

---

**Made with ❤️ by [JehadurRE](https://github.com/JehadurRE)**  
*Original concept by [agul](https://github.com/agul)*
