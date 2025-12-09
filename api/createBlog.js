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

    const { title, slug, publishedAt, imageAssetRef, body, googleDriveUrl } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Missing title or body' });
    }
    
    const postDoc = {
      _type: 'post',
      title,
      slug: { _type: 'slug', current: slug },
      publishedAt,
      body: [{ _type: 'block', children: [{ _type: 'span', text: body }] }],
    };
    
    // Add image reference if provided
    if (imageAssetRef) {
      postDoc.image = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAssetRef
        }
      };
    }
    
    // Add Google Drive URL if provided
    if (googleDriveUrl) {
      postDoc.googleDriveUrl = googleDriveUrl;
    }
    
    const created = await client.create(postDoc);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Creation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create blog post' });
  }
};
