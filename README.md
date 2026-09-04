# Web Crawling Translation Tool (LocTool)

A comprehensive, browser-first website localization platform. This tool allows users to crawl any target website, extract its text content, translate it into multiple languages, and deploy a lightweight JavaScript snippet to render those translations live on the original site without touching the backend infrastructure.

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

## 🗺️ User Flow

1. **Create a Project:** Enter the target website URL and select a target language.

2. **Crawl & Extract:** The tool performs a breadth-first search to map the site and extract text segments.

3. **Review & Translate:** Open the **Editor** tab to view side-by-side strings. Use the "Translate All" function to utilize the external APIs.

4. **Preview:** Open the **Live Demo** tab to view the fully translated website with all original styles intact.

5. **Deploy:** Click **Publish Page Snippet** to generate the JavaScript integration code.

## 🔧 How the Embed Snippet Works

The generated JavaScript one-liner (`<script src=".../api/embed/1.js" defer></script>`) operates entirely on the client side:

1. It reads `window.location.pathname` to identify the active page.

2. It fetches the specific JSON translation map for that path.

3. It recursively traverses the DOM (`node.nodeType === 3`) to match and safely replace `textContent`, ensuring HTML structure, CSS classes, and JavaScript event listeners remain perfectly intact.
