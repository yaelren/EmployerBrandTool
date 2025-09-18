// Simple script to create a test background image using Canvas API
const { createCanvas } = require('canvas');
const fs = require('fs');

const width = 400;
const height = 300;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create a gradient background
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#ff6b35');
gradient.addColorStop(0.5, '#f7931e');
gradient.addColorStop(1, '#fff200');

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add some geometric shapes to make it visually distinct
ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
ctx.beginPath();
ctx.arc(100, 100, 50, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(300, 200, 40, 0, Math.PI * 2);
ctx.fill();

// Add text to make it obvious this is the background image
ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('TEST BACKGROUND', width/2, height/2);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(__dirname + '/test-bg.png', buffer);

console.log('Test background image created: test-bg.png');