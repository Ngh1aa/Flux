# Flux — Multi-Currency Business Finance

**Flux** is a B2B Fintech Desktop SaaS prototype designed to help finance teams manage international payments and team spending without losing visibility or control.

This project was developed strictly using a **"precise / institutional / efficient"** aesthetic, and focuses on visualizing the complex workflows of financial operations through a signature **Approval Rail**.

## 🚀 Features

- **Hero Flow (Payments & Approval Rail):** An end-to-end simulation of creating a high-value transfer that dynamically visualizes the approval control chain (Draft → Manager Review → CFO Approval → Executed) alongside an immutable activity trail.
- **Approval Policy Builder:** A rule-based interface for finance teams to define custom approval logic (e.g., `IF amount > 10000 AND currency != base_currency THEN REQUIRE Finance Manager + CFO`).
- **Fully Static Architecture:** Built entirely with Vanilla HTML, CSS, and JS. It requires no build step and is perfectly optimized for immediate deployment via GitHub Pages.
- **Institutional UI System:** Custom-built design system emphasizing clarity, structure, and accessibility, using inline SVGs for iconography to remain fully static.

## 🛠 Tech Stack

- **HTML5:** Semantic and accessible document structure.
- **Vanilla CSS3:** Custom CSS variable-driven design system (`style.css`).
- **Vanilla JavaScript:** DOM manipulation for form interactions and Approval Rail logic (`app.js`).
- *(No frameworks, no build tools, no dependencies)*

## 📂 Project Structure

```text
/
├── index.html       # Main Entry (Payments Dashboard & Approval Rail Demo)
├── settings.html    # Settings Dashboard (Approval Policy Builder Demo)
├── style.css        # Centralized Design System & Utility Classes
├── app.js           # Client-side Interaction Logic
├── PROJECT-CONTEXT.md # Detailed UX/Product Context & Requirements
└── README.md        # Project Documentation
```

## 🏁 How to Run

Because Flux is completely static, you do not need Node.js or any local development servers to run it.

1. Clone the repository:
   ```bash
   git clone https://github.com/Ngh1aa/Flux.git
   ```
2. Open `index.html` directly in any modern web browser.
3. To view the Policy Builder, click on the **Settings** icon in the sidebar or open `settings.html`.

## 🌐 Deployment (GitHub Pages)

This project is structured specifically to be hosted on GitHub Pages:
1. Go to your repository **Settings** on GitHub.
2. Navigate to **Pages** in the left sidebar.
3. Under **Build and deployment**, set the **Source** to `Deploy from a branch`.
4. Select `main` (or your primary branch) and `/ (root)` folder.
5. Click **Save**. Your site will be live shortly.
