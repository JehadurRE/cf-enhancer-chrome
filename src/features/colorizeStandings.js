/**
 * Colorize Standings Feature
 * @author JehadurRE
 * Based on original work by agul (https://github.com/agul/cf-enhancer)
 * 
 * Colorizes contest standings table by programming language
 * and optionally shows attempt counts
 */

class ColorizeStandingsFeature {
  constructor() {
    console.log('[CF Enhancer] ColorizeStandingsFeature constructor called');
    console.log('[CF Enhancer] Current URL:', window.location.href);
    console.log('[CF Enhancer] CFEnhancerStorage available:', typeof CFEnhancerStorage);
    
    this.isInitialized = false;
    this.languageSpecs = this.getLanguageSpecifications();
    this.init();
  }

  async init() {
    console.log('[CF Enhancer] ColorizeStandings init() called');
    
    try {
      // Check if CFEnhancerStorage is available (it should be loaded via content script)
      if (typeof CFEnhancerStorage === 'undefined') {
        console.warn('[CF Enhancer] CFEnhancerStorage not available, using default options');
        // Use default options if storage is not available
        this.setupColorizeStandings(true, true);
        this.isInitialized = true;
        return;
      }
      
      const options = await CFEnhancerStorage.getOptions(['colorizeStandings', 'showAttempts'], true);
      console.log('[CF Enhancer] Retrieved options:', options);
      
      if (options.colorizeStandings || options.showAttempts) {
        console.log('[CF Enhancer] Setting up colorization with options:', {
          colorize: options.colorizeStandings,
          showAttempts: options.showAttempts
        });
        this.setupColorizeStandings(options.colorizeStandings, options.showAttempts);
        this.isInitialized = true;
      } else {
        console.log('[CF Enhancer] ColorizeStandings disabled in options');
      }
    } catch (error) {
      console.error('[CF Enhancer] Error initializing ColorizeStandings:', error);
      console.log('[CF Enhancer] Falling back to default options');
      // Fallback to default behavior
      this.setupColorizeStandings(true, true);
      this.isInitialized = true;
    }
  }

  /**
   * Get language specifications for colorization
   * @returns {Array} Language specifications array
   */
  getLanguageSpecifications() {
    // Detect languages dynamically from the page
    return this.detectLanguagesFromPage();
  }

