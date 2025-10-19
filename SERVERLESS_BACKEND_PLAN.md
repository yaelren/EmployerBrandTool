# Serverless Backend for Media Manager Integration

## 🎯 Goal
Create a simple serverless backend to enable the Media Manager picker without CORS issues.

## 🏗️ Architecture

```
[Browser - Your Tool]
    ↓ HTTP Requests (no CORS issues)
[Serverless Functions - Vercel/Netlify]
    ↓ Has API Key & Site ID
    ↓ Calls Wix Media Manager API
[Wix Media Manager]
    ↓ Returns data
[Serverless Functions]
    ↓ Returns to browser
[Browser - Your Tool]
    ↓ Shows image picker with thumbnails
```

## 📋 Required Endpoints

### 1. **GET /api/media/list**
List all media files from Media Manager

**Request:**
```javascript
GET /api/media/list?folderId={optional}
```

**Response:**
```json
{
  "files": [
    {
      "id": "abc123",
      "fileName": "my-image.jpg",
      "displayName": "My Image",
      "fileUrl": "https://static.wixstatic.com/media/959e32_abc.jpg",
      "thumbnailUrl": "https://static.wixstatic.com/media/959e32_abc.jpg/v1/fill/w_200,h_200",
      "mimeType": "image/jpeg",
      "sizeInBytes": 125000,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

### 2. **POST /api/media/upload**
Upload file to Media Manager and return CDN URL

**Request:**
```javascript
POST /api/media/upload
Content-Type: multipart/form-data

{
  file: [binary data],
  fileName: "my-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "cdnUrl": "https://static.wixstatic.com/media/959e32_newfile.jpg",
  "fileId": "xyz789",
  "thumbnailUrl": "..."
}
```

## 🚀 Implementation Options

### Option 1: Vercel (Recommended)
- ✅ Free tier generous
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Fast edge network

**Setup Time:** 30 minutes

### Option 2: Netlify Functions
- ✅ Free tier available
- ✅ Good DX
- ✅ Integrated with static hosting

**Setup Time:** 45 minutes

### Option 3: Cloudflare Workers
- ✅ Extremely fast
- ✅ Free tier
- ⚠️ Slightly different API

**Setup Time:** 1 hour

## 📝 Code Example (Vercel)

### File: `/api/media/list.js`
```javascript
import fetch from 'node-fetch';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { folderId } = req.query;

        // Your Wix credentials (from environment variables)
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        const url = folderId
            ? `https://www.wixapis.com/site-media/v1/files?parentFolderId=${folderId}`
            : 'https://www.wixapis.com/site-media/v1/files';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'wix-site-id': SITE_ID
            }
        });

        const data = await response.json();

        return res.status(200).json({
            files: data.files || []
        });

    } catch (error) {
        console.error('Error fetching media:', error);
        return res.status(500).json({ error: error.message });
    }
}
```

### File: `/api/media/upload.js`
```javascript
import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        // Parse multipart form data
        const form = formidable({ multiples: false });
        const [fields, files] = await form.parse(req);

        const uploadedFile = files.file[0];
        const fileBuffer = fs.readFileSync(uploadedFile.filepath);

        // 1. Get upload URL from Wix
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

        const { uploadUrl, fileId } = await uploadUrlResponse.json();

        // 2. Upload file to Wix storage
        await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': uploadedFile.mimetype
            },
            body: fileBuffer
        });

        // 3. Get file details
        const fileResponse = await fetch(
            `https://www.wixapis.com/site-media/v1/files/${fileId}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'wix-site-id': SITE_ID
                }
            }
        );

        const fileData = await fileResponse.json();

        return res.status(200).json({
            success: true,
            cdnUrl: fileData.fileUrl,
            fileId: fileData.id,
            thumbnailUrl: fileData.thumbnailUrl
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message });
    }
}
```

## 🔧 Setup Steps

### 1. Create Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# In your project directory
mkdir api
cd api

# Create the two endpoint files above
```

### 2. Add Environment Variables
In Vercel dashboard:
- `WIX_API_KEY` = Your IST token
- `WIX_SITE_ID` = Your site ID

### 3. Deploy
```bash
vercel --prod
```

### 4. Update Your Tool
```javascript
// In MediaPickerModal.js - change API endpoint
const API_BASE = 'https://your-project.vercel.app/api';

async fetchFiles() {
    const response = await fetch(`${API_BASE}/media/list`);
    const data = await response.json();
    return data.files;
}

async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    return data.cdnUrl; // Return CDN URL!
}
```

## ⏱️ Time Estimate

- **Setup Vercel project:** 15 minutes
- **Write serverless functions:** 30 minutes
- **Configure environment variables:** 5 minutes
- **Update MediaPickerModal.js:** 20 minutes
- **Test and debug:** 30 minutes

**Total: ~1.5 hours**

## 🎯 End Result

After implementation:

1. **Click "Browse Media Manager"**
   - Modal opens with grid of thumbnails
   - Shows all your Media Manager files
   - Can search/filter

2. **Click an image**
   - Image loads instantly (from CDN)
   - CDN URL saved in preset
   - Preset stays tiny

3. **Upload new image**
   - Click "Upload" in picker
   - Select from desktop
   - Uploads to Media Manager via serverless function
   - Returns CDN URL
   - Image appears in tool immediately

## 💰 Cost

**Vercel Free Tier:**
- 100GB bandwidth/month
- 100 serverless function invocations/day
- Plenty for personal/demo use

**For production:**
- ~$20/month for Pro plan (if you exceed free tier)

## 🤔 Alternative: GitHub Pages + Cloudflare Workers

If you don't want to use Vercel:
- Host tool on GitHub Pages (free static hosting)
- Use Cloudflare Workers for API (free tier: 100k requests/day)
- Similar setup, different platforms
