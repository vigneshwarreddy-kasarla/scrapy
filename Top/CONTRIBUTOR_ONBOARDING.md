# Scrapy Project - Contributor Setup Guide

This guide is for any developer who clones this repository and needs to set up the project, connect to GitHub, and raise a pull request.

Repository: `https://github.com/KarthikeyaSuppa/Scrapy.git`

---

## 1) Applications to Install

Install these before starting:

- **Git** (latest)
- **Java 21 (JDK)** for backend
- **Maven wrapper is included** (`mvnw.cmd`), so standalone Maven is optional
- **Node.js 20+** and **npm** for frontend
- **Docker Desktop** (for PostgreSQL via compose)
- **PostgreSQL client tool** (optional but useful, e.g., DBeaver/psql)
- **VS Code / IntelliJ** (any IDE)
- **GitHub CLI (`gh`)** (optional, but helpful for PR flow)

Quick checks:

```bash
git --version
java --version
node --version
npm --version
docker --version
gh --version
```

---

## 2) Setup / Preparation Steps

### Clone and open

```bash
git clone https://github.com/KarthikeyaSuppa/Scrapy.git
cd Scrapy
```

### Start database (Docker)

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with:

- DB: `foodapp`
- User: `postgres`
- Password: `postgres`

### Run backend

From `backend/`:

```bash
.\mvnw.cmd -DskipTests spring-boot:run
```

Backend runs at: `http://localhost:8080`

### Run frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 3) Files to Create / Update and Required Changes

### Backend config (optional overrides)

Main config file: `backend/src/main/resources/application.yml`

Defaults already work locally with Docker DB.  
If needed, export env vars before backend run:

- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

### Frontend config

Create local env file:

- Copy `frontend/.env.example` to `frontend/.env.local`

Set if backend is not on default host:

```env
VITE_API_URL=http://localhost:8080
```

### Important seeded data notes

- Flyway migrations run automatically on backend start.
- Current dev seed migrations include menu/orders/reviews and image URL updates.
- If you need a clean reset:
  1. `cd backend`
  2. `docker compose down -v`
  3. `docker compose up -d`
  4. Restart backend

---

## 4) Connect to Private GitHub Repo (Token or SSH Key)

## Option A: HTTPS + Personal Access Token (PAT)

1. GitHub -> Settings -> Developer settings -> Personal access tokens.
2. Create token with at least: `repo` scope.
3. Use HTTPS remote (already set):
   - `https://github.com/KarthikeyaSuppa/Scrapy.git`
4. On push, use:
   - Username: your GitHub username
   - Password: your PAT (not your GitHub password)

Optional credential caching:

```bash
git config --global credential.helper manager-core
```

## Option B: SSH Key

1. Generate key:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

2. Add public key (`~/.ssh/id_ed25519.pub`) to GitHub SSH keys.
3. Change remote:

```bash
git remote set-url origin git@github.com:KarthikeyaSuppa/Scrapy.git
```

4. Test:

```bash
ssh -T git@github.com
```

---

## 5) Branch Workflow + Push + PR to Main Repository

### Create feature branch

```bash
git checkout -b feat/your-change-name
```

### Work, commit, push

```bash
git add .
git commit -m "Add <short summary of change>"
git push -u origin feat/your-change-name
```

### Create Pull Request

Using GitHub UI:
- Open repo -> Compare & pull request -> set base branch.

Using GitHub CLI:

```bash
gh pr create --title "Your PR title" --body "Summary and test notes"
```

### Suggested PR template content

- What changed
- Why this change
- How to test
- Screenshots (if frontend UI change)
- Risks / rollback notes

---

## Review Flow

Once PR is raised, maintainers can review, request changes, or merge.  
If changes are requested:

```bash
git add .
git commit -m "Address PR review comments"
git push
```

The same PR updates automatically.

---

## Quick Troubleshooting

- **Backend fails on Flyway migration conflict**: check duplicate migration version numbers.
- **Images not visible**: ensure backend is running and image URL is reachable under `/dummyimages/...`.
- **Port already in use (8080/5173)**: stop old process or use another port.
- **Login fails for seed users**: confirm DB was reset and backend migrations reran successfully.
