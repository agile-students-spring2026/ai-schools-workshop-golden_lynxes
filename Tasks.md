Team Split: School District Evaluator
Person 1 — Data & API Layer
Goal: Fetch and serve school district data from public sources.

Find public datasets (NCES, USAFacts, state report cards)
Build a backend API (Node/Express or FastAPI) with endpoints: search districts, get district details, compare districts
Parse/normalize CSV or JSON data into a clean schema
Deliverable: Running API server with real data
Person 2 — Frontend (Search & Browse)
Goal: Build the main UI for searching and browsing districts.

Set up React app (Vite or CRA)
Search bar + results list by state/city/name
District detail page showing key stats (graduation rate, spending per pupil, test scores, etc.)
Deliverable: Working search UI connected to the API
Person 3 — Frontend (Comparison & Visualization)
Goal: Let users compare multiple districts side-by-side.

Side-by-side comparison view (select 2–3 districts)
Charts/graphs for key metrics (use Chart.js or Recharts)
Color-coded scoring/ratings so parents can quickly judge quality
Deliverable: Comparison page with visualizations
Person 4 — Testing (100% Coverage)
Goal: Write unit tests for all code — backend and frontend.

Backend: Jest or Pytest tests for every API endpoint and data transform
Frontend: React Testing Library tests for every component
Set up coverage reporting (Istanbul/nyc or pytest-cov)
Fix gaps until 100% coverage is reached
Deliverable: npm test -- --coverage or equivalent passes at 100%
Person 5 — Deployment & DevOps
Goal: Get the app live and accessible by end of class.

Set up build scripts (package.json scripts or Makefile)
Deploy backend to Render, Railway, or Fly.io (free tier)
Deploy frontend to Vercel or Netlify
Wire frontend to production API URL
Write a quick README with setup instructions
Deliverable: Public URL that anyone can visit
Coordination Tips
Person 1 should publish a mock API endpoint first (even with fake data) so Persons 2 & 3 can start immediately
Person 4 can start writing tests as soon as Person 1 has any functions written — don't wait for completion
Person 5 can set up the deployment pipeline early (even with a placeholder app) so the final deploy is just a re-push