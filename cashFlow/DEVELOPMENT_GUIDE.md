# CashFlow — Developer & Deployment Guide

This guide is compiled for future instances of the AI coding assistant (or other developers) to explain the project structure, deployment, configurations, and core features of the Next.js **CashFlow** personal wealth manager.

---

## 1. Project Overview & Architecture

**CashFlow** is a modern personal wealth tracking, budgeting, and simulation application. It runs as a Next.js (React) application under a subpath of a larger personal portfolio website.

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database ORM**: Prisma (targeting PostgreSQL in production, previously SQLite in development)
- **Production Database**: Neon Serverless PostgreSQL
- **UI Styling**: Vanilla CSS Modules (with custom variables for dark/light themes and sporty aesthetics)
- **Deployment**: Vercel

### Repository Layout
The project is hosted in a monorepo structure under `GrishinRostislav/grishinsystems`:
- `/` — Root of the repository containing an **Eleventy** static site (personal portfolio).
- `/cashFlow` — The Next.js financial tracker project directory.

---

## 2. Reverse Proxy & Routing Architecture (Vercel)

The Next.js app is hosted at the `/cashFlow` subpath of the main domain. This is achieved via **Vercel rewrites**:

1. **Next.js Config**:
   In [next.config.ts](file:///c:/Users/Ross/Documents/Projects/cashFlow/cashFlow/next.config.ts), `basePath: '/cashFlow'` is configured. Next.js serves the entire site under this subpath.
2. **Eleventy Site vercel.json**:
   The root [vercel.json](file:///c:/Users/Ross/Documents/Projects/cashFlow/vercel.json) routes incoming traffic starting with `/cashFlow` to the standalone Next.js deployment:
   ```json
   {
     "rewrites": [
       {
         "source": "/cashFlow",
         "destination": "https://grishinsystems-l8lt.vercel.app/cashFlow"
       },
       {
         "source": "/cashFlow/:match*",
         "destination": "https://grishinsystems-l8lt.vercel.app/cashFlow/:match*"
       }
     ]
   }
   ```
3. **Cookie Path Precaution**:
   Because Next.js runs under a `basePath`, browser cookies (such as auth tokens) might default to the path `/cashFlow`. To ensure session cookies are sent for all variants (`/cashFlow`, `/cashFlow/`, etc.), the cookie path must be explicitly set to `/` in the HTTP headers:
   `Set-Cookie: auth=authenticated; Path=/; HttpOnly; ...`

---

## 3. Database Schema

The production schema is managed using Prisma and stored in Neon PostgreSQL. Refer to [schema.prisma](file:///c:/Users/Ross/Documents/Projects/cashFlow/cashFlow/prisma/schema.prisma) for full details.

### Core Models
- **Account**: Holds account details (Checking, Savings, Credit, Investment), balance, and currency (default `CAD`). Supports custom display ordering (`order` field) and soft archiving (`isArchived`).
- **Category**: Supports a hierarchical tree structure via self-relation (`parent` / `subcategories`).
- **Merchant**: Stores unique merchant names to link transactions.
- **Transaction**: Tracks individual financial entries (amount, date, merchant, notes, account, category).
- **ScheduledTransaction**: Represents recurring records (daily, weekly, monthly, yearly) with frequency configuration.
- **Budget**: Defines budget thresholds for categories or global budgets.
- **ForecastScenario & ScenarioItem**: Models simulated scenarios for the financial forecast (e.g., custom income or expense events).
- **ProductMapping**: Stores raw-to-friendly name mappings for receipt scanning.
- **Settings**: Global configuration (like `homeCurrency`).

---

## 4. Authentication & Security

A simple password protection is active if the `APP_PASSWORD` environment variable is defined.

- **Endpoints**: [route.ts](file:///c:/Users/Ross/Documents/Projects/cashFlow/cashFlow/src/app/api/auth/route.ts)
- **Lockout Mechanism**: Tracked in the `LoginAttempt` table by IP. More than 3 failed attempts result in a 10-minute lockout.
- **Bypass Rule**: If `APP_PASSWORD` is not set in the environment variables, authentication is automatically bypassed (useful for dev environments).
- **Middleware**: If you need to intercept and redirect unauthorized users, Next.js expects a file named `src/middleware.ts` at the root of `src/`. Currently, the codebase contains a helper file [proxy.ts](file:///c:/Users/Ross/Documents/Projects/cashFlow/cashFlow/src/proxy.ts) which defines this check but is not automatically executed by Next.js because of the name. If full route blocking is required in production, create `src/middleware.ts` importing `proxy`:
  ```typescript
  export { proxy as middleware } from './proxy';
  ```

---

## 5. Key Feature Highlights

### Unified Transaction Display
The app displays transaction lists across all details pages (Accounts, Categories, Budgets, Merchants) and the main Transactions list page using a single unified component: [TransactionList.tsx](file:///c:/Users/Ross/Documents/Projects/cashFlow/cashFlow/src/components/TransactionList.tsx).
- Grouped by formatted date.
- Category circle icons with letter initials and color hashing.
- Merchant badges.
- Notes / categories display.
- Clear sign indicators (+ / -) and custom currency formats.
- Inline mobile styling integrated into a responsive wrapper.

### Exchange Rates and Currency Conversion
Multiple currencies are converted dynamically using local currency rates or exchange rate fetchers defined in [src/lib/currency.ts](file:///c:/Users/Ross/Documents/Projects/cashFlow/cashFlow/src/lib/currency.ts).

### AI Receipt Scanning
The application can scan images of receipts.
- **API**: `/api/transactions/scan`
- **Fallback Chain**: Uses Gemini API (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`) to scan receipt text, extract amounts, date, merchant, and categorize them.

### Financial Planning Forecast
Simulates wealth trends into the future based on:
- Historical transactions of selected accounts.
- Active scheduled transactions.
- Active scenarios.

---

## 6. How to Deploy Online

To deploy this project to a live Vercel environment:

### Step 1: Set Up Database (Neon PostgreSQL)
1. Register/Login to [Neon](https://neon.tech/).
2. Create a new PostgreSQL database project.
3. Retrieve your connection strings:
   - **Pooled URL** (for database queries): e.g. `postgresql://...aws.neon.tech/neondb`
   - **Direct URL** (for migrations): e.g. `postgresql://...aws.neon.tech/neondb?sslmode=require`

### Step 2: Vercel Project Configuration
1. Import the Git repository in Vercel.
2. Configure **Root Directory**: `cashFlow` (so Vercel builds the Next.js app, not the Eleventy root).
3. Set the Framework Preset to **Next.js**.
4. Configure the following **Environment Variables**:
   - `POSTGRES_PRISMA_URL`: Your pooled database URL.
   - `POSTGRES_URL_NON_POOLING`: Your direct database URL.
   - `APP_PASSWORD`: The password users will type to access the app.
   - `GEMINI_API_KEY`: (Optional) Your Gemini API key for receipt scanning.

### Step 3: Run Migrations and Seed
Before or during deployment, run database setup commands:
- Deploy the Prisma schema to Neon:
  ```bash
  npx prisma db push
  ```
- To seed default categories:
  ```bash
  npx prisma db seed
  ```
- To migrate local SQLite data to production Neon (if applicable), configure your local `.env` with production credentials and run:
  ```bash
  node migrate.js
  ```

---

## 7. Local Development Guide

To run the Next.js app locally:

1. Navigate to the project folder:
   ```bash
   cd cashFlow
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Set up your local `.env` file (copied from the parent folder `.env` or created new) containing `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, and `APP_PASSWORD`.
4. Run Prisma client generation:
   ```bash
   npx prisma generate
   ```
5. Start Next.js development server:
   ```bash
   npm run dev
   ```
