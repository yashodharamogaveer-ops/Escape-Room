# Lockdown 13 - 3D Escape Room (PWA)

First-person 3D escape room built with React, three.js and Vite.

## Run it
```
npm install
npm run dev            # play at http://localhost:3000
npm run build          # production build in dist/ (includes the PWA service worker)
npm run preview        # test the production build and install it as an app
npm run verify:debug   # proves all Python debugging puzzles work with real Python
```

## Features
- 4 sectors: cipher box / aptitude test, safe-door maze, real Python debugging, TRUTH-LIES-UNKNOWN chests + hidden door.
- **Real Python**: Sector 3 runs actual CPython (Pyodide, self-hosted in `public/pyodide`). 8 moderate programs, one bug each (syntax, runtime or logic).
- **Leaderboard**: finish time (+ penalties) saved on the device, with JSON/CSV export and JSON import.
- **PWA**: installable, and works offline after the first visit (`public/manifest.webmanifest`, generated `sw.js`).

## Deploy (static hosting)
`dist/` is a plain static site with relative paths. Upload it to GitHub Pages, Netlify or Vercel.
PWA install and service workers need HTTPS (localhost is fine for testing).
