const express = require('express');
const { CAREERS, getCareerBySlug } = require('../data/careers');

const router = express.Router();

router.get('/careers', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  let list = CAREERS.map(c => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    keyword_count: c.keywords.length
  }));

  if (q) {
    list = list.filter(
      c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.slug.includes(q)
    );
  }

  res.json({ success: true, careers: list, total: list.length });
});

router.get('/careers/:slug', (req, res) => {
  const career = getCareerBySlug(req.params.slug);
  if (!career) {
    return res.status(404).json({ success: false, error: 'Career not found.' });
  }
  res.json({
    success: true,
    career: {
      slug: career.slug,
      title: career.title,
      description: career.description,
      keywords: career.keywords,
      learning_path: career.path
    }
  });
});

module.exports = router;
