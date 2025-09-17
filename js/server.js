// server.js
require('dotenv').config(); // Loads variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sanityClient = require('@sanity/client');

const app = express();
const port = 5100;

app.use(bodyParser.json());
app.use(cors({ origin: '*' })); 

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
});


app.get('/', (req, res) => {
  res.send('Backend server running!');
});

app.post('/api/createBlog', async (req, res) => {
  const { title, slug, publishedAt, imageUrl, body } = req.body;
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
    if (imageUrl) {
      postDoc.imageUrl = imageUrl;
    }
    const created = await client.create(postDoc);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
