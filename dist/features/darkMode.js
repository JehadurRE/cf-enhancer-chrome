/**
 * Dark Mode Feature
 * @author JehadurRE
 * 
 * Adds a dark theme to CodeForces with toggle functionality
 */

class DarkModeFeature {
  constructor() {
    console.log('[CF Enhancer] DarkModeFeature constructor called');
    
    this.isInitialized = false;
    this.isDarkMode = false;
    this.init();
  }

  async init() {
    console.log('[CF Enhancer] DarkMode init() called');
    
    try {
      // Check if CFEnhancerStorage is available
      if (typeof CFEnhancerStorage !== 'undefined') {
        // Explicitly get dark mode option with false default
        const result = await chrome.storage.local.get(['darkMode']);
        let darkModeEnabled = false; // Default to light mode
        
        if (result.darkMode !== undefined && result.darkMode !== null) {
          darkModeEnabled = result.darkMode;
        } else {
          // First time - set default to false (light mode)
          await CFEnhancerStorage.setOption('darkMode', false);
        }
        
        console.log('[CF Enhancer] Dark mode enabled:', darkModeEnabled);
        
        if (darkModeEnabled === true) {
          this.setupDarkMode();
        } else {
          // Always add toggle button even if dark mode is disabled (default light mode)
          this.setupToggleOnly();
        }
        this.isInitialized = true;
      } else {
        console.warn('[CF Enhancer] CFEnhancerStorage not available for dark mode');
        // Always add toggle button as fallback (default light mode)
        this.setupToggleOnly();
      }
    } catch (error) {
      console.error('[CF Enhancer] Error initializing DarkMode:', error);
      // Always add toggle button as fallback (default light mode)
      this.setupToggleOnly();
    }
  }

