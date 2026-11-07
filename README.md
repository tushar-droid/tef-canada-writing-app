# 🍁 TEF Canada — Expression Écrite

> **Native macOS Desktop Application for TEF Canada French Writing Test Preparation**  
> Built with **Tauri v2**, **React 19**, **TypeScript**, and **Rust**. Powered by **Google Gemini 3.0** & **Local Models (Ollama / LM Studio)**.

---

## 🎯 Overview

**TEF Canada Expression Écrite** is a high-performance native desktop application designed to prepare candidates for the Canadian immigration French language test (**TEF Canada / Expression Écrite**). 

It replicates authentic test conditions under strict time limits, scores your performance against official **Canadian Language Benchmarks (NCLC 4 to 10+)**, and provides deep pedagogical diagnostics with interactive colored error underlines, sub-score analysis, actionable English grammar rules, and complete reference Model Band 9 essays.

---

## ✨ Key Features

### 1. ⏱️ Strict Exam Simulator
- **Task 1 (Section A — Fait Divers)**: 25-minute countdown, minimum 80 words.
- **Task 2 (Section B — Lettre d'opinion argumentée)**: 35-minute countdown, minimum 200 words.
- **French Accents Toolbar**: Built-in accent character inserter (`é`, `è`, `ê`, `ë`, `à`, `â`, `ù`, `û`, `ô`, `î`, `ï`, `ç`, `œ`, `æ`, `«`, `»`, `’` + uppercase `⇧`) positioned directly above the text area with cursor position preservation.
- **Zero Distractions**: Strictly mirrors test center conditions—no hints, suggestions, or grammar assists during test-taking.
- **Auto-Submission**: Automatically closes and evaluates upon timer expiration.

### 2. 📚 145 Official TEF Canada Question Bank & Smart Non-Repetition
- **Task 1**: All **72 official story starters** (*Faits divers*).
- **Task 2**: All **73 official debate topics** (*Lettres d'opinion*).
- **Smart Non-Repetition Rotation**: Questions never repeat until all topics in that task category have been completed. Live progress indicators show remaining vs completed prompts.
- **Practice Again**: Retry any specific attempted topic at will from the review view.

### 3. 🔍 Diagnostic Review Dashboard & In-Text Error Underlining
- **Interactive Color-Coded Underlining**: Candidate essays highlight errors by frequency impact:
  - 🔴 **Red (High / Recurring)**: Repeated systemic slips (e.g. subjunctive mood, auxiliary agreement).
  - 🟡 **Yellow (Moderate)**: Occasional slips and syntax weaknesses.
  - 🟢 **Green (Rare / Style)**: Isolated slips or C1 stylistic upgrade opportunities.
- **Click-to-Inspect**: Clicking any underlined phrase in the essay smoothly scrolls directly to the corresponding **Target Remediation** card on the right.
- **Full Band 9 Model Answer**: Displayed in its entirety directly below your essay submission for immediate paragraph-by-paragraph comparison.
- **TEF Sub-Scores Analysis (NCLC 2026 Grid)**: Visual progress bars for *Cohérence & Organisation*, *Lexique (Vocabulaire)*, *Respect de la consigne & Longueur*, and *Correction grammaticale & Syntaxe*.
- **Top 3 KPI Cards**: Instant summary of your NCLC score, cadence/length adherence, and primary recurring error category.

### 4. 🧠 Pedagogical Guidance in English
- The French questions, candidate submissions, and Band 9 reference models remain in authentic French.
- **All error explanations, grammar rules, and "How to Avoid" tips are delivered in clear English** to maximize comprehension for candidates preparing for Canadian immigration benchmarks (NCLC 7+).

### 5. 📄 Native macOS PDF Export
- Exports a complete, beautifully formatted multi-page diagnostic report with a single click.
- Saves directly to `~/Downloads/TEF_Canada_Report_<task>_<timestamp>.pdf` and automatically opens in **macOS Preview**.
- Path-traversal sanitized with automatic font and ligature normalization.

### 6. 🤖 Google Gemini 3.0 & Local Model Integration
- **Google Gemini 3.0 Family**:
  - `gemini-3-flash-preview` (Recommended primary model for fast, accurate French evaluation).
  - `gemini-3.1-pro-preview` (Frontier reasoning & complex discourse analysis).
  - `gemini-3.5-flash` (Next-gen efficiency).
  - `gemini-3-flash-lite` (Lightweight, optimal fallback under heavy load).
- **Automatic Fallback Failover**: If the primary model experiences high demand, rate limits (HTTP 429), or temporary outages (HTTP 503), the evaluation automatically fails over to your configured fallback model.
- **Local Models**: Native compatibility with **Ollama** and **LM Studio** (`mistral`, `llama3`, `qwen2.5`) via standard OpenAI-compatible endpoints.
- **Unclipped Error Diagnostics**: Full error details with a one-click copy button.

### 7. 🌐 Bilingual Interface & macOS Native Dialogs
- Instant segmented toggle between **English (EN)** and **French (FR)** across all screens.
- Custom macOS modal confirmation dialogs replacing browser `window.confirm` for 100% reliable deletion of past attempts.

---

## 🏗️ Architecture & Tech Stack

```
├── src/
│   ├── components/         # Modular React components
│   │   ├── AccentBar.tsx        # French accent characters toolbar
│   │   ├── AnnotatedEssay.tsx   # Interactive in-text error underlining
│   │   ├── AttemptDetailView.tsx# Dark IDE review dashboard matching blueprint
│   │   ├── ConfirmModal.tsx     # Native macOS confirmation dialog
│   │   ├── ExamView.tsx         # Strict exam workspace with timer & word counter
│   │   ├── HistoryView.tsx      # Past attempts list & progress analytics
│   │   ├── HomeView.tsx         # App landing hub
│   │   ├── LanguageSwitch.tsx   # Segmented EN/FR toggle
│   │   ├── LLMSettingsModal.tsx # Gemini 3.0 & Local model config with test ping
│   │   ├── TaskSelectView.tsx   # Task 1 / Task 2 picker with rotation tracking
│   │   └── Timer.tsx            # High-precision non-drifting countdown timer
│   ├── data/
│   │   ├── officialQuestions.ts # Full bank of 145 official TEF questions
│   │   └── dummyAttempts.ts     # Pre-loaded benchmark samples (att-001, att-002, att-003)
│   ├── i18n/
│   │   └── translations.ts      # Bilingual dictionary (EN / FR)
│   ├── utils/
│   │   ├── llmService.ts        # Gemini 3.0 & Ollama REST clients with failover
│   │   ├── pdfExport.ts         # Multi-page jsPDF report generation
│   │   └── storage.ts           # LocalStorage persistence & frequency calculations
│   ├── App.css                  # Custom obsidian/slate dark theme (#070b13)
│   ├── App.tsx                  # Main router state machine
│   └── types.ts                 # TypeScript domain interfaces
└── src-tauri/
    ├── src/
    │   ├── lib.rs               # Rust backend commands (save_pdf_report, opener)
    │   └── main.rs              # Application entrypoint
    └── tauri.conf.json          # Native macOS window & security config
```

---

## 🚀 Getting Started

### Prerequisites
- **macOS** 12.0 or higher
- **Node.js** v18+ (tested on Node v20+)
- **Rust** & **Cargo** (installed via `rustup`)
- **Xcode Command Line Tools** (`xcode-select --install`)

### Installation & Run

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development application**:
   ```bash
   npm run tauri dev
   ```

3. **Build the production macOS application (.app / .dmg)**:
   ```bash
   npm run tauri build
   ```
   The compiled bundle will be located in `src-tauri/target/release/bundle/dmg/`.

---

## 🔒 Security & Privacy

- **100% Local-First Data**: All essay drafts, completed test attempts, and scores are stored exclusively in your local application storage. No telemetry or tracking.
- **Secure API Key Handling**: API keys are saved locally on-device and transmitted directly to the user's chosen provider (`generativelanguage.googleapis.com` or local `localhost:11434`) using standard encrypted HTTPS headers (`x-goog-api-key`). Keys are never logged or exposed in URLs.
- **Path-Traversal Sanitized File Output**: The native PDF exporter strictly sanitizes output filenames and restricts output to the user's `~/Downloads` directory.

---

## 📜 License

Private educational software designed for TEF Canada candidate preparation.
