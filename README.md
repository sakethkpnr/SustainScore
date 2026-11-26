# SustainScore — Final Capstone Application

**Project:** Sustainable Cloud Infrastructure Maturity Assessment for Adoption Decisions

SustainScore is a full-stack research prototype for assessing public cloud-infrastructure repositories using observable GitHub maintenance signals. It supports per-user accounts, repository analysis, saved repository library, batch analysis, comparison, history, configurable indicator weights, theme/accent preferences, and CSV/PDF report export.

## Feature coverage
- **O2 — Repository maturity assessment:** samples repository metadata, contributors, commits, releases and issues; calculates five transparent heuristic indicators (contributor diversity, release continuity, commit activity, issue maintenance and maintainer distribution).
- **O3 — Adoption decision support:** overview dashboard, repository comparison (2–5 saved repositories), saved library, analysis history and downloadable reports.
- Register/login with hashed passwords and JWT-protected API routes.
- Settings: set each indicator percentage from 0–100; percentages must total exactly 100%. Saved weights apply to future analyses.
- Appearance: light/dark mode and selectable accent colours.
- CSV export from a repository analysis and history; PDF export uses the browser print dialog (choose “Save as PDF”).
- Bulk analyze up to 10 public GitHub repositories per batch.

## Technology
React + Vite + React Router + Axios + Recharts; FastAPI + SQLAlchemy + JWT; MySQL 8; GitHub REST API.

## Requirements
Python 3.10+, Node.js 18+, MySQL 8+.

## 1. Create database
Run `database/schema.sql` in MySQL Workbench, or:
```bash
mysql -u root -p < database/schema.sql
```
The application creates its tables on backend startup using SQLAlchemy.

## 2. Backend setup (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```
Edit `backend/.env`: set `DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/sustainscore_db`, a long random `SECRET_KEY`, `FRONTEND_ORIGIN=http://localhost:5173`, and optionally `GITHUB_TOKEN`. URL-encode special characters in the database password (for example `@` as `%40`). Never share or commit `.env`.

Start backend from the `backend` folder:
```powershell
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

## 3. Frontend setup
Open a second terminal:
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```
Open the Vite URL, usually http://localhost:5173. Frontend API base defaults to `http://127.0.0.1:8000/api`.

## 4. First use
1. Register and log in.
2. Analyze a public repository, e.g. `https://github.com/kubernetes/kubernetes`.
3. Save it to your repository library.
4. Add more repositories individually or in batches of up to 10.
5. Compare 2–5 saved repositories and review the indicator breakdown.
6. View previous runs in Analysis History.
7. Configure scoring percentages and appearance in Settings.
8. Use CSV export or PDF export; for PDF, select “Save as PDF” in the print dialog.

## Research limitations
Scores are **initial heuristic proxies** based on sampled public GitHub API data. They are not a trained model, causal measures, or validated predictions of future maintenance continuity. Contributor/release/commit/issue sampling has API limits and does not capture every project practice. Configurable weights express the user's assessment priorities; they do not establish scientific validity. Existing history entries preserve their original scores; changed weights affect future analyses only.

## Security notes
Passwords are hashed; protected API endpoints require JWT. This is a development capstone build. For production, use secure HttpOnly cookies, CSRF protections, stricter CORS, rate limiting, secret management, and security review.


## Detailed repository reports (CSV and PDF)

- Repository analysis exports include repository identity, URL, description, language, license, branch, creation/push dates, stars, forks, watchers, open issues, repository size, archive/fork status, topics, maturity score, maturity level, all five O2 indicator scores, configured weights, contributor samples, recent commit authors, release details, and language breakdown when GitHub returns those fields.
- CSV exports are structured as section / field / value rows so that variable-length contributor, release, and language details are not discarded.
- PDF exports open a dedicated print-ready SustainScore report. Choose **Save as PDF** in the browser print dialog.
- Comparison page keeps the direct two-repository input workflow. It accepts `owner/repository` and full GitHub URLs, and comparison CSV/PDF exports include both repositories' details plus side-by-side metrics.

The extra contributor, release, and language fields are samples returned by the public GitHub API. Optional detail endpoints can be unavailable due to API permissions or rate limits; the core analysis will still provide the fields it successfully retrieves.
