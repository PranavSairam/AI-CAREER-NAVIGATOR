# AI Career Navigator

A full-stack web application that helps students and early-career professionals discover suitable career paths based on their skills, education, and interests.

---

## How to run

```bash
npm install
node server.js
```

Open: http://localhost:3000/login.html

Optional: copy `config/env.example` to `.env` in the project root and set `SESSION_SECRET`.

---

## Documentation (SEPM)

- **Full project specification:** `docs/SEPM_PROJECT_DOCUMENTATION.txt`
- **Folder layout:** `docs/FOLDER_STRUCTURE.txt`

---

## Folder structure (summary)

```
ai-career-navigator/
├── server.js              Entry point
├── package.json
├── config/
│   └── env.example        Copy to .env at project root (optional)
├── data/                  SQLite DB created here at runtime (see .gitignore)
├── docs/                  Academic / detailed documentation
├── public/                Static UI
│   ├── css/style.css
│   ├── js/script.js
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── recommendations.html
│   ├── explore.html
│   └── goals.html
├── src/                   Express app, routes, services, DB
└── tests/                 Placeholder for automated tests
```

---

## Tech stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express.js |
| Database | SQLite (sqlite3) |
| Auth | express-session + bcryptjs |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Fonts | Google Fonts (Inter + Poppins) |

---

## AI / matching logic

- Matches profile text against ten predefined careers (keywords + education bonus).
- Returns top five careers with match scores and six-step learning roadmaps.
- Results stored in SQLite; generation history stored per run.

Supported careers: Data Scientist, Software Developer, UI/UX Designer, Cybersecurity Analyst, Cloud Engineer, Full Stack Developer, AI/ML Engineer, Business Analyst, Mobile App Developer, Product Manager.
