const { createClient } = require('@sanity/client');

// Get token and validate it
const sanityToken = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;
if (!sanityToken) {
  console.error('SANITY_API_TOKEN environment variable is not set');
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '8myqcpgd',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: sanityToken ? sanityToken.trim() : undefined,
  useCdn: false,
  apiVersion: '2024-01-01',
});

module.exports = async (req, res) => {
  // Enable CORS
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
    if (!sanityToken) {
      return res.status(500).json({ error: 'Sanity API token is not configured. Please set SANITY_API_TOKEN environment variable.' });
    }

    // Parse multipart/form-data
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Invalid content type. Expected multipart/form-data' });
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found in content-type' });
    }

    // Read request body
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      req.on('end', resolve);
      req.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);
    const parts = buffer.toString('binary').split('--' + boundary);
    
    let fileBuffer = null;
    let filename = null;
    let fileContentType = 'image/jpeg';

    for (const part of parts) {
      if (part.includes('Content-Disposition') && part.includes('filename=')) {
        const filenameMatch = part.match(/filename="([^"]+)"/);
        const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
        
        if (filenameMatch) {
          filename = filenameMatch[1];
          if (contentTypeMatch) {
            fileContentType = contentTypeMatch[1].trim();
          }
          
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd !== -1) {
            const body = part.substring(headerEnd + 4);
            const bodyEnd = body.lastIndexOf('\r\n');
            if (bodyEnd > 0) {
              fileBuffer = Buffer.from(body.substring(0, bodyEnd), 'binary');
            }
          }
          break;
        }
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload image to Sanity
    const asset = await client.assets.upload('image', fileBuffer, {
      filename: filename || 'upload.jpg',
      contentType: fileContentType,
    });

    return res.status(200).json({ 
      assetId: asset._id,
      url: asset.url 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
};