  /**
   * Detect languages dynamically from the standings table
   * @returns {Array} Detected language specifications
   */
  detectLanguagesFromPage() {
    console.log('[CF Enhancer] Detecting languages from page');
    
    const languageMap = new Map();
    const allCells = document.querySelectorAll('td[title]');
    
    console.log(`[CF Enhancer] Found ${allCells.length} cells with title attributes`);
    
    // Color palette for different languages
    const colors = [
      { bg: '#ccffff', border: 'double #6666ff' },    // Light blue
      { bg: '#ffccff', border: 'dashed #ff33ff' },    // Light pink
      { bg: '#ccff99', border: 'solid #00cc00' },     // Light green
      { bg: '#ffff99', border: 'dashed #ff6633' },    // Light yellow
      { bg: '#ffcc99', border: 'solid #ff33ff' },     // Light orange
      { bg: '#ccccff', border: 'solid #cc00ff' },     // Light purple
      { bg: '#33cccc', border: 'solid #006666' },     // Teal
      { bg: '#ff9999', border: 'dashed #cc0000' },    // Light red
      { bg: '#99ff99', border: 'dotted #006600' },    // Bright green
      { bg: '#9999ff', border: 'solid #3333cc' },     // Bright blue
      { bg: '#ffcccc', border: 'solid #ff6666' },     // Light coral
      { bg: '#ccffcc', border: 'dashed #66ff66' },    // Light mint
      { bg: '#ffffcc', border: 'dotted #ffff66' },    // Light cream
      { bg: '#ffccaa', border: 'solid #ff9966' },     // Light peach
      { bg: '#ccaaff', border: 'dashed #9966ff' },    // Light lavender
    ];
    
    let colorIndex = 0;
    const uniqueTitles = new Set();
    
    Array.from(allCells).forEach((cell, index) => {
      const title = cell.getAttribute('title');
      if (!title) return;
      
      // Skip rating predictor columns
      if (cell.hasAttribute('data-rating-predictor') || 
          cell.classList.contains('rating-predictor-cell') ||
          cell.classList.contains('rating-predictor-header')) {
        console.log(`[CF Enhancer] Skipping rating predictor cell: "${title}"`);
        return;
      }
      
      uniqueTitles.add(title);
      
      // Extract language from title
      let language = this.extractLanguageFromTitle(title);
      if (!language) {
        console.log(`[CF Enhancer] Could not extract language from title: "${title}"`);
        return;
      }
      
      if (!languageMap.has(language)) {
        const color = colors[colorIndex % colors.length];
        const className = `l-${language.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        
        languageMap.set(language, {
          names: [language],
          className: className,
          style: `background-color: ${color.bg} !important; border: ${color.border};`,
          displayName: language,
          count: 0
        });
        
        console.log(`[CF Enhancer] Detected new language: "${language}" -> class: ${className}`);
        colorIndex++;
      }
      
      // Increment count
      languageMap.get(language).count++;
    });
    
    // Debug information
    console.log(`[CF Enhancer] Sample titles found:`, Array.from(uniqueTitles).slice(0, 10));
    console.log(`[CF Enhancer] Total unique titles: ${uniqueTitles.size}`);
    
    // Convert to the expected format
    const specs = Array.from(languageMap.values())
      .filter(lang => lang.count > 0) // Only include languages with submissions
      .sort((a, b) => b.count - a.count) // Sort by count (most popular first)
      .map(lang => [
        lang.names,
        lang.className,
        lang.style,
        lang.displayName
      ]);
    
    console.log('[CF Enhancer] Final detected languages:', specs.map(s => `${s[3]} (${languageMap.get(s[3]).count})`));
    
    // If no languages detected, try a more aggressive approach
    if (specs.length === 0) {
      console.warn('[CF Enhancer] No languages detected with primary method, trying fallback');
      return this.detectLanguagesFallback();
    }
    
    return specs;
  }

  /**
   * Fallback language detection method
   * @returns {Array} Detected language specifications using fallback method
   */
  detectLanguagesFallback() {
    console.log('[CF Enhancer] Using fallback language detection');
    
    const languageMap = new Map();
    const allCells = document.querySelectorAll('td[title]');
    
    Array.from(allCells).forEach(cell => {
      const title = cell.getAttribute('title');
      if (!title) return;
      
      // Very aggressive pattern - take first word/phrase before any special character
      const match = title.match(/^([^(,;:]+)/);
      if (match) {
        let language = match[1].trim();
        
        // Clean up common patterns
        language = language.replace(/\s+/g, ' ');
        
        if (language && language.length > 1) {
          if (!languageMap.has(language)) {
            const className = `l-${language.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            languageMap.set(language, {
              names: [language],
              className: className,
              style: 'background-color: #f0f0f0 !important; border: solid #999;',
              displayName: language,
              count: 0
            });
          }
          languageMap.get(language).count++;
        }
      }
    });
    
    const specs = Array.from(languageMap.values())
      .filter(lang => lang.count > 0)
      .map(lang => [lang.names, lang.className, lang.style, lang.displayName]);
    
