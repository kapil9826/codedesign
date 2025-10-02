#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Ticket Management Portal Build Process...\n');

// Build configuration
const buildConfig = {
  production: {
    mode: 'production',
    minify: true,
    sourcemap: false,
    outDir: 'dist'
  },
  staging: {
    mode: 'staging',
    minify: true,
    sourcemap: true,
    outDir: 'dist-staging'
  },
  development: {
    mode: 'development',
    minify: false,
    sourcemap: true,
    outDir: 'dist-dev'
  }
};

// Get build mode from command line arguments
const buildMode = process.argv[2] || 'production';
const config = buildConfig[buildMode];

if (!config) {
  console.error(`❌ Invalid build mode: ${buildMode}`);
  console.log('Available modes: production, staging, development');
  process.exit(1);
}

console.log(`📦 Building for ${buildMode} mode...`);

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync(config.outDir)) {
    fs.rmSync(config.outDir, { recursive: true, force: true });
  }

  // Install dependencies
  console.log('📥 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the application
  console.log('🔨 Building application...');
  const buildCommand = `npm run build${buildMode === 'production' ? '' : `:${buildMode}`}`;
  execSync(buildCommand, { stdio: 'inherit' });

  // Create build info file
  const buildInfo = {
    buildTime: new Date().toISOString(),
    mode: buildMode,
    version: JSON.parse(fs.readFileSync('package.json', 'utf8')).version,
    nodeVersion: process.version,
    buildConfig: config
  };

  fs.writeFileSync(
    path.join(config.outDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  // Display build results
  console.log('\n✅ Build completed successfully!');
  console.log(`📁 Output directory: ${config.outDir}`);
  console.log(`📊 Build mode: ${buildMode}`);
  console.log(`⏰ Build time: ${buildInfo.buildTime}`);
  
  // Show build size
  if (fs.existsSync(config.outDir)) {
    const stats = fs.statSync(config.outDir);
    console.log(`📦 Build size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('\n🎉 Build process completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the build: npm run preview');
  console.log('2. Deploy to your server');
  console.log('3. Configure your web server to serve the static files');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

