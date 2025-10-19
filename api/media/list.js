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

        // Filter for images and videos only, and normalize the response
        const mediaFiles = (data.files || [])
            .filter(file => {
                const isImage = file.mediaType === 'IMAGE';
                const isVideo = file.mediaType === 'VIDEO';
                return isImage || isVideo;
            })
            .map(file => ({
                id: file.id,
                fileName: file.displayName || file.id,
                displayName: file.displayName || file.id,
                fileUrl: file.url,  // Normalize Wix's 'url' to 'fileUrl'
                mimeType: file.mediaType === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
                sizeInBytes: parseInt(file.sizeInBytes) || 0,
                width: file.media?.image?.image?.width || 0,
                height: file.media?.image?.image?.height || 0
            }));

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