    console.log('[CF Enhancer] Fallback detected languages:', specs.map(s => s[3]));
    return specs;
  }

  /**
   * Extract language name from title attribute
   * @param {string} title - Title attribute value
   * @returns {string|null} Extracted language name
   */
  extractLanguageFromTitle(title) {
    if (!title) return null;
    
    // More comprehensive patterns for language extraction
    const patterns = [
      // C++ variants (must come before C patterns)
      /^(GNU C\+\+\d+(?:\s*\([^)]*\))?)/,     // GNU C++20 (64), GNU C++17 (GCC 9-64)
      /^(C\+\+\d+(?:\s*\([^)]*\))?)/,         // C++20 (GCC), C++17 (64)
      /^(MS C\+\+(?:\s*\d+)?)/,               // MS C++, MS C++ 2017
      /^(C\+\+)/,                             // Plain C++
      
      // C variants (after C++)
      /^(GNU C\d+)/,                          // GNU C11, GNU C17
      /^(GNU C)(?!\+)/,                       // GNU C (not C++)
      /^(MS C)(?!\+)/,                        // MS C (not C++)
      /^(C)(?!\+)/,                           // Plain C (not C++)
      
      // Other languages with versions
      /^(Java\s*\d+)/,                        // Java 17, Java 21
      /^(Python\s*\d+)/,                      // Python 3, Python 2
      /^(PyPy\s*\d+)/,                        // PyPy 3, PyPy 2
      /^(\.NET\s*\d+)/,                       // .NET 6, .NET 8
      /^(Node\.js\s*\d+)/,                    // Node.js 18
      
      // Languages without versions
      /^(Kotlin)/,
      /^(Scala)/,
      /^(JavaScript)/,
      /^(TypeScript)/,
      /^(Go)/,
      /^(Rust)/,
      /^(D)/,
      /^(Pascal)/,
      /^(Delphi)/,
      /^(Free Pascal)/,
      /^(Perl)/,
      /^(PHP)/,
      /^(Ruby)/,
      /^(Haskell)/,
      /^(OCaml)/,
      /^(F#)/,
      /^(C#)/,
      /^(Visual Basic)/,
      /^(Clojure)/,
      /^(Erlang)/,
      /^(Elixir)/,
      /^(Swift)/,
      /^(Objective-C)/,
      /^(R)/,
      /^(MATLAB)/,
      /^(Ada)/,
      /^(COBOL)/,
      /^(Fortran)/,
      /^(Lua)/,
      /^(Nim)/,
      /^(Crystal)/,
      /^(Zig)/,
      /^(V)/,
      /^(Dart)/,
      
      // Generic fallback - captures any word that starts with uppercase
      /^([A-Z][A-Za-z0-9\+#\.\s]*?)(?:\s*\(|$)/
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        let language = match[1].trim();
        
        // Clean up the language name
        language = language.replace(/\s+/g, ' '); // Normalize whitespace
        
        // Special handling for some languages
        if (language === 'C' && title.includes('C++')) {
          continue; // Skip if it's actually C++
        }
        
        return language;
      }
    }
    
    // Ultimate fallback - extract first word before parenthesis
    const fallbackMatch = title.match(/^([A-Za-z0-9\+#\.]+)/);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }
    
    return null;
  }

  /**
   * Check if a title matches a language specification
   * @param {string} title - The title attribute value
   * @param {string} language - The language to match
   * @returns {boolean} Whether the title matches the language
   */
  matchesLanguage(title, language) {
    if (!title || !language) return false;
    
    // Extract language from title and compare with the spec language
    const extractedLanguage = this.extractLanguageFromTitle(title);
    return extractedLanguage === language;
  }

  /**
   * Get display name for a language specification
   * @param {Array} spec - Language specification
   * @returns {string} Display name
   */
  getDisplayName(spec) {
    return spec.length >= 4 ? spec[3] : (Array.isArray(spec[0]) ? spec[0][0] : spec[0]);
  }

  /**
   * Convert language names to array
   * @param {string|Array} names - Language name(s)
   * @returns {Array} Array of language names
   */
  toArray(names) {
    return Array.isArray(names) ? names : [names];
  }

  /**
   * Setup colorize standings functionality
   * @param {boolean} optColorize - Whether to colorize
   * @param {boolean} optShowAttempts - Whether to show attempts
   */
  setupColorizeStandings(optColorize, optShowAttempts) {
    console.log('[CF Enhancer] setupColorizeStandings called with:', {
      colorize: optColorize,
      showAttempts: optShowAttempts,
      readyState: document.readyState
    });
    
    // Wait for document ready
    if (document.readyState === 'loading') {
      console.log('[CF Enhancer] Document still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[CF Enhancer] DOMContentLoaded fired, executing colorization');
        this.executeColorization(optColorize, optShowAttempts);
      });
    } else {
      console.log('[CF Enhancer] Document ready, executing colorization immediately');
      this.executeColorization(optColorize, optShowAttempts);
    }
  }

  /**
   * Execute colorization logic
   * @param {boolean} optColorize - Whether to colorize
   * @param {boolean} optShowAttempts - Whether to show attempts
   */
  executeColorization(optColorize, optShowAttempts) {
    console.log('[CF Enhancer] executeColorization called with:', {
      colorize: optColorize,
      showAttempts: optShowAttempts,
      standingsTable: !!document.querySelector('table.standings')
    });
    
    // Add a small delay to ensure all content is loaded
    setTimeout(() => {
      try {
        // Re-detect languages after delay to ensure all content is loaded
        this.languageSpecs = this.detectLanguagesFromPage();
        
        if (optColorize) {
          console.log('[CF Enhancer] Adding color styles and legend');
          this.addColorStyles();
          this.addColorLegend();
          console.log('[CF Enhancer] Color styles and legend completed');
        }

        console.log('[CF Enhancer] Processing language cells');
        this.processLanguageCells(optColorize, optShowAttempts);
        
        console.log('[CF Enhancer] Colorization completed successfully');
      } catch (error) {
        console.error('[CF Enhancer] Error in colorization:', error);
      }
    }, 500); // 500ms delay to ensure page is fully loaded
  }

  /**
   * Add color styles to the page
   */
  addColorStyles() {
    console.log('[CF Enhancer] addColorStyles called');
    
    // Set table border collapse
    const standingsTable = document.querySelector('table.standings');
    if (standingsTable) {
      standingsTable.style.borderCollapse = 'separate';
    }

    // Generate CSS styles
    let style = '<style>.color-legend { border: solid #e1e1e1 1px; }\n';
    
    for (const spec of this.languageSpecs) {
      style += `td.${spec[1]} { ${spec[2]} }\n`;
    }

    // Add highlight style with base64 encoded background image
    style += `td.highlight-by-lang { 
      background-repeat: no-repeat; 
      background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAAXNSR0IArs4c6QAAAv1QTFRFAIAAAAAAgIAAAACAgACAAICAgICAwMDA/wAAAP8A//8AAAD//wD/AP//////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzAABmAACZAADMAAD/ADMAADMzADNmADOZADPMADP/AGYAAGYzAGZmAGaZAGbMAGb/AJkAAJkzAJlmAJmZAJnMAJn/AMwAAMwzAMxmAMyZAMzMAMz/AP8AAP8zAP9mAP+ZAP/MAP//MwAAMwAzMwBmMwCZMwDMMwD/MzMAMzMzMzNmMzOZMzPMMzP/M2YAM2YzM2ZmM2aZM2bMM2b/M5kAM5kzM5lmM5mZM5nMM5n/M8wAM8wzM8xmM8yZM8zMM8z/M/8AM/8zM/9mM/+ZM//MM///ZgAAZgAzZgBmZgCZZgDMZgD/ZjMAZjMzZjNmZjOZZjPMZjP/ZmYAZmYzZmZmZmaZZmbMZmb/ZpkAZpkzZplmZpmZZpnMZpn/ZswAZswzZsxmZsyZZszMZsz/Zv8AZv8zZv9mZv+ZZv/MZv//mQAAmQAzmQBmmQCZmQDMmQD/mTMAmTMzmTNmmTOZmTPMmTP/mWYAmWYzmWZmmWaZmWbMmWb/mZkAmZkzmZlmmZmZmZnMmZn/mcwAmcwzmcxmmcyZmczMmcz/mf8Amf8zmf9mmf+Zmf/Mmf//zAAAzAAzzABmzACZzADMzAD/zDMAzDMzzDNmzDOZzDPMzDP/zGYAzGYzzGZmzGaZzGbMzGb/zJkAzJkzzJlmzJmZzJnMzJn/zMwAzMwzzMxmzMyZzMzMzMz/zP8AzP8zzP9mzP+ZzP/MzP///wAA/wAz/wBm/wCZ/wDM/wD//zMA/zMz/zNm/zOZ/zPM/zP//2YA/2Yz/2Zm/2aZ/2bM/2b//5kA/5kz/5lm/5mZ/5nM/5n//8wA/8wz/8xm/8yZ/8zM/8z///8A//8z//9m//+Z///M////eyQG1gAAAAF0Uk5TAEDm2GYAAAA/SURBVBjTXcjBEQAwBAVRqSZVqjS9mCCIb2/7SEYkB+IBvBH0Aew7+Dd4/yG+ID+hPoAXAbR36G8Ar4BPMv4CC5KBJwNtIOoAAAAASUVORK5CYII="); 
    }\n</style>`;

    // Add styles to head
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head) {
      head.insertAdjacentHTML('beforeend', style);
    }

    console.log('[CF Enhancer] Color styles added');
  }

  /**
   * Add color legend to the page
   */
  addColorLegend() {
    console.log('[CF Enhancer] addColorLegend called');
    
    let legend = '<div style="text-align: center; margin: 10px 0; padding: 10px; background: #f8f8f8; border: 1px solid #ddd;">';
    legend += '<strong>Language Color Legend:</strong><br>';
    legend += '<table style="margin: 5px auto; border-collapse: separate;"><tr>';
    
    for (const spec of this.languageSpecs) {
      const displayName = this.getDisplayName(spec);
      const className = spec[1];
      
      // Count cells for this language
      const cellCount = this.countLanguageCells(spec);
      const countText = cellCount > 0 ? ` (${cellCount})` : '';
      
      legend += `<td style="padding: 0.5em; margin: 2px; cursor: pointer; transition: opacity 0.2s;" 
                     class="color-legend ${className}" 
                     data-language-class="${className}"
                     title="Click to highlight all ${displayName} submissions. Found ${cellCount} submissions."
                     onmouseover="this.style.opacity='0.7'" 
                     onmouseout="this.style.opacity='1'">${displayName}${countText}</td>`;
    }
    
    legend += '</tr></table></div>';
    
    // Try multiple fallback strategies to find a good place for the legend
    let targetElement = null;
    let insertMethod = 'afterend';
    
    // Strategy 1: Look for contest-name div
    targetElement = document.querySelector('div.contest-name');
    if (targetElement) {
      console.log('[CF Enhancer] Found contest-name div, using it as target');
    }
    
    // Strategy 2: Look for contest header or title
    if (!targetElement) {
      targetElement = document.querySelector('.contest-header, .page-header, h1');
      if (targetElement) {
        console.log('[CF Enhancer] Found header element, using it as target');
      }
    }
    
    // Strategy 3: Look for standings table and insert before it
    if (!targetElement) {
      targetElement = document.querySelector('table.standings, .standings');
      insertMethod = 'beforebegin';
      if (targetElement) {
        console.log('[CF Enhancer] Found standings table, will insert before it');
      }
    }
    
    // Strategy 4: Insert at the beginning of main content
    if (!targetElement) {
      targetElement = document.querySelector('.content, #pageContent, main, body');
      insertMethod = 'afterbegin';
      if (targetElement) {
        console.log('[CF Enhancer] Using main content area as fallback');
      }
    }
    
    if (targetElement) {
      if (insertMethod === 'afterend' && targetElement.parentElement) {
        targetElement.parentElement.insertAdjacentHTML('afterend', legend);
      } else {
        targetElement.insertAdjacentHTML(insertMethod, legend);
      }
      console.log('[CF Enhancer] Legend added successfully');
      
      // Add enhanced hover and click functionality after legend is inserted
      this.setupLegendInteractions();
    } else {
      console.error('[CF Enhancer] Could not find suitable location for legend');
    }
  }

  /**
   * Count cells for a specific language specification
   * @param {Array} spec - Language specification
   * @returns {number} Number of cells found
   */
  countLanguageCells(spec) {
    const languages = this.toArray(spec[0]);
    let totalCount = 0;
    
    for (const language of languages) {
      const allCells = document.querySelectorAll('td[title]');
      const cells = Array.from(allCells).filter(cell => 
        this.matchesLanguage(cell.getAttribute('title'), language)
      );
      totalCount += cells.length;
    }
    
    return totalCount;
  }

  /**
   * Setup enhanced legend interactions (hover effects and click functionality)
   */
  setupLegendInteractions() {
    console.log('[CF Enhancer] Setting up legend interactions');
    
    const legendCells = document.querySelectorAll('.color-legend[data-language-class]');
    
    legendCells.forEach(legendCell => {
      const languageClass = legendCell.getAttribute('data-language-class');
      const targetCells = document.querySelectorAll(`td.${languageClass}`);
      
      // Enhanced hover effect - properly isolate the selected language
      legendCell.addEventListener('mouseenter', () => {
        // Find all language cells (cells with any l- class)
        const allLanguageCells = document.querySelectorAll('td[class*="l-"]');
        
        allLanguageCells.forEach(cell => {
          if (cell.classList.contains(languageClass)) {
            // Highlight the selected language
            cell.style.opacity = '1';
            cell.style.boxShadow = '0 0 8px rgba(255,0,0,0.7)';
            cell.style.transform = 'scale(1.02)';
            cell.style.zIndex = '1000';
            cell.style.position = 'relative';
            cell.style.outline = '2px solid #ff0000';
          } else {
            // Dim other languages
            cell.style.opacity = '0.2';
          }
        });
      });
      
      legendCell.addEventListener('mouseleave', () => {
        // Reset all cells to their original state
        const allLanguageCells = document.querySelectorAll('td[class*="l-"]');
        allLanguageCells.forEach(cell => {
          cell.style.opacity = '';
          cell.style.boxShadow = '';
          cell.style.transform = '';
          cell.style.zIndex = '';
          cell.style.position = '';
          cell.style.outline = '';
        });
      });
      
      // Click functionality for persistent highlighting
      legendCell.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const cookieKey = `colorize_standings_cf_${languageClass}`;
        const isCurrentlyHighlighted = this.getCookie(cookieKey) === '1';
        
        console.log(`[CF Enhancer] Toggling highlight for ${languageClass}, currently: ${isCurrentlyHighlighted}`);
        
        if (isCurrentlyHighlighted) {
          // Remove highlighting
          this.setCookie(cookieKey, '0', -1); // Delete cookie by setting past expiration
          legendCell.style.textDecoration = '';
          legendCell.style.fontWeight = '';
          targetCells.forEach(cell => cell.classList.remove('highlight-by-lang'));
        } else {
          // Add highlighting
          this.setCookie(cookieKey, '1', 365);
          legendCell.style.textDecoration = 'underline';
          legendCell.style.fontWeight = 'bold';
          targetCells.forEach(cell => cell.classList.add('highlight-by-lang'));
        }
        
        console.log(`[CF Enhancer] Cookie ${cookieKey} set to: ${this.getCookie(cookieKey)}`);
      });
      
      // Set initial state based on existing cookie
      const cookieKey = `colorize_standings_cf_${languageClass}`;
      const isHighlighted = this.getCookie(cookieKey) === '1';
      if (isHighlighted) {
        legendCell.style.textDecoration = 'underline';
        legendCell.style.fontWeight = 'bold';
        targetCells.forEach(cell => cell.classList.add('highlight-by-lang'));
      }
    });
  }

  /**
   * Process language cells for colorization and attempt counts
   * @param {boolean} optColorize - Whether to colorize
   * @param {boolean} optShowAttempts - Whether to show attempts
   */
  processLanguageCells(optColorize, optShowAttempts) {
    console.log('[CF Enhancer] processLanguageCells called', {
      languageSpecsCount: this.languageSpecs.length
    });
    
    let totalCellsFound = 0;
    
    for (const spec of this.languageSpecs) {
      const cookieKey = `colorize_standings_cf_${spec[1]}`;
      const languages = this.toArray(spec[0]);
      
      for (const language of languages) {
        // Find cells with title matching the language using sophisticated matching
        const allCells = document.querySelectorAll('td[title]');
        const cells = Array.from(allCells).filter(cell => 
          this.matchesLanguage(cell.getAttribute('title'), language)
        );
        
        totalCellsFound += cells.length;
        
        if (cells.length > 0) {
          console.log(`[CF Enhancer] Found ${cells.length} cells for language: ${language}`);
        }
        
        // Add colorization classes
        if (optColorize) {
          cells.forEach(cell => {
            cell.classList.add(spec[1]);
          });
        }
        
        // Process attempt counts (simplified without jQuery)
        if (optShowAttempts) {
          this.addAttemptCountsVanilla(cells);
        }
      }
      
      // Handle highlighting based on cookies (vanilla JS)
      this.setupLanguageHighlightingVanilla(spec, cookieKey);
    }
    
    console.log(`[CF Enhancer] Total cells found: ${totalCellsFound}`);
    
    // Debug: Check what cells exist on the page
    const allTdWithTitle = document.querySelectorAll('td[title]');
    console.log(`[CF Enhancer] Total td elements with title attribute: ${allTdWithTitle.length}`);
    if (allTdWithTitle.length > 0) {
      console.log('[CF Enhancer] Sample titles:', 
        Array.from(allTdWithTitle).slice(0, 5).map(el => el.getAttribute('title'))
      );
    }
  }

  /**
   * Add attempt counts to cells (vanilla JS)
   * @param {Array} cells - Array of cell elements
   */
  addAttemptCountsVanilla(cells) {
    cells.forEach(cell => {
      const title = cell.getAttribute('title');
      if (!title) return;
      
      // Parse attempts from title
      let commaIndex = title.length - 1;
      while (commaIndex >= 0 && title[commaIndex] !== ',') {
        commaIndex--;
      }
      
      if (commaIndex > 0) {
        let plusIndex = commaIndex - 1;
        while (plusIndex >= 0 && title[plusIndex] !== '+') {
          plusIndex--;
        }
        plusIndex++;
        
        const cellTimeElement = cell.querySelector('.cell-time');
        if (cellTimeElement && plusIndex < commaIndex) {
          const attempts = title.substring(plusIndex, commaIndex);
          const currentValue = cellTimeElement.innerHTML;
          cellTimeElement.innerHTML = `${currentValue} (${attempts})`;
        }
      }
    });
  }

  /**
   * Setup language highlighting functionality (vanilla JS)
   * @param {Array} spec - Language specification
   * @param {string} cookieKey - Cookie key for persistence
   */
  setupLanguageHighlightingVanilla(spec, cookieKey) {
    const className = spec[1];
    const elements = document.querySelectorAll(`td.${className}`);
    
    // Apply highlighting if cookie is set
    if (this.getCookie(cookieKey) === '1') {
      elements.forEach(el => el.classList.add('highlight-by-lang'));
    }
    
    // Add click handler for toggling highlight
    elements.forEach(element => {
      element.addEventListener('click', () => {
        const isHighlighted = this.getCookie(cookieKey) === '1';
        
        if (isHighlighted) {
          this.setCookie(cookieKey, '0', -1); // Expire cookie
        } else {
          this.setCookie(cookieKey, '1');
        }
        
        // Toggle highlight class on all elements with this language
        const allElements = document.querySelectorAll(`td.${className}`);
        allElements.forEach(el => el.classList.toggle('highlight-by-lang'));
      });
    });
  }

  /**
   * Get cookie value
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value
   */
  getCookie(name) {
    // Try Codeforces.getCookie first if available
    if (window.Codeforces && window.Codeforces.getCookie) {
      return window.Codeforces.getCookie(name);
    }
    
    // Fallback to manual cookie parsing
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    
    return null;
  }

  /**
   * Set cookie value
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Days until expiration (optional)
   */
  setCookie(name, value, days = 365) {
    let expires = '';
    
    if (days < 0) {
      // Delete cookie by setting past expiration date
      expires = '; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    } else {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}`;
    }
    
    document.cookie = `${name}=${value}${expires}; path=/; domain=.codeforces.com`;
    console.log(`[CF Enhancer] Cookie set: ${name}=${value} (expires: ${expires})`);
  }
}

// Initialize when script loads
console.log('[CF Enhancer] ColorizeStandings script loaded');
console.log('[CF Enhancer] Current URL check:', {
  url: window.location.href,
  hasContest: window.location.href.includes('/contest/'),
  hasGym: window.location.href.includes('/gym/'),
  hasSpectator: window.location.href.includes('/spectator/'),
  hasStandings: window.location.href.includes('/standings')
});

// Check for standings page more broadly
const shouldInitialize = window.location.href.includes('/contest/') || 
                        window.location.href.includes('/gym/') || 
                        window.location.href.includes('/spectator/') ||
                        window.location.href.includes('/standings');

if (shouldInitialize) {
  console.log('[CF Enhancer] Initializing ColorizeStandingsFeature');
  
  // Initialize immediately or when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[CF Enhancer] DOM loaded, creating ColorizeStandingsFeature');
      new ColorizeStandingsFeature();
    });
  } else {
    console.log('[CF Enhancer] DOM already loaded, creating ColorizeStandingsFeature');
    new ColorizeStandingsFeature();
  }
} else {
  console.log('[CF Enhancer] Not a standings page, skipping ColorizeStandingsFeature');
}
