# SustainScore — Final Capstone Application

### Sustainable Cloud Infrastructure Maturity Assessment for Adoption Decisions

SustainScore is a full-stack capstone research prototype that assesses
the maintenance maturity of public cloud-infrastructure and cloud-native
software repositories using observable GitHub activity data. It is
designed to support repository review and adoption discussions by
looking beyond popularity indicators such as stars and forks.

The application retrieves public repository metadata through the GitHub
REST API, calculates five transparent heuristic indicators, combines
them using user-configurable weights, and presents the results through
an interactive dashboard, repository comparison, saved library, analysis
history, and downloadable reports.

> **Research status:** The current implementation is an initial,
> GitHub-signal-based heuristic assessment prototype. Its scores are not
> trained-model outputs, causal measures, or validated predictions of
> future maintenance continuity. It does not, by itself, measure
> workload-level energy use, carbon emissions, runtime efficiency, or
> prove that a repository is suitable for production adoption.

------------------------------------------------------------------------

## Table of contents

-   [Objectives](#objectives)
-   [Features](#features)
-   [Assessment indicators](#assessment-indicators)
-   [Technology stack](#technology-stack)
-   [System architecture](#system-architecture)
-   [Project structure](#project-structure)
-   [Requirements](#requirements)
-   [Local installation and setup](#local-installation-and-setup)
    -   [1. Clone the repository](#1-clone-the-repository)
    -   [2. Create the MySQL database](#2-create-the-mysql-database)
    -   [3. Configure and run the
        backend](#3-configure-and-run-the-backend)
    -   [4. Configure and run the
        frontend](#4-configure-and-run-the-frontend)
-   [Using SustainScore](#using-sustainscore)
-   [API overview](#api-overview)
-   [Exports](#exports)
-   [Scoring methodology](#scoring-methodology)
-   [Limitations and interpretation](#limitations-and-interpretation)
-   [Security considerations](#security-considerations)
-   [Future development](#future-development)

------------------------------------------------------------------------

## Objectives

The application provides a practical workflow to:

1.  Inspect maintenance-related signals from public GitHub repositories.
2.  Calculate and explain five repository-level indicators.
3.  Combine the indicators into a maturity score using configurable
    weights.
4.  Compare repository assessments and retain a user's analysis history.
5.  Export assessment details for review and research documentation.

The project is aligned with the capstone's focus on reproducible
repository-maintenance evidence and sustainability-indicator assessment.
The current software implementation should be understood as the
GitHub-data prototype, not as completion of every workload-validation or
independent-acceptance activity described in the wider project
specification.

## Features

### Account and user workspace

-   User registration and login.
-   Passwords are stored as password hashes.
-   JWT bearer-token authentication protects application API routes.
-   Each user has their own analysis history, saved repository list, and
    indicator-weight settings.
-   Profile page for viewing account information.

### Repository analysis

-   Analyze a public GitHub repository using either `owner/repository`
    or a GitHub repository URL.
-   Retrieve repository metadata, contributors, commits, releases,
    issues, and language breakdown where available.
-   Display the overall maturity score and maturity level.
-   Display the five indicator scores and selected repository details.
-   Save an analyzed repository to the user's repository library.

### Batch analysis and repository library

-   Analyze and save up to **10 public GitHub repository URLs per
    batch**.
-   Display successful and failed items in the batch result.
-   View and refresh the saved repository library.

### Repository comparison

-   Compare two public GitHub repositories through the comparison page.
-   Enter repositories using `owner/repository` or full GitHub
    repository URLs.
-   View a side-by-side indicator chart and repository metrics.
-   Export comparison results as CSV or PDF.

### Analysis history

-   View previous assessments associated with the signed-in account.
-   Review the repository, score, maturity level, and analysis date.
-   Delete an individual history entry.
-   Export the history list.

### Configurable scoring and appearance

-   Configure the percentage weight for each of the five indicators.
-   Each weight must be between 0 and 100, and all five weights must
    total exactly **100%**.
-   Updated weights apply to future analyses; existing history entries
    retain their original calculated scores.
-   Choose light or dark appearance.
-   Choose an accent colour.

### CSV and PDF reports

-   Export detailed repository analysis data to CSV.
-   Export analysis history to CSV.
-   Export repository analysis, comparison, and history reports to
    print-ready PDF using the browser print dialog. Select **Save as
    PDF** in the dialog.

------------------------------------------------------------------------

## Assessment indicators

The current implementation calculates five initial heuristic indicators
from sampled GitHub API responses.

  -----------------------------------------------------------------------
  Indicator                           What it represents in the prototype
  ----------------------------------- -----------------------------------
  Contributor diversity               Number of contributors returned by
                                      the sampled contributors endpoint.

  Release continuity                  Number of releases returned by the
                                      sampled releases endpoint.

  Commit activity                     Number of commits returned by the
                                      sampled commits endpoint.

  Issue maintenance                   Proportion of sampled,
                                      non-pull-request issues that are
                                      closed.

  Maintainer distribution             A score derived from the share of
                                      sampled contributions attributed to
                                      the top contributor.
  -----------------------------------------------------------------------

The indicator values are normalized to a 0--100 range by the current
heuristic formulas. User-defined weights are applied to calculate the
overall maturity score.

### Default weights

  Indicator                   Default weight
  ------------------------- ----------------
  Contributor diversity                  25%
  Release continuity                     25%
  Commit activity                        20%
  Issue maintenance                      15%
  Maintainer distribution                15%
  **Total**                         **100%**

### Maturity bands

        Score Displayed maturity level
  ----------- --------------------------
      80--100 High
    60--79.99 Moderate
    40--59.99 Developing
     Below 40 Low

These bands are prototype presentation categories, not externally
validated maturity standards.

------------------------------------------------------------------------

## Technology stack

  Layer                     Technologies
  ------------------------- ------------------------------------------------
  Frontend                  React 18, Vite, React Router
  UI and charts             CSS, Lucide React, Recharts
  HTTP client               Axios
  Backend                   Python, FastAPI, Uvicorn
  ORM and database driver   SQLAlchemy, PyMySQL
  Database                  MySQL 8+
  Authentication            JWT, Passlib password hashing
  External data             GitHub REST API
  Reports                   Browser-generated CSV and print-ready HTML/PDF

## System architecture

``` mermaid
flowchart TD
    A[User] --> B[React + Vite frontend]
    B -->|HTTP requests / JWT bearer token| C[FastAPI backend]
    C --> D[Authentication and user settings]
    C --> E[GitHub analysis service]
    E -->|Public repository data| F[GitHub REST API]
    C --> G[SQLAlchemy ORM]
    G --> H[(MySQL database)]
    C -->|Analysis results and history| B
    B --> I[Dashboard, comparison and reports]
```

------------------------------------------------------------------------

## Project structure

``` text
SustainScore/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth_routes.py
│   │   │   ├── history_routes.py
│   │   │   ├── repository_routes.py
│   │   │   └── settings_routes.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── github_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env.example
│   └── requirements.txt
├── database/
│   └── schema.sql
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── README.md
```

------------------------------------------------------------------------

## Requirements

Install the following before running the application:

-   Python 3.10 or later.
-   Node.js 18 or later and npm.
-   MySQL 8 or later.
-   Git.
-   A GitHub personal access token is optional but recommended for
    higher GitHub API rate limits when analyzing public repositories.

------------------------------------------------------------------------

## Local installation and setup

The commands below use **Windows PowerShell**. Run the backend and
frontend in two separate terminal windows.

### 1. Clone the repository

``` powershell
git clone YOUR_GITHUB_REPOSITORY_URL
cd SustainScore
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of your GitHub
repository.

### 2. Create the MySQL database

Start your MySQL server.

From the project root, run the schema script:

``` powershell
mysql -u root -p < database/schema.sql
```

Alternatively, open `database/schema.sql` in MySQL Workbench and execute
it.

The script creates the `sustainscore_db` database. The FastAPI
application creates the application tables through SQLAlchemy when the
backend starts.

### 3. Configure and run the backend

Open PowerShell:

``` powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `backend/.env` and set the values:

``` env
DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/sustainscore_db
SECRET_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
ACCESS_TOKEN_EXPIRE_MINUTES=60
GITHUB_TOKEN=
FRONTEND_ORIGIN=http://localhost:5173
```

Configuration notes:

-   Replace `YOUR_MYSQL_PASSWORD` with your local MySQL password.
-   Generate a long, random value for `SECRET_KEY`.
-   `GITHUB_TOKEN` is optional. Add a token if you have one to improve
    the available GitHub API rate limit.
-   Keep `FRONTEND_ORIGIN` set to the exact local frontend origin.
-   URL-encode special characters in the database password when placing
    it in the connection URL. For example, encode `@` as `%40`.
-   Never commit or share your real `.env` file or credentials.

Start the backend from the `backend` directory:

``` powershell
python -m uvicorn app.main:app --reload
```

Backend base URL:

``` text
http://127.0.0.1:8000
```

Interactive API documentation:

``` text
http://127.0.0.1:8000/docs
```

Health endpoint:

``` text
http://127.0.0.1:8000/health
```

### 4. Configure and run the frontend

Open a **second** PowerShell terminal at the project root:

``` powershell
cd frontend
npm install
Copy-Item .env.example .env
```

The frontend `.env` should contain:

``` env
VITE_API_URL=http://127.0.0.1:8000/api
```

Start the Vite development server:

``` powershell
npm run dev
```

Open the local URL printed by Vite. The default is:

``` text
http://localhost:5173
```

Keep both terminal windows running while using the application.

------------------------------------------------------------------------

## Using SustainScore

1.  Open the frontend and create an account.
2.  Sign in to your account.
3.  Open **Analyze Repository** and enter a public GitHub repository,
    for example:
    -   `kubernetes/kubernetes`
    -   `hashicorp/terraform`
    -   `helm/helm`
4.  Review the overall maturity score, maturity band, indicator
    breakdown, and available repository details.
5.  Save repositories that you want to keep in your library.
6.  Open **Add Repository** to analyze and save up to 10 repository URLs
    in one batch. Enter one full GitHub URL per line.
7.  Open **Compare Repositories** and enter two different public
    repositories to compare them.
8.  Open **Analysis History** to review or export previous assessments.
9.  Open **Settings** to adjust the five indicator weights. Ensure the
    total equals 100%.
10. Export individual analysis, comparison, or history reports as CSV or
    PDF.

------------------------------------------------------------------------

## API overview

The backend exposes the following main route groups. All application
routes under `/api` require a valid JWT bearer token except registration
and login.

  ------------------------------------------------------------------------------------------
  Method                  Endpoint                                   Purpose
  ----------------------- ------------------------------------------ -----------------------
  `POST`                  `/api/auth/register`                       Create a user account.

  `POST`                  `/api/auth/login`                          Sign in and receive a
                                                                     JWT.

  `GET`                   `/api/auth/me`                             Get the current user's
                                                                     profile.

  `POST`                  `/api/repositories/analyze`                Analyze a public GitHub
                                                                     repository.

  `POST`                  `/api/repositories/bulk-analyze`           Analyze and save up to
                                                                     10 repositories.

  `POST`                  `/api/repositories/compare`                Compare 2--5
                                                                     repositories saved to
                                                                     the user's account.

  `POST`                  `/api/repositories/save/{repository_id}`   Save a repository to
                                                                     the user's library.

  `GET`                   `/api/repositories/saved`                  List the user's saved
                                                                     repositories.

  `GET`                   `/api/history`                             List the user's
                                                                     analysis history.

  `GET`                   `/api/history/{analysis_id}`               Retrieve one history
                                                                     record.

  `DELETE`                `/api/history/{analysis_id}`               Delete one history
                                                                     record.

  `GET`                   `/api/settings/weights`                    Read the user's
                                                                     indicator weights.

  `PUT`                   `/api/settings/weights`                    Update indicator
                                                                     weights; total must
                                                                     equal 100%.
  ------------------------------------------------------------------------------------------

Use `http://127.0.0.1:8000/docs` to inspect request schemas and try the
API interactively.

**Comparison note:** The current frontend comparison page accepts two
repository identifiers/URLs and analyzes them live. The backend also
exposes a saved-repository comparison endpoint that accepts between two
and five saved repository IDs.

------------------------------------------------------------------------

## Exports

### Repository analysis CSV

The repository report includes repository identity and URL, description,
language, license, branch, creation and push dates, stars, forks,
watchers, open issues, size, archive/fork status, topics, maturity score
and level, indicator scores, configured weights, and available
contributor, recent-author, release, and language details.

### Comparison CSV/PDF

Comparison exports include side-by-side repository metrics and the
available detailed report data for both repositories.

### History CSV/PDF

History exports include repository, GitHub URL, maturity score, maturity
level, and analysis timestamp.

PDF reports are opened in a print-ready browser window. Choose **Save as
PDF** in the browser's print dialog.

------------------------------------------------------------------------

## Scoring methodology

The current prototype uses the following transparent calculations on the
sampled GitHub API results:

-   **Contributor diversity:** `min(100, sampled_contributor_count × 5)`
-   **Maintainer distribution:**
    `max(0, min(100, 100 − top_contributor_share_percentage))`
-   **Commit activity:** `min(100, sampled_commit_count)`
-   **Release continuity:** `min(100, sampled_release_count × 10)`
-   **Issue maintenance:**
    `(sampled_closed_issues ÷ sampled_non_pull_request_issues) × 100`;
    if no eligible issues are returned, the prototype assigns a neutral
    value of 50.

The overall score is the weighted sum of the five indicator scores. The
configured weights are normalized during calculation and are saved per
user. The Settings page enforces a total of exactly 100%.

GitHub API sampling currently requests up to 100 contributors, 100
commits, 20 releases, and 100 issues for the core indicators. Repository
metadata and language details are also requested. These are samples, not
complete repository histories.

------------------------------------------------------------------------

## Limitations and interpretation

-   The indicators are initial heuristic proxies. They have not been
    scientifically validated against future maintenance outcomes.
-   Contributor count and top-contributor share are calculated from the
    contributors returned by GitHub, not necessarily every contributor
    in the repository's history.
-   Commit, release, and issue values reflect bounded API samples and
    can vary as repositories change.
-   GitHub API rate limits, permissions, endpoint availability, and
    repository visibility can affect returned data. An optional GitHub
    token can improve the available rate limit.
-   A high score does not prove security, quality, reliability,
    sustainability, or suitability for a particular workload.
-   Stars, forks, watchers, and other popularity-related metadata are
    displayed as context; they are not direct substitutes for
    maintenance evidence.
-   The current implementation does not collect direct energy, carbon,
    power, runtime, or infrastructure-cost measurements.
-   The current implementation does not implement a validated predictive
    model or an independent workload/fault-injection acceptance harness.
    Those activities require separate evidence and validation beyond the
    present GitHub-signal prototype.
-   Configurable weights represent the assessment priorities selected by
    the user; they do not establish scientific validity.
-   Existing history records retain the scores calculated at the time of
    analysis. Updating weights changes future analyses only.

Use the results as decision-support evidence for further review, not as
an automatic adoption decision.

------------------------------------------------------------------------

## Security considerations

This repository is a capstone research prototype and should be reviewed
before public production use.

-   Passwords are stored as hashes; authentication uses JWT bearer
    tokens.
-   The frontend stores the JWT in browser `localStorage`. This is
    convenient for the prototype but increases exposure if the
    application has a cross-site scripting vulnerability.
-   Use HTTPS in deployment.
-   Keep database credentials, GitHub tokens, and `SECRET_KEY` in
    environment variables or a managed secret store.
-   Never commit `.env` files, tokens, database passwords, or private
    user data.
-   Configure CORS with only the required frontend origin.
-   A production deployment should add security review, rate limiting,
    robust token/session handling (preferably secure HttpOnly cookies
    where appropriate), CSRF protections if cookie-based authentication
    is adopted, monitoring, backups, and database access controls.

------------------------------------------------------------------------

## Future development

Possible next research and engineering steps include:

-   Validate the indicator definitions and scoring thresholds against a
    documented reference dataset.
-   Add time-series analysis to distinguish sustained maintenance from
    short-term activity.
-   Add evidence provenance, sampling timestamps, and reproducibility
    metadata to every assessment.
-   Incorporate workload-level sustainability measurements such as
    energy, resource utilization, and carbon-intensity evidence.
-   Develop and independently validate prediction and acceptance-testing
    components before presenting them as adoption recommendations.
-   Add automated tests for scoring, API behavior, authentication, and
    failure/recovery scenarios.

------------------------------------------------------------------------

## Acknowledgement

SustainScore is developed as a capstone research prototype focused on
sustainable cloud infrastructure and maintenance-informed adoption
decisions. Repository metadata is retrieved from the public GitHub REST
API; repository owners retain ownership of their projects and data.
