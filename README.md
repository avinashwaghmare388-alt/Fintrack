# FinTrack

A personal finance tracker. Record income and expenses in rupees, set a monthly budget, and see spending patterns, budget risk and a 30-day forecast calculated from your own history.

Three algorithms are used:

| Algorithm | Where | What it does |
| --- | --- | --- |
| K-Means | Insights, spending patterns | Groups expenses by amount (and weakly by day of month) into 2 or 3 spending patterns |
| Decision Tree | Add transaction, Insights | Suggests a category from the words in a title. Predicts whether the month will end over budget |
| Random Forest | Insights, forecast | Forecasts the next four weeks of spending from weekly history, tests itself on the last four weeks |

## Run it

You need Node.js 20.19 or newer and a MongoDB database (local, or a free MongoDB Atlas cluster).

```
node scripts/dev.mjs
```

On Windows you can double-click `start.bat` instead. The script installs the packages, creates `server/.env` with a random secret, then starts the API on port 5000 and the website on port 5173. Put your MongoDB connection string in `MONGODB_URI` inside `server/.env`.

After signing up, open **Transactions** and choose **Load sample data** to see every feature with twelve months of made-up transactions.

## Sample data from a public dataset

The **Load sample data** button can use a real, public bank statement or expense dataset instead of the built-in generator.

1. Download a dataset whose licence allows reuse. It needs a date, a description and either one signed amount column or separate debit and credit columns.
2. Build the sample file (from the `server` folder):

```
node scripts/build-sample-dataset.mjs path/to/data.csv --source "Dataset name" --url "https://link-to-dataset" --licence "its licence"
```

Add `--rate 83` if the amounts are in US dollars, `--date-order dmy` or `mdy` if numeric dates are ambiguous, and `--date-col`, `--desc-col`, `--amount-col`, `--debit-col`, `--credit-col`, `--type-col` or `--category-col` if a column name is not found automatically.

What the script does: keeps the latest 12 months, turns debit and credit columns into income and expense, guesses categories and payment methods from the description (or uses the dataset's own category column), masks long numbers, emails and UPI ids, and writes `server/data/sample-transactions.json`. When you press **Load sample data**, the dates are moved forward by whole weeks so the data ends today, which keeps every weekday as it was, and a budget is suggested from the typical month. The dataset's name is shown after loading.

Check `sample-transactions.json` before committing it: names of people can remain in descriptions. Credit the dataset and its licence here:

> Sample data: not set yet. Build `server/data/sample-transactions.json` and write the dataset name, link and licence here.

## Folder structure

```
server/
  app.js, server.js          app setup and process start
  config/                    environment validation, database connection
  routes/                    URL to controller wiring, versioned under /api/v1
  controllers/               thin: read the validated request, call a service, send the response
  services/                  business logic and the machine learning code
  validators/                zod schemas for every request body and query
  middleware/                auth, security headers, CORS, rate limits, error handler
  models/                    Mongoose schemas
  utils/                     dates (all UTC), errors, cookie helpers
  tests/                     69 tests, plus tests/e2e/memory-server.mjs for browser checks without a database
client/
  src/app/                   store, routes, route guards
  src/features/<name>/       one folder per area: auth, dashboard, transactions, budget, insights, reports, account, legal
  src/components/            shared interface parts (layout, forms, tables, dialog, skeletons)
  src/services/              RTK Query API layer: every request the browser makes
  src/lib/                   formatting, error messages, chart colours
  src/styles/                design tokens and plain CSS
scripts/                     dev launcher, env setup, prelaunch check
```

Server data flows route, then controller, then service, then model. The browser keeps server data in the RTK Query cache and only small interface state (the chosen month) in a Redux slice.

## Environment variables

Server (`server/.env`, never committed. `server/.env.example` lists them):

| Name | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | Connection string |
| `JWT_SECRET` | yes | At least 32 random characters. `node scripts/setup-env.mjs` generates one |
| `NODE_ENV` | production | Set to `production` on the host |
| `FRONTEND_URL` | production | The public https address, for example `https://yourdomain.com`. Used for CORS |
| `PORT` | no | Default 5000 |
| `SERVE_CLIENT` | no | Defaults to on in production: the API also serves the built website from one service |
| `TRUST_PROXY` | behind a proxy | Number of proxies in front of the app, so rate limiting sees real client addresses |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | no | Optional. Without a key, observations are written by built-in rules |

Client (`client/.env`, public values only, compiled into the site): `VITE_OPERATOR_NAME` and `VITE_CONTACT_EMAIL`, shown on the privacy policy and terms pages.

## API

Everything is under `/api/v1`. Successful responses are `{ success: true, data }`, errors are `{ success: false, message }`. The session is an httpOnly cookie, there is no token in the response body.

| Method and path | Purpose |
| --- | --- |
| `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout` | Account session |
| `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password`, `DELETE /auth/me` | Account |
| `GET /auth/stats`, `GET /auth/export` | Totals and a JSON download of all stored data |
| `GET/POST /transactions`, `PUT/DELETE /transactions/:id` | Transactions, with search, filter, sort and paging |
| `GET/PUT /budget` | Monthly budget and category limits |
| `GET /dashboard/summary?year&month` | One month: totals, categories, daily and weekly trend |
| `GET /dashboard/history?months=6\|12` | Month by month history |
| `GET /reports/monthly?year&month&format=json\|pdf` | Monthly report |
| `POST /ai/insights`, `POST /ai/predict`, `GET /ai/patterns`, `GET /ai/budget-risk`, `POST /ai/suggest-category` | Machine learning |
| `POST /demo/seed`, `DELETE /demo` | Load or remove sample data |

## Build and deploy

```
npm run install:all
npm run build        # builds client/dist
npm start            # one Node service: API plus the website
```

Set the server variables on your host. In production the same service serves `client/dist`, so the website and the API share one origin and one domain.

### Custom domain

1. Deploy the service on a host that gives you HTTPS (Render, Railway, Fly.io or a VPS with a reverse proxy).
2. Add your domain in the host's dashboard and create the DNS record it asks for at your registrar.
3. Wait for the certificate, then open `https://yourdomain.com` and check the padlock.
4. Set `FRONTEND_URL=https://yourdomain.com`, `NODE_ENV=production` and `TRUST_PROXY=1` on the host, then redeploy.
5. In MongoDB Atlas, allow only your host's IP address in Network Access.

### Before you launch

```
npm run prelaunch
```

It checks the favicon, the privacy and terms pages, the contact details, banned design patterns, committed secrets and git history. It cannot connect your domain for you. The list it prints at the end is what is left to do by hand.

## Design rules this project follows

Off-white background with 1px borders instead of shadows. Square corners (2px). Rectangular buttons. No gradients, no emoji, no icon set, no animated backgrounds or cursor effects, no em dashes. Fonts are Source Serif 4 for page titles and Source Sans 3 for everything else, served from this site. Chart colours were checked for contrast and colour-blind separation. Loading states use plain skeleton blocks.

## Tests

```
npm test             # server and client tests
npm run audit        # dependency audit for both
```

The server tests run the real app with the models replaced by in-memory stores. They cover validation, sessions, the full account flow, dates in four time zones, the machine learning code and static file serving.
