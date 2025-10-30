/**
 * Simple development server for Media Manager API
 * Run with: node dev-server.js
 */

import express from 'express';
import cors from 'cors';
import formidable from 'formidable';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const PORT = 3001; // Backend API on 3001, frontend on 3000 or 5502

// Enable CORS for local development
app.use(cors());
app.use(express.json());

// List media files endpoint
app.get('/api/media/list', async (req, res) => {
    try {
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        if (!API_KEY || !SITE_ID) {
            return res.status(500).json({
                success: false,
                error: 'Missing WIX_API_KEY or WIX_SITE_ID'
            });
        }

        console.log('📡 Fetching media files from Wix...');

        const response = await fetch(
            'https://www.wixapis.com/site-media/v1/files',
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'wix-site-id': SITE_ID
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Wix API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // DEBUG: Log all files to see what Wix returns
        console.log(`📋 Total files from Wix: ${data.files?.length || 0}`);
        const allMediaTypes = [...new Set(data.files?.map(f => f.mediaType) || [])];
        console.log(`📊 Media types present: ${allMediaTypes.join(', ')}`);

        // Check for any font-like files by filename
        const potentialFonts = data.files?.filter(f =>
            f.displayName?.match(/\.(woff|woff2|ttf|otf)$/i) ||
            f.fileName?.match(/\.(woff|woff2|ttf|otf)$/i)
        ) || [];
        console.log(`🔤 Font files found by extension: ${potentialFonts.length}`);
        if (potentialFonts.length > 0) {
            potentialFonts.forEach(f => {
                console.log(`   → ${f.displayName || f.fileName} (mediaType: ${f.mediaType})`);
            });
        }

        // Check for DOCUMENT type files
        const documentFiles = data.files?.filter(f => f.mediaType === 'DOCUMENT') || [];
        console.log(`📄 Total DOCUMENT type files: ${documentFiles.length}`);
        if (documentFiles.length > 0) {
            console.log(`   First 5 documents:`);
            documentFiles.slice(0, 5).forEach(f => {
                console.log(`   → ${f.displayName || f.fileName}`);
            });
        }

        // Filter for images, videos, document files (for Lottie), and fonts
        const mediaFiles = (data.files || [])
            .filter(file => {
                const isImage = file.mediaType === 'IMAGE';
                const isVideo = file.mediaType === 'VIDEO';
                const isDocument = file.mediaType === 'DOCUMENT';
                // Include documents if they're JSON/Lottie files or fonts
                const isLottie = isDocument && (
                    file.displayName?.endsWith('.json') ||
                    file.displayName?.endsWith('.lottie')
                );
                const isFont = isDocument && (
                    file.displayName?.endsWith('.woff') ||
                    file.displayName?.endsWith('.woff2') ||
                    file.displayName?.endsWith('.ttf') ||
                    file.displayName?.endsWith('.otf')
                );
                return isImage || isVideo || isLottie || isFont;
            })
            .map(file => {
                // Determine MIME type based on file type and extension
                let mimeType;
                if (file.mediaType === 'IMAGE') {
                    // Check if it's a GIF by filename
                    if (file.displayName?.toLowerCase().endsWith('.gif')) {
                        mimeType = 'image/gif';
                    } else if (file.displayName?.toLowerCase().endsWith('.png')) {
                        mimeType = 'image/png';
                    } else if (file.displayName?.toLowerCase().endsWith('.webp')) {
                        mimeType = 'image/webp';
                    } else {
                        mimeType = 'image/jpeg';
                    }
                } else if (file.mediaType === 'VIDEO') {
                    mimeType = 'video/mp4';
                } else if (file.displayName?.endsWith('.json') || file.displayName?.endsWith('.lottie')) {
                    mimeType = 'application/json';
                } else {
                    mimeType = 'application/octet-stream';
                }

                return {
                    id: file.id,
                    fileName: file.displayName || file.id,
                    displayName: file.displayName || file.id,
                    fileUrl: file.url,
                    mimeType: mimeType,
                    sizeInBytes: parseInt(file.sizeInBytes) || 0,
                    width: file.media?.image?.image?.width || 0,
                    height: file.media?.image?.image?.height || 0
                };
            });

        console.log(`✅ Found ${mediaFiles.length} media files`);

        res.json({
            success: true,
            files: mediaFiles,
            count: mediaFiles.length
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Upload media file endpoint
app.post('/api/media/upload', async (req, res) => {
    try {
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        if (!API_KEY || !SITE_ID) {
            return res.status(500).json({
                success: false,
                error: 'Missing WIX_API_KEY or WIX_SITE_ID'
            });
        }

        // Parse multipart form
        const form = formidable({ multiples: false });
        const [fields, files] = await form.parse(req);

        const uploadedFile = files.file?.[0];
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }

        console.log(`📤 Uploading: ${uploadedFile.originalFilename}`);

        const fileBuffer = await fs.readFile(uploadedFile.filepath);

        // Step 1: Generate upload URL
        const uploadUrlResponse = await fetch(
            'https://www.wixapis.com/site-media/v1/files/generate-upload-url',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'wix-site-id': SITE_ID
                },
                body: JSON.stringify({
                    mimeType: uploadedFile.mimetype,
                    fileName: uploadedFile.originalFilename
                })
            }
        );

        if (!uploadUrlResponse.ok) {
            throw new Error(`Generate upload URL failed: ${uploadUrlResponse.status}`);
        }

        const uploadData = await uploadUrlResponse.json();
        const { uploadUrl } = uploadData;

        console.log(`   → Upload URL generated`);

        // Step 2: Upload file
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': uploadedFile.mimetype },
            body: fileBuffer
        });

        if (!uploadResponse.ok) {
            throw new Error(`File upload failed: ${uploadResponse.status}`);
        }

        // Step 3: Parse upload response to get file details
        const uploadResult = await uploadResponse.json();
        console.log(`   → Upload response:`, uploadResult);

        // Extract file data from upload result
        const fileData = uploadResult.file;

        if (!fileData || !fileData.url) {
            throw new Error('Upload succeeded but no file data returned');
        }

        console.log(`✅ Upload complete: ${fileData.url}`);

        // Convert relative URL to full Wix CDN URL
        let fullCdnUrl = fileData.url;
        if (!fullCdnUrl.startsWith('http')) {
            // Relative URL - prepend Wix CDN domain
            fullCdnUrl = `https://static.wixstatic.com/${fullCdnUrl}`;
            console.log(`   → Converted to full CDN URL: ${fullCdnUrl}`);
        }

        // Normalize the response to match MediaPickerModal expectations
        res.json({
            success: true,
            file: {
                id: fileData.id,
                fileName: fileData.displayName || uploadedFile.originalFilename,
                displayName: fileData.displayName || uploadedFile.originalFilename,
                fileUrl: fullCdnUrl, // Use full CDN URL instead of relative path
                mimeType: fileData.mediaType === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
                sizeInBytes: parseInt(fileData.sizeInBytes) || uploadedFile.size,
                width: fileData.media?.image?.image?.width || 0,
                height: fileData.media?.image?.image?.height || 0
            }
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Media Manager API Server`);
    console.log(`   → Running on: http://localhost:${PORT}`);
    console.log(`   → Endpoints:`);
    console.log(`      GET  /api/media/list`);
    console.log(`      POST /api/media/upload`);
    console.log(`\n✅ Ready! Use with your Live Server on any port.\n`);
});
