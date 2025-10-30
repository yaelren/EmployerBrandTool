/**
 * List all media files from Wix Media Manager
 * GET /api/media/list
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        if (!API_KEY || !SITE_ID) {
            console.error('Missing environment variables:', {
                hasApiKey: !!API_KEY,
                hasSiteId: !!SITE_ID
            });
            throw new Error('Missing WIX_API_KEY or WIX_SITE_ID environment variables');
        }

        console.log('📡 Fetching media files from Wix Media Manager...');
        console.log('   → Site ID:', SITE_ID);

        // Dynamic import for node-fetch (ES modules support)
        const fetch = (await import('node-fetch')).default;

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
            console.error('❌ Wix API error:', response.status, errorText);
            throw new Error(`Wix API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // DEBUG: Log all files to see what Wix returns
        console.log(`📋 Total files from Wix: ${data.files?.length || 0}`);
        const allMediaTypes = [...new Set(data.files?.map(f => f.mediaType) || [])];
        console.log(`📊 Media types present: ${allMediaTypes.join(', ')}`);

        // Check for any font-like files
        const potentialFonts = data.files?.filter(f =>
            f.displayName?.match(/\.(woff|woff2|ttf|otf)$/i) ||
            f.fileName?.match(/\.(woff|woff2|ttf|otf)$/i)
        ) || [];
        console.log(`🔤 Potential font files found: ${potentialFonts.length}`);
        if (potentialFonts.length > 0) {
            potentialFonts.forEach(f => {
                console.log(`   → ${f.displayName || f.fileName} (mediaType: ${f.mediaType})`);
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
                const displayName = file.displayName?.toLowerCase() || '';

                if (file.mediaType === 'IMAGE') {
                    // Check if it's a GIF by filename
                    if (displayName.endsWith('.gif')) {
                        mimeType = 'image/gif';
                    } else if (displayName.endsWith('.png')) {
                        mimeType = 'image/png';
                    } else if (displayName.endsWith('.webp')) {
                        mimeType = 'image/webp';
                    } else {
                        mimeType = 'image/jpeg';
                    }
                } else if (file.mediaType === 'VIDEO') {
                    mimeType = 'video/mp4';
                } else if (displayName.endsWith('.json') || displayName.endsWith('.lottie')) {
                    mimeType = 'application/json';
                } else if (displayName.endsWith('.woff')) {
                    mimeType = 'font/woff';
                } else if (displayName.endsWith('.woff2')) {
                    mimeType = 'font/woff2';
                } else if (displayName.endsWith('.ttf')) {
                    mimeType = 'font/ttf';
                } else if (displayName.endsWith('.otf')) {
                    mimeType = 'font/otf';
                } else {
                    mimeType = 'application/octet-stream';
                }

                return {
                    id: file.id,
                    fileName: file.displayName || file.id,
                    displayName: file.displayName || file.id,
                    fileUrl: file.url,  // Normalize Wix's 'url' to 'fileUrl'
                    mimeType: mimeType,
                    sizeInBytes: parseInt(file.sizeInBytes) || 0,
                    width: file.media?.image?.image?.width || 0,
                    height: file.media?.image?.image?.height || 0
                };
            });

        console.log(`✅ Found ${mediaFiles.length} media files`);

        return res.status(200).json({
            success: true,
            files: mediaFiles,
            count: mediaFiles.length
        });

    } catch (error) {
        console.error('❌ Error fetching media:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
