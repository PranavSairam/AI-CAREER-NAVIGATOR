const { CAREERS } = require('../data/careers');
const { stableBonus } = require('../utils');

/**
 * Deterministic scoring: keyword matches + education bonus + stable per-user tie-break.
 * Returns top 5 careers with match_score 45–99.
 */
function generateRecommendations(skills, interests, education, userId = 0) {
  const text = `${skills} ${interests} ${education}`.toLowerCase();
  const eduLower = (education || '').toLowerCase();

  const techEdu = ['computer', 'engineering', 'software', 'it', 'information technology'].some(k => eduLower.includes(k));

  const scored = CAREERS.map(career => {
    let score = 0;
    career.keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10;
    });

    if (techEdu && ['Software Developer', 'Full Stack Developer', 'Data Scientist', 'AI / ML Engineer', 'Cloud Engineer'].includes(career.title)) {
      score += 8;
    }

    score += stableBonus(userId, career.title);

    const match_score = Math.min(45 + score, 99);
    return {
      career_title: career.title,
      match_score,
      description: career.description,
      learning_path: JSON.stringify(career.path)
    };
  });

  return scored.sort((a, b) => b.match_score - a.match_score).slice(0, 5);
}

module.exports = { generateRecommendations };
