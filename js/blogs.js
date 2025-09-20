// blogs.js simplified version, no asset upload:
const sanityClient = require("@sanity/client");

const client = sanityClient({
  projectId: '8myqcpgd',
  dataset: 'production',
  token: process.env.SANITY_WRITE_TOKEN, // secret! do NOT expose client-side
  useCdn: false,
  apiVersion: '2024-01-01',
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const { title, publishedAt, imageUrl, body } = req.body;

  if (!title || !body) {
    res.status(400).json({ error: 'Missing title or body' });
    return;
  }

  try {
    const postDoc = {
      _type: 'post',
      title,
      slug: { _type: "slug", current: slug },
      publishedAt,
      body: [{ _type: "block", children: [{ _type: "span", text: body }] }]
    };

    if (imageUrl) {
      // Store image as URL in a string field (change schema accordingly)
      postDoc.imageUrl = imageUrl;
    }

    const post = await client.create(postDoc);

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
