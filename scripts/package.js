/**
 * Package script for CF Enhancer Chrome Extension
 * Creates a ZIP file ready for Chrome Web Store submission
 * @author JehadurRE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '..', 'dist');
const packageDir = path.join(__dirname, '..', 'packages');

function createPackageDirectory() {
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }
  console.log('📦 Package directory ready');
}

function getVersion() {
  const manifestPath = path.join(distDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Build not found. Run "npm run build" first.');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.version;
}

function createZip() {
  const version = getVersion();
  const zipName = `cf-enhancer-v${version}.zip`;
  const zipPath = path.join(packageDir, zipName);
  
  try {
    // Remove existing zip if it exists
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    // Create ZIP using PowerShell (Windows) with proper path handling
    const distPath = distDir.replace(/\\/g, '\\\\');
    const zipPathEscaped = zipPath.replace(/\\/g, '\\\\');
    const powershellCommand = `Compress-Archive -Path '${distPath}\\*' -DestinationPath '${zipPathEscaped}' -Force`;
    
    console.log('Creating ZIP package...');
    execSync(`powershell -Command "${powershellCommand}"`, { stdio: 'pipe' });
    
    console.log(`✅ Created package: ${zipName}`);
    console.log(`📍 Location: ${zipPath}`);
    
    // Get file size
    const stats = fs.statSync(zipPath);
    const fileSizeInKB = Math.round(stats.size / 1024);
    console.log(`📏 Package size: ${fileSizeInKB} KB`);
    
    return zipPath;
    
  } catch (error) {
    throw new Error(`Failed to create ZIP: ${error.message}`);
  }
}

function validatePackage(zipPath) {
  console.log('\n🔍 Validating package...');
  
  const stats = fs.statSync(zipPath);
  const fileSizeInMB = stats.size / (1024 * 1024);
  
  if (fileSizeInMB > 50) {
    console.warn('⚠️  Warning: Package size exceeds 50MB Chrome Web Store limit');
  } else {
    console.log('✅ Package size is within Chrome Web Store limits');
  }
  
  console.log('✅ Package validation completed');
}

function showSubmissionGuide() {
  console.log('\n📋 Chrome Web Store Submission Guide:');
  console.log('   1. Go to https://chrome.google.com/webstore/devconsole/');
  console.log('   2. Click "New Item" and upload the ZIP file');
  console.log('   3. Fill in store listing details:');
  console.log('      - Name: Codeforces Enhancer by JehadurRE');
  console.log('      - Summary: Enhanced Codeforces experience with modern features');
  console.log('      - Category: Productivity');
  console.log('   4. Add screenshots and promotional images');
  console.log('   5. Set privacy practices and permissions');
  console.log('   6. Submit for review');
  console.log('\n💡 Tips:');
  console.log('   - Add detailed description mentioning original work by agul');
  console.log('   - Include screenshots of all major features');
  console.log('   - Mention Manifest V3 compliance for future-proofing');
}

function main() {
  console.log('📦 Packaging CF Enhancer Chrome Extension...\n');
  
  try {
    createPackageDirectory();
    const zipPath = createZip();
    validatePackage(zipPath);
    showSubmissionGuide();
    
    console.log('\n🎉 Packaging completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Packaging failed:', error.message);
    process.exit(1);
  }
}

main();
