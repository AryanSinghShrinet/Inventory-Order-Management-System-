# Stockwise — Frontend

React + Vite + Tailwind dashboard for the Inventory & Order Management API.
See the top-level [`../README.md`](../README.md) for the full architecture and
deployment guide.

## Quick start

```bash
cp .env.example .env       # set VITE_API_URL to your backend
npm install
npm run dev                # http://localhost:5173
```

## Build

```bash
npm run build              # outputs ./dist
npm run preview            # serve dist locally on :4173
```

## Stack

- React 18 (JavaScript)
- Vite 5
- Tailwind CSS 3 with custom design tokens (see `src/index.css`)
- TanStack Query v5 (server state, caching, invalidation)
- React Hook Form + Zod (client-side validation that mirrors Pydantic schemas)
- framer-motion (drawer / list micro-interactions)
- lucide-react (icons)
- react-hot-toast (toast notifications)

## Project layout

```
src/
├── api/
│   ├── client.js          # axios instance with normalized error envelope
│   └── hooks.js           # TanStack Query hooks for every resource
├── components/
│   ├── layout/            # AppShell, Sidebar, Topbar
│   ├── ui/                # Button, Input, Card, Drawer, Table, Stat, …
│   ├── products/          # ProductForm
│   ├── customers/         # CustomerForm
│   └── orders/            # OrderItemsEditor
├── lib/                   # cn(), format.js (currency, date, stock labels)
├── pages/                 # Dashboard, Products, Customers, Orders, OrderDetail, NotFound
├── store/                 # theme provider (light/dark)
├── App.jsx                # router + providers
├── main.jsx
└── index.css              # Tailwind base + design tokens
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL. Used at build time. |

## Notes for production

- The Vite build embeds `VITE_API_URL` into the JS bundle. You **must
  redeploy** after changing it.
- The included `vercel.json` rewrites all unknown paths to `/index.html` so
  React Router takes over.
- The `nginx.conf` in the project root (used by the Docker image) does the
  same fallback for self-hosted deployments.
