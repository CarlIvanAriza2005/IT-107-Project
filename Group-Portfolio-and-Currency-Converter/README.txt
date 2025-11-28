IT 110 GROUP 6 PROJECT - CURRENCY CONVERTER APPLICATION
=======================================================

Team Members
------------
- Romeo Gucela (HTML Structure & Semantics)
- Carl Ivan Ariza (CSS Styling & Layout)  
- Marc Red Caspe (JavaScript Logic & API Integration)
- Eian Gabriel Aguilar (Project Management & Documentation)

Project Overview
----------------
We built a responsive portfolio site that showcases the team and features a
currency converter powered by ExchangeRate-API. The converter now uses a secure
backend proxy so that API keys are never exposed in the browser.

Tech Stack
----------
- Static frontend under `public/` (HTML/CSS/vanilla JS)
- Local Express dev server (`server.js`) that mimics the Vercel deployment
- Optional Vercel serverless API routes under `api/` for production

Local Setup
-----------
1. Install dependencies (requires Node 18+):
   ```
   npm install
   ```
2. Copy the sample env file and set your real key:
   ```
   cp env.local.example .env.local
   ```
   Obtain a key from https://exchangerate-api.com and set `EXCHANGE_RATE_API_KEY`.
3. Start the local dev server:
   ```
   npm run dev
   ```
   Visit http://localhost:3000 to use the converter. The Express server serves
   static files and proxies `/api/convert` using your secret key.

Deployment
----------
1. Make sure `.env.local` (or the Vercel dashboard) contains
   `EXCHANGE_RATE_API_KEY`.
2. Deploy with Vercel (CLI or dashboard). The provided `vercel.json` routes all
   static assets from `public/` and serverless functions from `api/`. You can
   still use `npm run deploy` for a production deployment once you're ready.

API Reference
-------------
- Upstream API: ExchangeRate-API  
- Docs: https://www.exchangerate-api.com/docs

Security Notes
--------------
- Never commit `.env.local` or API keys to git.
- Rate limiting, logging, and additional validation can be added in `api/convert.js`.
