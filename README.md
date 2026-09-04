# Web Crawling Translation Tool (LocTool)

A comprehensive, browser-first website localization platform. This tool allows users to crawl any target website, extract its text content, translate it into multiple languages, and deploy a lightweight JavaScript snippet to render those translations live on the original site without touching the backend infrastructure.

## 🎥 Demo Video

[Watch the LocTool Demo Video](https://drive.google.com/file/d/1E4hniZJhDjS05R6WTMxADQnTgNbb_FEB/view?usp=sharing)

## 🚀 Key Features

* **Automated Web Crawler (BFS):** Navigates through target websites to extract meaningful text segments (headings, paragraphs, buttons, lists) while ignoring non-translatable layout elements (nav, footer).
* **Bilingual Translation Editor:** A side-by-side workspace to review source text and apply translations manually, or utilize auto-translation via cascaded AI fallback services.
* **Live Interactive Demo:** A built-in iframe sandbox that injects translated text directly into the target website's DOM. It utilizes `<base href="...">` tag injection to ensure all original CSS, layout, and image assets load flawlessly without Cross-Origin (CORS) blocks.
* **JavaScript Snippet Generator:** Dynamically creates a single `<script src="...">` tag. When embedded into a client's website, this script detects the current URL, fetches localized segments, and safely mutates text nodes in real time without breaking event listeners or structural HTML.

## 🛠️ Technology Stack

**Frontend (Client & Editor UI)**

* **Core:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, custom design system, Lucide React icons
* **Routing:** React Router v6
* **State Management:** React Hooks, local storage persistence
* **DOM Parsing:** Native Browser `DOMParser`, custom text segmenter logic

**Backend & Services**

* **Server:** FastAPI (Python), Uvicorn
* **Translation Pipeline:** MyMemory API, Lingva API, Local Dictionary (multi-tier fallback system)
* **Data Storage (Current):** In-memory mock database (`USE_MOCK=true`) for fast demonstration environments.

## 🧠 Architecture & Strategy

- **Frontend**: React + Vite + Tailwind CSS (port 3000)
- **Backend**: FastAPI + SQLAlchemy + SQLite (port 8000)
- **Crawler**: BeautifulSoup (primary) + Playwright (fallback)
- **Translation Memory**: SHA256-based deduplication
- **Publishing**: Vanilla JavaScript `loc.js` with floating language switcher

### DOM-Matching Strategy (Publish Snippet)

The publish snippet utilizes **exact text-content matching** on isolated text nodes. Instead of using regex on raw `innerHTML` (which risks destroying injected data attributes, inline styles, or React/Vue event listeners), the script recursively traverses the DOM tree. When it finds a text node (`node.nodeType === 3`), it trims whitespace and looks up the exact string in a fetched JSON translation map. If a match is found, it directly updates `node.textContent`, leaving the surrounding HTML structure flawlessly intact.

### Client-Side Rendering (CSR) Support

Currently, the crawler relies on standard HTTP fetching and the browser's native `DOMParser`. Therefore, it fully supports **static HTML and SSR (Server-Side Rendered)** pages. It does *not* currently execute JavaScript during the crawl phase. To support heavy CSR/SPA applications (like standard React or Vue apps without SSR), the architecture would need to be extended with a headless browser (e.g., Puppeteer or Playwright) in the backend.

## 📂 Project Structure

```text
web-crawler-translator/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI components (Editor, Tables, Modals)
│   │   ├── hooks/            # Data layer and API communication (useApi.ts)
│   │   ├── lib/              # Core logic (textSegmenter, translationApi, snippet)
│   │   ├── pages/             # Main views (Dashboard, Editor, Live Demo)
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # FastAPI Server
│   ├── api/                  # API route handlers
│   ├── crawler/              # Server-side extraction logic
│   ├── services/             # Translation and proxy services
│   ├── main.py               # Application entry point
│   └── requirements.txt
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** (v16+) and **pnpm** (or npm/yarn)
- **Python** (3.9+)

### 1. Frontend Setup

Navigate to the frontend directory, install dependencies, and start the Vite development server.

```bash
cd frontend
pnpm install
pnpm run dev
```

The application will be available at `http://localhost:5173`.

### 2. Backend Setup

Navigate to the backend directory, set up a Python virtual environment, and run the FastAPI server.

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 42101
```

The backend API will be available at `http://localhost:42101`.

## API Endpoints
- `POST /crawl` - Start crawling a project
- `GET /pages` - List all pages
- `PATCH /api/pages/{id}` - Toggle page inclusion
- `POST /api/projects/{id}/translate` - Batch translate
- `POST /api/segments/{id}/translate` - Translate single segment
- `GET /cdn/loc.js` - Get publishing snippet

## 🗺️ User Flow

1. **Create a Project:** Enter the target website URL and select a target language.

2. **Crawl & Extract:** The tool performs a breadth-first search to map the site and extract text segments.

3. **Review & Translate:** Open the **Editor** tab to view side-by-side strings. Use the "Translate All" function to utilize the external APIs.

4. **Preview:** Open the **Live Demo** tab to view the fully translated website with all original styles intact.

5. **Deploy:** Click **Publish Page Snippet** to generate the JavaScript integration code.

## 🚧 Known Limitations & Future Improvements

To transition this prototype into a production-grade system (e.g., scaling to 1,000+ pages), the following architectural improvements are mapped out:

1. **Persistent Storage:** Replace the current in-memory mock database (`USE_MOCK=true`) with PostgreSQL to persist projects, pages, and translations across sessions.

2. **Server-Side Crawler Engine:** Shift the crawler from the client browser to the FastAPI backend using `asyncio` and `aiohttp`. This will allow concurrent fetching, bypass CORS issues entirely, and prevent browser memory crashes on large sites.

3. **Queueing & Rate Limiting:** Introduce Redis or RabbitMQ to manage URL frontiers, handle retry logic with exponential backoff, and enforce target-server rate limits and `robots.txt` compliance.

4. **Translation Memory & Diffing:** Implement intelligent re-crawling that only flags changed segments, and a global translation memory database to reuse translations across different projects and pages automatically.