  /**
   * Setup only the toggle button (when dark mode is disabled)
   */
  setupToggleOnly() {
    console.log('[CF Enhancer] Setting up dark mode toggle only');
    
    // Wait for document ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.addDarkModeToggle();
      });
    } else {
      this.addDarkModeToggle();
    }
  }

  /**
   * Setup dark mode functionality
   */
  setupDarkMode() {
    console.log('[CF Enhancer] Setting up dark mode');
    
    // Wait for document ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.applyDarkMode();
        this.addDarkModeToggle();
      });
    } else {
      this.applyDarkMode();
      this.addDarkModeToggle();
    }
  }

  /**
   * Apply dark mode styles
   */
  applyDarkMode() {
    console.log('[CF Enhancer] Applying dark mode styles');
    
    const darkModeCSS = `
      <style id="cf-enhancer-dark-mode">
        /* Global Dark Mode Styles */
        body {
          background-color: #1a1a1a !important;
          color: #e0e0e0 !important;
        }
        
        /* Header and Navigation */
        .header, #header {
          background-color: #2d2d2d !important;
          border-bottom: 1px solid #404040 !important;
        }
        
        .lang-chooser, .menu, #menu {
          background-color: #2d2d2d !important;
        }
        
        .menu a, #menu a, .lang-chooser a {
          color: #e0e0e0 !important;
        }
        
        .menu a:hover, #menu a:hover, .lang-chooser a:hover {
          background-color: #404040 !important;
          color: #ffffff !important;
        }
        
        /* Main Content Areas */
        .content, #content, .main-content {
          background-color: #1a1a1a !important;
          color: #e0e0e0 !important;
        }
        
        /* Sidebar */
        .sidebar, #sidebar {
          background-color: #242424 !important;
        }
        
        .sidebar .roundbox, #sidebar .roundbox {
          background-color: #2d2d2d !important;
          border: 1px solid #404040 !important;
        }
        
        /* Tables */
        table {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        table th {
          background-color: #404040 !important;
          color: #ffffff !important;
          border: 1px solid #555555 !important;
        }
        
        table td {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        table tr:nth-child(even) {
          background-color: #242424 !important;
        }
        
        table tr:hover {
          background-color: #333333 !important;
        }
        
        /* Standings table specific */
        .standings {
          background-color: #2d2d2d !important;
        }
        
        .standings th {
          background-color: #404040 !important;
        }
        
        .standings td {
          background-color: #2d2d2d !important;
        }
        
        /* Forms and Inputs */
        input, textarea, select {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        input:focus, textarea:focus, select:focus {
          border-color: #0078d4 !important;
          box-shadow: 0 0 5px rgba(0, 120, 212, 0.3) !important;
        }
        
        /* Buttons */
        .button, button, input[type="submit"], input[type="button"] {
          background-color: #0078d4 !important;
          color: #ffffff !important;
          border: 1px solid #106ebe !important;
        }
        
        .button:hover, button:hover, input[type="submit"]:hover, input[type="button"]:hover {
          background-color: #106ebe !important;
        }
        
        /* Links */
        a {
          color: #4db8ff !important;
        }
        
        a:hover {
          color: #66c2ff !important;
        }
        
        a:visited {
          color: #9966ff !important;
        }
        
        /* Code blocks and pre */
        pre, code {
          background-color: #1e1e1e !important;
          color: #f0f0f0 !important;
          border: 1px solid #404040 !important;
        }
        
        /* Test example input/output styling */
        .test-example-line {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: none !important;
        }
        
        .test-example-line-even {
          background-color: #242424 !important;
          color: #e0e0e0 !important;
        }
        
        .test-example-line-odd {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Input/Output section styling */
        .input, .output {
          background-color: #1e1e1e !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        .input pre, .output pre {
          background-color: #1e1e1e !important;
          color: #e0e0e0 !important;
          margin: 0 !important;
          padding: 8px !important;
        }
        
        /* Sample test styling */
        .sample-test {
          background-color: #242424 !important;
          border: 1px solid #404040 !important;
        }
        
        .sample-test .input {
          background-color: #1e1e1e !important;
        }
        
        .sample-test .output {
          background-color: #1e1e1e !important;
        }
        
        /* Problem statement code examples */
        .problem-statement pre {
          background-color: #1e1e1e !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
          padding: 8px !important;
        }
        
        /* Problem statement */
        .problem-statement {
          background-color: #242424 !important;
          border: 1px solid #404040 !important;
        }
        
        .problem-statement .header {
          background-color: #2d2d2d !important;
        }
        
        .problem-statement .title {
          color: #e0e0e0 !important;
        }
        
        .problem-statement .time-limit,
        .problem-statement .memory-limit,
        .problem-statement .input-file,
        .problem-statement .output-file {
          color: #b0b0b0 !important;
        }
        
        .problem-statement .section-title {
          color: #ffffff !important;
          background-color: #404040 !important;
          border-bottom: 1px solid #666666 !important;
        }
        
        /* Input/Output format sections */
        .input-specification,
        .output-specification {
          background-color: #242424 !important;
          color: #e0e0e0 !important;
        }
        
        .input-specification .section-title,
        .output-specification .section-title {
          background-color: #404040 !important;
          color: #ffffff !important;
        }
        
        /* Roundboxes */
        .roundbox {
          background-color: #2d2d2d !important;
          border: 1px solid #404040 !important;
        }
        
        .roundbox .roundbox-lt {
          background-color: #2d2d2d !important;
        }
        
        /* Contest info */
        .contest-state-phase {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* User info */
        .user-info {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Pagination */
        .pagination a {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        .pagination a:hover {
          background-color: #404040 !important;
        }
        
        .pagination .current {
          background-color: #0078d4 !important;
          color: #ffffff !important;
        }
        
        /* Comments */
        .comment {
          background-color: #242424 !important;
          border: 1px solid #404040 !important;
        }
        
        /* Verdicts */
        .verdict-accepted {
          color: #4caf50 !important;
        }
        
        .verdict-wrong-answer {
          color: #f44336 !important;
        }
        
        .verdict-time-limit-exceeded {
          color: #ff9800 !important;
        }
        
        /* Status colors */
        .accepted {
          background-color: #1b5e20 !important;
          color: #4caf50 !important;
        }
        
        .wrong-answer {
          background-color: #5d1e1e !important;
          color: #f44336 !important;
        }
        
        .compilation-error {
          background-color: #4a2c2a !important;
          color: #ff7043 !important;
        }
        
        /* Footer */
        .footer, #footer {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border-top: 1px solid #404040 !important;
        }
        
        /* Misc */
        .datatable {
          background-color: #2d2d2d !important;
        }
        
        .border {
          border-color: #404040 !important;
        }
        
        hr {
          border-color: #404040 !important;
        }
        
        /* Additional comprehensive styling for missed elements */
        
        /* Text elements that might be missed */
        p, span, div, td, th, li, label {
          color: #e0e0e0 !important;
        }
        
        /* Specific CodeForces elements */
        .datatable th {
          background-color: #404040 !important;
          color: #ffffff !important;
        }
        
        .datatable td {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Contest info and headers */
        .contest-name, .contest-state {
          color: #e0e0e0 !important;
        }
        
        /* Problem statement text */
        .problem-statement p, .problem-statement div {
          color: #e0e0e0 !important;
        }
        
        /* User handles and ratings */
        .rated-user, .user-legendary, .user-red, .user-orange, .user-violet, .user-blue, .user-cyan, .user-green, .user-gray, .user-unrated {
          background-color: transparent !important;
        }
        
        /* Submission verdicts */
        .verdict {
          color: #e0e0e0 !important;
        }
        
        /* Contest standings specific */
        .standings .contestant-cell {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Time and score cells */
        .cell-time, .cell-score {
          color: #e0e0e0 !important;
        }
        
        /* Navigation and breadcrumbs */
        .second-level-menu, .second-level-menu a {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        .second-level-menu a:hover {
          background-color: #404040 !important;
        }
        
        /* Contest list and problem list */
        .contestList, .problems {
          background-color: #2d2d2d !important;
        }
        
        /* Blog entries and comments */
        .blog-entry {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        .blog-entry .title {
          color: #4db8ff !important;
        }
        
        .blog-entry .info {
          color: #b0b0b0 !important;
        }
        
        /* Right sidebar content */
        .right-sidebar {
          background-color: #242424 !important;
        }
        
        .right-sidebar .roundbox {
          background-color: #2d2d2d !important;
          border: 1px solid #404040 !important;
        }
        
        /* Contest dashboard */
        .contest-dashboard {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Problem tags */
        .tag {
          background-color: #404040 !important;
          color: #e0e0e0 !important;
          border: 1px solid #666666 !important;
        }
        
        /* Submission status */
        .status-small, .status-verdict {
          color: #e0e0e0 !important;
        }
        
        /* Contest phase information */
        .contest-state-phase {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Tooltips and popups */
        .tooltip, .popup {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        /* Contest countdown */
        .countdown {
          color: #e0e0e0 !important;
        }
        
        /* Rating changes */
        .ratingChange {
          color: #e0e0e0 !important;
        }
        
        /* Contest list table */
        .contestList td {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        .contestList th {
          background-color: #404040 !important;
          color: #ffffff !important;
        }
        
        /* Problem difficulty */
        .problem-difficulty {
          color: #e0e0e0 !important;
        }
        
        /* Contest registration */
        .contest-reg {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Search and filter boxes */
        .search-box, .filter-box {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        /* Messages and notifications */
        .message, .notification {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
        }
        
        /* Special text that might be missed */
        .text, .content-text, .main-text {
          color: #e0e0e0 !important;
        }
        
        /* Dropdown menus */
        .dropdown-menu {
          background-color: #2d2d2d !important;
          border: 1px solid #404040 !important;
        }
        
        .dropdown-menu li a {
          color: #e0e0e0 !important;
        }
        
        .dropdown-menu li a:hover {
          background-color: #404040 !important;
          color: #ffffff !important;
        }
        
        /* Contest material and attachments */
        .contest-materials {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
        
        /* Override any remaining black text */
        * {
          color: inherit !important;
        }
        
        /* Force specific elements that commonly remain black */
        h1, h2, h3, h4, h5, h6 {
          color: #e0e0e0 !important;
        }
        
        /* CodeForces specific elements that might be missed */
        .cf-content {
          background-color: #1a1a1a !important;
          color: #e0e0e0 !important;
        }
        
        /* Contest standings handle column */
        .standings .contestant-cell a {
          color: inherit !important;
        }
        
        /* Time cells in standings */
        .standings .time {
          color: #e0e0e0 !important;
        }
        
        /* Score and points */
        .points, .score {
          color: #e0e0e0 !important;
        }
        
        /* Any remaining table elements */
        tbody, thead, tfoot {
          background-color: inherit !important;
          color: #e0e0e0 !important;
        }
      </style>
    `;
    
    // Add dark mode styles to head
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head) {
      head.insertAdjacentHTML('beforeend', darkModeCSS);
    }
    
    this.isDarkMode = true;
    console.log('[CF Enhancer] Dark mode styles applied');
  }

  /**
   * Remove dark mode styles
   */
  removeDarkMode() {
    const darkModeStyle = document.getElementById('cf-enhancer-dark-mode');
    if (darkModeStyle) {
      darkModeStyle.remove();
    }
    this.isDarkMode = false;
    console.log('[CF Enhancer] Dark mode styles removed');
  }

  /**
   * Add dark mode toggle button
   */
  addDarkModeToggle() {
    // Check if toggle already exists
    if (document.getElementById('cf-dark-mode-toggle')) {
      return;
    }
    
    // Add toggle button styles that persist regardless of mode
    this.addToggleButtonStyles();
    
    const toggleButton = document.createElement('button');
    toggleButton.id = 'cf-dark-mode-toggle';
    toggleButton.innerHTML = '🌙 Dark';
    toggleButton.title = 'Toggle Dark Mode';
    
    toggleButton.addEventListener('click', async () => {
      try {
        if (this.isDarkMode) {
          this.removeDarkMode();
          toggleButton.innerHTML = '🌙 Dark';
          // Re-add toggle button styles after removing dark mode
          this.addToggleButtonStyles();
          if (typeof CFEnhancerStorage !== 'undefined') {
            await CFEnhancerStorage.setOption('darkMode', false);
          }
        } else {
          this.applyDarkMode();
          toggleButton.innerHTML = '☀️ Light';
          if (typeof CFEnhancerStorage !== 'undefined') {
            await CFEnhancerStorage.setOption('darkMode', true);
          }
        }
      } catch (error) {
        console.error('[CF Enhancer] Error toggling dark mode:', error);
      }
    });
    
    // Set initial button state
    if (this.isDarkMode) {
      toggleButton.innerHTML = '☀️ Light';
    }
    
    document.body.appendChild(toggleButton);
    console.log('[CF Enhancer] Dark mode toggle button added');
  }

  /**
   * Add persistent toggle button styles
   */
  addToggleButtonStyles() {
    // Remove existing toggle styles first
    const existingToggleStyles = document.getElementById('cf-dark-mode-toggle-styles');
    if (existingToggleStyles) {
      existingToggleStyles.remove();
    }

    const toggleButtonCSS = `
      <style id="cf-dark-mode-toggle-styles">
        /* Toggle button styles - always visible and positioned */
        #cf-dark-mode-toggle {
          position: fixed !important;
          top: 10px !important;
          right: 10px !important;
          z-index: 10000 !important;
          background-color: ${this.isDarkMode ? '#404040' : '#ffffff'} !important;
          color: ${this.isDarkMode ? '#e0e0e0' : '#333333'} !important;
          border: 1px solid ${this.isDarkMode ? '#666666' : '#cccccc'} !important;
          padding: 8px 12px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          font-size: 12px !important;
          transition: all 0.3s ease !important;
          font-family: inherit !important;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        }
        
        #cf-dark-mode-toggle:hover {
          background-color: ${this.isDarkMode ? '#555555' : '#f0f0f0'} !important;
          color: ${this.isDarkMode ? '#ffffff' : '#000000'} !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3) !important;
        }
      </style>
    `;
    
    // Add toggle button styles to head
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head) {
      head.insertAdjacentHTML('beforeend', toggleButtonCSS);
    }
  }
}

// Initialize dark mode
console.log('[CF Enhancer] DarkMode script loaded');

// Initialize on any page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[CF Enhancer] DOM loaded, creating DarkModeFeature');
    new DarkModeFeature();
  });
} else {
  console.log('[CF Enhancer] DOM already loaded, creating DarkModeFeature');
  new DarkModeFeature();
}
