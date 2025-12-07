// server.js
require('dotenv').config(); // Loads variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

const app = express();
const port = 5100;

app.use(cors({ origin: '*' }));

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Body parser for JSON (but not for multipart/form-data)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '8myqcpgd',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
});

app.get('/', (req, res) => {
  res.send('Backend server running!');
});

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Image upload endpoint - must be before other routes that use bodyParser
app.post('/api/uploadImage', upload.single('image'), async (req, res) => {
  console.log('Upload endpoint hit');
  console.log('Request file:', req.file);
  
  if (!req.file) {
    console.log('No file in request');
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    console.log('Uploading to Sanity...');
    // Upload image to Sanity
    const asset = await client.assets.upload('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log('Upload successful:', asset._id);
    res.status(200).json({ 
      assetId: asset._id,
      url: asset.url 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Create blog endpoint
app.post('/api/createBlog', async (req, res) => {
  const { title, slug, publishedAt, imageAssetRef, body, googleDriveUrl } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Missing title or body' });
  }
  
  try {
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
    res.status(201).json(created);
  } catch (error) {
    console.error('Blog creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Test endpoint: http://localhost:${port}/api/test`);
  console.log(`Upload endpoint: http://localhost:${port}/api/uploadImage`);
  console.log(`Create blog endpoint: http://localhost:${port}/api/createBlog`);
});
