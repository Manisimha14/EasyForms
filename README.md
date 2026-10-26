# Easy Forms

> **A modern, full-stack form studio and response analytics platform with time-limited availability scheduling and Formly AI intelligence.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-68a063?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47a248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1-6baa35?style=flat-square&logo=openapi-initiative)](https://spec.openapis.org/oas/v3.1.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-f97316?style=flat-square)](LICENSE)

---

## Problem Statement

### What problem are you solving?
Creating, distributing, and analyzing custom web forms usually requires navigating cumbersome enterprise software, paying costly subscriptions for basic features, or wrestling with disconnected third-party tools. Most existing form builders suffer from:
- **Tedious Form Creation**: Manually crafting and configuring dozens of questions, field types, and answer choices is slow and repetitive.
- **Lack of Native Scheduling**: Managing registration deadlines, RSVP cutoffs, or event opening hours typically requires manually toggling forms on and off at odd hours.
- **Shallow Response Insights**: Exporting raw CSV files to third-party spreadsheet software to manually calculate distributions, count preferences, and detect trends creates cognitive overhead.
- **Fragmented Developer Experience**: Backend APIs often lack interactive documentation, strict contract validation, or clean rate-limiting.

---

## Target Users

### Who is the application built for?
- **Educators & Academic Organizers**: Building college event registrations, symposium check-ins, campus surveys, and timed knowledge quizzes.
- **Product & Customer Experience Teams**: Gathering customer feedback, NPS surveys, feature satisfaction ratings, and bug reports.
- **Hiring Managers & Recruiters**: Collecting structured candidate applications, portfolios, and availability dates.
- **Event Planners & Caterers**: Collecting dietary requirements, meal preferences, and attendee counts with strict RSVP closing deadlines.
- **Small Business Owners & Freelancers**: Gathering client intake details, project scopes, and quotes without enterprise subscriptions.

---

## Solution

### How does your product solve the problem?
**Easy Forms** delivers a unified, production-ready form creation and analytics studio built with a warm orange-and-white SaaS aesthetic. It couples an intuitive React 19 frontend with a hardened Express/MongoDB backend:
- **Natural Language Creation**: **Formly AI** turns natural language descriptions into structured questions, validated field types, and answer choices with selective question insertion.
- **Built-in Time-Limited Availability**: Automatically open and close forms based on scheduled start and end timestamps, complete with respondent countdown timers.
- **Interactive Response Intelligence**: Chat directly with **Formly AI** over submitted datasets to extract summaries, breakdown metrics, and actionable recommendations.
- **End-to-End Reliability**: Secured with JWT authentication (access & refresh rotation), optimistic concurrency control (ETags/revisions), rate-limiting, and 100% test coverage across 19 test suites.

---

## Key Features

### What can users actually do?

### 📋 Form Designer & Templates
- **11 Question Types**: Short Text, Long Text, Number, Yes/No, Email, Single Select, Multi Select, Checkbox, Dropdown, 5-Star Rating, and Date picker.
- **Ready-Made Templates**: Pre-configured templates for College Event Registrations, Customer Feedback, Contact Inquiries, Job Applications, and Quizzes.
- **Reordering & Validation**: Drag-and-drop or reorder questions, enforce required status, character limits, date ranges, and custom placeholders.
- **Live Preview**: Test forms in real time across Desktop and Mobile viewports without saving or publishing.

### 🤖 Formly AI Studio
- **AI Form Generator**: Describe a form in natural language (e.g., *"Knowing about the food preferences of the person, dietary restrictions, and spice tolerance"*). Formly AI drafts tailored questions, choices, and types.
- **Selective Insertion**: Choose and toggle specific generated questions before inserting them into the form.
- **Formly AI Response Analyst**: An interactive chatbot embedded in the responses dashboard that performs real-time data analysis, detects trends, calculates percentages, and suggests next steps with formatted markdown.

### ⏱️ Time-Based Availability Scheduling
- **Start & End Deadlines**: Define exact dates and times when a form begins and stops accepting responses.
- **Automatic Status Badges**: Forms display clear status indicators: `Scheduled`, `Open`, or `Closed`.
- **Respondent Countdown**: When viewing a scheduled form, respondents receive an active countdown timer until the form opens or closes.
- **Response Caps**: Automatically close submissions when a maximum response quota is reached.

### 📊 Responses & Analytics
- **Live Response Feed**: Paginated submissions table with inspect drawer for detailed single-response viewing.
- **Streaming CSV Export**: Fast, token-authenticated CSV download for reporting.
- **Metrics Dashboard**: Visual completion counts, response distribution bars, and submission timeline trends.

### 🔔 Transactional Email Notifications
- **Respondent Confirmation**: Instant email submission receipt sent to respondents with submitted answers.
- **Owner Notification**: Instant email alert to the form owner upon every new submission.
- **Google SMTP & Mock Modes**: Reliable delivery via SMTP with automatic mock logging fallback for local testing.

---

---

## Tech Stack

### What technologies did you use?

#### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) — Lightning-fast HMR and reactive UI rendering.
- **Routing**: [React Router DOM v7](https://reactrouter.com/) — Declarative client-side routing, protected auth routes, and public form links.
- **Styling**: [Tailwind CSS v3.4](https://tailwindcss.com/) with a warm orange (`#F97316`) and warm white (`#FFFDF9`) design token system (`tokens.css`).
- **Icons**: [Lucide React](https://lucide.dev/) — Clean, consistent UI iconography.
- **Charts**: [Recharts](https://recharts.org/) — Responsive submission analytics and distribution visualizers.
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/) — Fluid feedback for user actions.
- **QR Code Generation**: [qrcode](https://www.npmjs.com/package/qrcode) — Direct QR code generation for instant mobile form sharing.

#### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v20+ ES Modules) — High-throughput asynchronous server execution.
- **Web Framework**: [Express 4](https://expressjs.com/) — Lightweight REST API framework with modular route controllers.
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose 9](https://mongoosejs.com/) — Flexible document schemas, indexed lookup, and optimistic concurrency revision checks.
- **Validation**: [Zod 4](https://zod.dev/) — Runtime contract enforcement for request bodies, query params, and answer payloads.
- **Security**: [Helmet](https://helmetjs.github.io/), [CORS](https://www.npmjs.com/package/cors), [bcryptjs](https://www.npmjs.com/package/bcryptjs), and [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) (JWT rotation).
- **Rate Limiting**: [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) — Brute-force protection on public submit and authentication endpoints.
- **Logging**: [Pino](https://getpino.io/) & [pino-http](https://github.com/pinojs/pino-http) — Structured, high-performance JSON logging with correlation IDs.
- **Email Delivery**: [Nodemailer](https://nodemailer.com/) — Dual-mode SMTP delivery (Gmail SSL/TLS) and mock logging fallback.

#### AI & Intelligence Engine
- **Formly AI**: Dual-engine intelligence utilizing Groq (`openai/gpt-oss-120b`) for sub-second responses and Google Gemini (`gemini-flash-latest`), backed by an offline heuristic fallback rule engine.

#### Testing & Documentation
- **Test Framework**: [Jest 30](https://jestjs.io/) + [Supertest 7](https://github.com/ladjs/supertest) + [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) (19 suites, 177 unit & integration tests).
- **API Documentation**: [OpenAPI 3.1.0](https://spec.openapis.org/oas/v3.1.0) specification.
- **Interactive UI**: [@scalar/express-api-reference](https://scalar.com/) embedded at `/api-docs`.

---

## Architecture

### Explain the major components of your application.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      Client Layer (React 19 + Vite)                    │
│   · Form Studio (Visual Builder & Live Preview)                        │
│   · Formly AI Studio (Modal Generator & Responses Chatbot Analyst)     │
│   · Analytics Dashboard (Charts, Counts, Timelines, & CSV Export)      │
│   · Public Respondent View (Dynamic Validators, Countdown Timers)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│                   Backend API Gateway (Express 4)                      │
│   · Global Error Handler & Pino Request Logger (x-request-id)          │
│   · Security Middleware: Helmet, CORS, Rate Limiters                   │
│   · Authentication Middleware: Dual-Token JWT (Access + Refresh)       │
├───────────────────────────────────┬────────────────────────────────────┤
│           Core Modules            │              Services              │
│   · /api/v1/auth                  │   · TokenService (Sign & Verify)   │
│   · /api/v1/forms                 │   · FormAvailabilityService        │
│   · /api/v1/public                │   · AnswerValidatorService         │
│   · /api/v1/responses             │   · EmailNotificationService       │
│   · /api/v1/analytics             │   · FormlyAIService (Groq/Gemini)  │
│   · /api/v1/ai                    │   · AnalyticsEngine                │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
┌─────────────────▼─────────────────┐  ┌───────────────▼─────────────────┐
│           Data Layer              │  │      External Integrations      │
│   · MongoDB Atlas / Local DB      │  │   · Groq Cloud API              │
│   · Mongoose 9 ODM                │  │   · Google Gemini Generative AI │
│   · Collections: Users, Forms,    │  │   · SMTP Mail Server (Gmail)    │
│     Responses, Tokens             │  │   · Scalar OpenAPI Reference    │
└───────────────────────────────────┘  └─────────────────────────────────┘
```

#### Major Component Breakdown
1. **Client Layer (Single Page Application)**:
   - Built with React 19 and Tailwind CSS with a cohesive warm orange and warm white palette.
   - Provides a split-pane drag-and-drop form editor, availability scheduling modal, live preview viewport toggles (Desktop/Mobile), and an interactive Formly AI chatbot analyst.
2. **Backend API Gateway**:
   - Centralizes route routing under `/api/v1`, assigns distinct `x-request-id` headers for end-to-end tracing, enforces strict Helmet HTTP headers, applies CORS whitelisting, and isolates unauthenticated public submission traffic with dedicated rate limiters.
3. **Core Domain Modules**:
   - **Auth Module**: Handles registration, login, logout, and silent refresh token rotation with bcrypt password hashing.
   - **Forms Module**: Handles form CRUD, publication lifecycles, availability scheduling (`startAt`, `endAt`), question validations, and revision incrementing.
   - **Public Submission Module**: Serves public form schemas and ingests submissions under optimistic concurrency locks with duplicate prevention.
   - **Responses & Analytics Module**: Provides paginated submission viewing, real-time response distribution rollups, and memory-efficient streaming CSV downloads.
   - **Formly AI Module**: Orchestrates natural language form creation and conversational analytics over collected survey responses.
4. **Service Layer**:
   - Encapsulates reusable business logic (e.g., date-based availability state machines, recursive answer validation against 11 question types, and SMTP email notifications).
5. **Data Layer**:
   - MongoDB database utilizing Mongoose schemas with compound indexes, TTL indices for expired refresh tokens, and optimistic revision tracking (`rev`) to prevent race conditions.

---

## Local Setup

### Provide clear instructions for running the application.

Follow these step-by-step instructions to run the entire Easy Forms stack locally:

#### Prerequisites
- **Node.js**: `v20.0.0` or higher installed ([Download Node.js](https://nodejs.org/))
- **npm**: `v10.0.0` or higher
- **MongoDB**: A running local MongoDB daemon (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI

#### 1. Clone the Repository
```bash
git clone https://github.com/Manisimha14/EasyForms.git
cd EasyForms
```

#### 2. Configure and Run Backend Server
```bash
cd Server
npm install
cp .env.example .env
```
Open `Server/.env` in your text editor and ensure `MONGODB_URI` and `JWT_ACCESS_SECRET` are set (see [Environment Variables](#environment-variables)). Then start the backend:
```bash
# Development mode with hot-reloading:
npm run dev

# Or standard production start:
npm start
```
The backend server will initialize on:
- API Base URL: `http://localhost:8080/api/v1`
- Interactive Scalar Documentation: `http://localhost:8080/api-docs`

#### 3. Configure and Run Frontend Client
In a new terminal window:
```bash
cd Client
npm install
cp .env.example .env
npm run dev
```
The frontend dev server will launch at:
- Web Application: `http://localhost:5173`

#### 4. Run Automated Test Suite
To verify code correctness and integration contracts across all endpoints:
```bash
cd Server
npm test
```
*Executes all 19 test suites and 177 automated tests using an in-memory MongoDB runner.*

---

## Environment Variables

### Document required configuration without exposing secrets.

Below is the complete configuration matrix for running Easy Forms. Default fallback values are provided for non-critical options, while sensitive keys are marked as required.

#### Backend Configuration (`Server/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | No | `development` | Server runtime environment (`development`, `test`, `production`) |
| `PORT` | No | `8080` | Network port for the Express HTTP server |
| `MONGODB_URI` | **Yes** | — | Connection URI for MongoDB Atlas or local MongoDB instance |
| `JWT_ACCESS_SECRET` | **Yes** | — | Cryptographically random secret string for signing access tokens (min. 32 chars) |
| `JWT_ACCESS_TTL` | No | `15m` | Expiration window for access tokens (e.g., `15m`, `1h`) |
| `REFRESH_TOKEN_TTL_DAYS` | No | `7` | Refresh token lifespan before mandatory re-login (in days) |
| `BCRYPT_COST` | No | `12` | Salt work factor for bcrypt password hashing |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Allowed frontend origins (comma-separated for multiple URLs) |
| `EMAIL_MODE` | No | `mock` | Delivery mode: `smtp` for live email dispatch, `mock` for local console logging |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP host server (used when `EMAIL_MODE=smtp`) |
| `SMTP_PORT` | No | `465` | SMTP port (`465` for SSL/TLS, `587` for STARTTLS) |
| `SMTP_USER` | No | — | Sender email account username |
| `SMTP_APP_PASSWORD` | No | — | Secure 16-character SMTP application password |
| `EMAIL_FROM` | No | `Easy Forms <noreply@easyforms.local>` | Formatted sender name and email in message headers |
| `GROQ_API_KEY` | No | — | Groq API Key for accelerated Formly AI generation and response chat |
| `GEMINI_API_KEY` | No | — | Google Gemini API Key |

#### Frontend Configuration (`Client/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | No | `http://localhost:8080/api/v1` | Root URL endpoint pointing to the backend API |

---

## Deployment

### Provide links or instructions for accessing the final application.

#### Live Endpoints & Interactive References
- **Frontend Web Application**: Deployable on Vercel or Netlify (local dev: `http://localhost:5173`)
- **Backend REST API**: Deployable on Render, Railway, or Google Cloud Run (local dev: `http://localhost:8080/api/v1`)
- **Interactive Scalar Documentation**: Hosted directly by the backend at `http://localhost:8080/api-docs` (and `/api-docs` on production host)
- **OpenAPI 3.1 Raw Spec**: Accessible at `http://localhost:8080/api-docs/openapi.yaml` and `http://localhost:8080/api-docs/openapi.json`

#### Backend Production Deployment (e.g., Render / Railway / Cloud Run)
1. Point your cloud provider to the repository root and select the `Server` subfolder as the Root Directory.
2. Set the build command to `npm install`.
3. Set the start command to `node src/server.js`.
4. Supply your production environment variables (`MONGODB_URI`, `JWT_ACCESS_SECRET`, `CORS_ORIGINS`, `GROQ_API_KEY`, etc.) in the host's dashboard.
5. Configure health check endpoints:
   - Liveness Probe: `GET /api/v1/health`
   - Readiness Probe: `GET /api/v1/health/ready`

#### Frontend Production Deployment (e.g., Vercel / Netlify / Cloudflare Pages)
1. Point your platform to the `Client` directory.
2. Set the build command to `npm run build`.
3. Set the output publish directory to `dist`.
4. Set the environment variable `VITE_API_BASE_URL` to your production backend URL (e.g., `https://easyforms-api.onrender.com/api/v1`).
5. Ensure SPA rewrites are enabled so that all client paths resolve to `index.html`.

---

## 11. License

This project is licensed under the [MIT License](LICENSE).
