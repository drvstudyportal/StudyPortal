const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '8myqcpgd',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
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
    // For Vercel, we'll use a simpler approach with base64 or direct buffer
    // First, try to get the file from the request
    const chunks = [];
    
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        
        // Parse multipart/form-data manually
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
          return res.status(400).json({ error: 'Invalid content type' });
        }

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
                fileBuffer = Buffer.from(body.substring(0, bodyEnd), 'binary');
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

        res.status(200).json({ 
          assetId: asset._id,
          url: asset.url 
        });
      } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: error.message || 'Upload failed' });
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
};
