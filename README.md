# Website Localization Automation Tool

A standalone, production-quality localization automation tool consisting of a React frontend and Python FastAPI backend.

## Quick Start

### Backend (Python/FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, Backend on `http://localhost:8000`.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS (port 3000)
- **Backend**: FastAPI + SQLAlchemy + SQLite (port 8000)
- **Crawler**: BeautifulSoup (primary) + Playwright (fallback)
- **Translation Memory**: SHA256-based deduplication
- **Publishing**: Vanilla JavaScript `loc.js` with floating language switcher

## API Endpoints
- `POST /crawl` - Start crawling a project
- `GET /pages` - List all pages
- `PATCH /api/pages/{id}` - Toggle page inclusion
- `POST /api/projects/{id}/translate` - Batch translate
- `POST /api/segments/{id}/translate` - Translate single segment
- `GET /cdn/loc.js` - Get publishing snippet
