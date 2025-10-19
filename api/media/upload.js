/**
 * Upload file to Wix Media Manager
 * POST /api/media/upload (multipart/form-data)
 */
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
    api: {
        bodyParser: false, // Disable default body parser for file uploads
    },
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        if (!API_KEY || !SITE_ID) {
            console.error('Missing environment variables');
            throw new Error('Missing WIX_API_KEY or WIX_SITE_ID environment variables');
        }

        // Dynamic import for node-fetch
        const fetch = (await import('node-fetch')).default;

        // Parse multipart form data
        const form = formidable({ multiples: false });
        const [fields, files] = await form.parse(req);

        const uploadedFile = files.file?.[0];
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }

        console.log('📤 Uploading file to Wix Media Manager...');
        console.log('   → Filename:', uploadedFile.originalFilename);
        console.log('   → Size:', (uploadedFile.size / 1024).toFixed(2), 'KB');
        console.log('   → Type:', uploadedFile.mimetype);

        // Read file buffer
        const fileBuffer = await fs.readFile(uploadedFile.filepath);

        // Step 1: Generate upload URL from Wix
        console.log('   → Step 1: Generating upload URL...');
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
            const errorText = await uploadUrlResponse.text();
            console.error('❌ Generate upload URL failed:', uploadUrlResponse.status, errorText);
            throw new Error(`Generate upload URL failed: ${uploadUrlResponse.status} - ${errorText}`);
        }

        const uploadData = await uploadUrlResponse.json();
        const { uploadUrl } = uploadData;
        console.log('   → Upload URL generated');

        // Step 2: Upload file to Wix storage
        console.log('   → Step 2: Uploading file to Wix storage...');
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': uploadedFile.mimetype
            },
            body: fileBuffer
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ File upload failed:', uploadResponse.status, errorText);
            throw new Error(`File upload failed: ${uploadResponse.status}`);
        }

        // Step 3: Parse upload response to get file details
        const uploadResult = await uploadResponse.json();
        console.log('   → Upload response:', uploadResult);

        // Extract file data from upload result
        const fileData = uploadResult.file;

        if (!fileData || !fileData.url) {
            throw new Error('Upload succeeded but no file data returned');
        }

        console.log('✅ Upload complete!');
        console.log('   → File URL:', fileData.url);

        // Normalize the response to match MediaPickerModal expectations
        return res.status(200).json({
            success: true,
            file: {
                id: fileData.id,
                fileName: fileData.displayName || uploadedFile.originalFilename,
                displayName: fileData.displayName || uploadedFile.originalFilename,
                fileUrl: fileData.url,
                mimeType: fileData.mediaType === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
                sizeInBytes: parseInt(fileData.sizeInBytes) || uploadedFile.size,
                width: fileData.media?.image?.image?.width || 0,
                height: fileData.media?.image?.image?.height || 0
            }
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
