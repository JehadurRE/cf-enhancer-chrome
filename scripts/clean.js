/**
 * Clean script for CF Enhancer Chrome Extension
 * @author JehadurRE
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const packageDir = path.join(__dirname, '..', 'packages');

function removeDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`🗑️  Removed ${path.basename(dir)} directory`);
  } else {
    console.log(`ℹ️  ${path.basename(dir)} directory doesn't exist`);
  }
}

function main() {
  console.log('🧹 Cleaning CF Enhancer build files...\n');
  
  try {
    removeDirectory(distDir);
    removeDirectory(packageDir);
    
    console.log('\n✅ Clean completed successfully!');
    console.log('💡 Run "npm run build" to create a fresh build');
    
  } catch (error) {
    console.error('\n❌ Clean failed:', error.message);
    process.exit(1);
  }
}

main();
