# Development Guide

## 🛠️ Development Setup

### Prerequisites
- Node.js 14+ (for build scripts)
- Google Chrome or Chromium browser
- Git for version control

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/JehadurRE/cf-enhancer-chrome.git
   cd cf-enhancer-chrome
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `src` folder

## 📁 Project Structure

```
cf-enhancer-chrome/
├── src/                    # Source code
│   ├── manifest.json       # Extension manifest
│   ├── utils/              # Utility modules
│   │   └── storage.js      # Storage management
│   ├── features/           # Feature implementations
│   │   ├── multiGraph.js   # Multi-account graphs
│   │   ├── colorizeStandings.js # Language colorization
│   │   └── hideSolved.js   # Hide solved problems
│   ├── options.html        # Options page
│   ├── optionsPage.js      # Options functionality
│   ├── popup.html          # Extension popup
│   ├── popup.js            # Popup functionality
│   └── icons/              # Extension icons
├── scripts/                # Build and deployment scripts
├── docs/                   # Documentation
└── dist/                   # Built extension (generated)
```

## 🔧 Build Process

### Development Build
```bash
npm run build
```
This creates a `dist` folder with the built extension.

### Create Distribution Package
```bash
npm run zip
```
This creates a ZIP file ready for Chrome Web Store submission.

### Clean Build Files
```bash
npm run clean
```

## 🧪 Testing

### Manual Testing Checklist

#### Multi-Graph Feature
- [ ] Visit any Codeforces profile page
- [ ] Click on rating graph legend
- [ ] Add multiple accounts
- [ ] Verify graphs render correctly
- [ ] Test autocomplete functionality

#### Colorized Standings
- [ ] Visit any contest standings page
- [ ] Verify languages are color-coded
- [ ] Test language highlighting toggle
- [ ] Check attempt counts display

#### Hide Solved Problems
- [ ] Visit Codeforces problemset page
- [ ] Click "Hide solved problems" button
- [ ] Verify solved problems are hidden
- [ ] Test keyboard shortcut (Ctrl/Cmd + H)

#### Options Management
- [ ] Open extension popup
- [ ] Toggle each feature on/off
- [ ] Open full options page
- [ ] Test reset functionality
- [ ] Verify settings persistence

### Browser Compatibility Testing
Test on:
- [ ] Chrome 88+
- [ ] Edge 88+
- [ ] Opera 74+

## 🚀 Deployment

### Chrome Web Store Submission

1. **Prepare Package**
   ```bash
   npm run build
   npm run zip
   ```

2. **Store Listing Requirements**
   - **Name**: Codeforces Enhancer by JehadurRE
   - **Category**: Productivity
   - **Summary**: Enhanced Codeforces experience with modern Chrome extension standards
   - **Description**: Include acknowledgment to original author (agul)

3. **Required Assets**
   - Screenshots (1280x800 px)
   - Small promotional tile (440x280 px)
   - Store icon (128x128 px)

4. **Privacy and Permissions**
   - Explain storage permission usage
   - Explain host permissions for Codeforces

### Version Management

Version format: `MAJOR.MINOR.BUILD`
- **MAJOR**: Breaking changes or complete rewrites (currently 2)
- **MINOR**: New features or significant improvements
- **BUILD**: Bug fixes and minor updates (auto-generated from date)

## 🐛 Debugging

### Chrome DevTools
1. Right-click extension icon → "Inspect popup"
2. For content scripts: Inspect page → Console → Check for `[CF Enhancer]` logs
3. For background scripts: Chrome Extensions page → "Inspect views: background page"

### Common Issues

#### Extension Not Loading
- Check manifest.json syntax
- Verify all files exist
- Check browser console for errors

#### Features Not Working
- Verify correct URLs in manifest matches
- Check content script injection
- Confirm storage permissions

#### Build Failures
- Ensure Node.js 14+ is installed
- Check file permissions
- Verify all source files exist

### Logging
All components use consistent logging:
```javascript
console.log('[CF Enhancer] Feature initialized');
console.error('[CF Enhancer] Error:', error);
```

## 📝 Code Style

### JavaScript Standards
- Use modern ES6+ syntax
- Prefer `async/await` over callbacks
- Use class-based architecture
- Comprehensive error handling

### File Organization
- One class per file
- Descriptive function names
- Comprehensive JSDoc comments
- Consistent naming conventions

### CSS Standards
- Mobile-first responsive design
- CSS custom properties for theming
- Semantic class names
- Modern flexbox/grid layouts

## 🤝 Contributing

### Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Review Guidelines
- Test all features manually
- Verify cross-browser compatibility
- Check performance impact
- Ensure accessibility standards
- Review security implications

### Issue Reporting
Include:
- Browser version and OS
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
