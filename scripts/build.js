/**
 * Build script for CF Enhancer Chrome Extension
 * @author JehadurRE
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

function createDistDirectory() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

function copyFiles() {
  const filesToCopy = [
    'manifest.json',
    'options.html',
    'optionsPage.js',
    'popup.html',
    'popup.js',
    'logo_16x16.png',
    'logo_48x48.png',
    'logo_128x128.png'
  ];

  filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, distPath);
      console.log(`📄 Copied ${file}`);
    } else {
      console.warn(`⚠️  Warning: ${file} not found`);
    }
  });
}

function copyDirectories() {
  const dirsToCopy = ['utils', 'features'];

  dirsToCopy.forEach(dir => {
    const srcDirPath = path.join(srcDir, dir);
    const distDirPath = path.join(distDir, dir);

    if (fs.existsSync(srcDirPath)) {
      fs.mkdirSync(distDirPath, { recursive: true });
      
      const files = fs.readdirSync(srcDirPath);
      files.forEach(file => {
        const srcFilePath = path.join(srcDirPath, file);
        const distFilePath = path.join(distDirPath, file);
        
        if (fs.statSync(srcFilePath).isFile()) {
          fs.copyFileSync(srcFilePath, distFilePath);
          console.log(`📁 Copied ${dir}/${file}`);
        }
      });
    }
  });
}

function updateManifest() {
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update version with build timestamp
  const now = new Date();
  const buildNumber = now.getFullYear().toString().slice(-2) + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
  
  manifest.version = `2.0.${buildNumber}`;
  manifest.version_name = `v${manifest.version} (Built ${now.toISOString().split('T')[0]})`;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`🔢 Updated version to ${manifest.version}`);
}

function main() {
  console.log('🚀 Building CF Enhancer Chrome Extension...\n');
  
  try {
    createDistDirectory();
    copyFiles();
    copyDirectories();
    updateManifest();
    
    console.log('\n✅ Build completed successfully!');
    console.log(`📦 Extension files are in: ${distDir}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Load the dist folder in Chrome Developer Mode');
    console.log('   2. Test all features on Codeforces');
    console.log('   3. Run "npm run zip" to create distribution package');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
