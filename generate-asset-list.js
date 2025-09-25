#!/usr/bin/env node
/**
 * generate-asset-list.js - Auto-generate complete file listing for assets
 * Run this script to scan the assets folders and create a complete listing
 * 
 * Usage: node generate-asset-list.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ASSETS_DIR = './assets';
const BACKGROUNDS_DIR = path.join(ASSETS_DIR, 'backgrounds');
const SPOTS_DIR = path.join(ASSETS_DIR, 'spots');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'files.json');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

/**
 * Check if file is an image based on extension
 */
function isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Scan directory and return all image files
 */
function scanDirectory(dirPath, relativePath = '') {
    const files = [];
    
    try {
        if (!fs.existsSync(dirPath)) {
            console.log(`📁 Directory not found: ${dirPath}`);
            return files;
        }
        
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const relativeFilePath = path.join(relativePath, item).replace(/\\/g, '/'); // Normalize path separators
            
            const stats = fs.statSync(fullPath);
            
            if (stats.isFile() && isImageFile(item)) {
                files.push(relativeFilePath);
                console.log(`✅ Found: ${relativeFilePath}`);
            } else if (stats.isDirectory()) {
                // Recursively scan subdirectories
                const subFiles = scanDirectory(fullPath, relativeFilePath);
                files.push(...subFiles);
            }
        }
    } catch (error) {
        console.error(`❌ Error scanning directory ${dirPath}:`, error.message);
    }
    
    return files;
}

/**
 * Generate complete asset listing
 */
function generateAssetListing() {
    console.log('🔍 Scanning asset folders for all image files...\n');
    
    // Scan backgrounds folder
    console.log('📁 Scanning backgrounds folder...');
    const backgroundFiles = scanDirectory(BACKGROUNDS_DIR, 'backgrounds');
    
    console.log('\n📁 Scanning spots folder...');
    const spotFiles = scanDirectory(SPOTS_DIR, 'spots');
    
    // Create complete listing
    const listing = {
        backgrounds: backgroundFiles,
        spots: spotFiles,
        allFiles: [...backgroundFiles, ...spotFiles],
        generated: new Date().toISOString(),
        totalFiles: backgroundFiles.length + spotFiles.length,
        description: "Auto-generated complete listing of all image files in assets folders"
    };
    
    // Write to output file
    try {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(listing, null, 2));
        console.log(`\n✅ Generated asset listing: ${OUTPUT_FILE}`);
        console.log(`📊 Found ${backgroundFiles.length} backgrounds and ${spotFiles.length} spots (${listing.totalFiles} total)`);
        
        if (listing.totalFiles === 0) {
            console.log('\n💡 No image files found. Add images to assets/backgrounds/ and assets/spots/ folders then run this script again.');
        }
        
    } catch (error) {
        console.error(`❌ Error writing asset listing:`, error.message);
    }
    
    return listing;
}

// Run if called directly
if (require.main === module) {
    generateAssetListing();
}

module.exports = { generateAssetListing };