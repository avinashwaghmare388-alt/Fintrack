# Security notes

## What is in place

| Area | What was done |
| --- | --- |
| Secrets | No secret is in the code. `.env` files are git-ignored. The server refuses to start without a strong `JWT_SECRET` and never prints values. `server/.env.example` has blanks only |
| Passwords | bcrypt with cost 12. Never returned by the API. A dummy comparison hides whether an email exists |
| Sessions | JWT in an httpOnly, SameSite cookie, Secure in production. Changing the password ends older sessions. Bearer headers are ignored |
| Authorization | Every query is filtered by the signed-in user's id. There are no admin routes |
| Input | zod schemas on every body and query reject unknown fields and database operator keys. HTML tags are stripped from text. Body size is limited to 20 kb, JSON only |
| XSS | React escapes output. The website's Content-Security-Policy allows scripts, styles, fonts and images from its own origin only, no inline scripts or styles. The API's policy is `default-src 'none'` |
| Rate limiting | 600 requests per 15 minutes per address on the API, 10 failed sign-ins per 15 minutes, 60 AI calls per hour, 10 sample-data loads per hour |
| CORS | Allow-list taken from `FRONTEND_URL`. Required in production |
| Headers | helmet defaults, HSTS in production, `Permissions-Policy`, `no-referrer`, `Cache-Control: no-store` on the API |
| Errors | Unknown errors return a generic message. Stack traces are only logged on the server |
| Files | Dotfiles and hidden paths return 404 when the website is served. `.env` cannot be fetched |
| Database | Mongoose schemas with limits. Indexes on user id. Account deletion removes all of a user's documents |
| Dependencies | `npm audit` reports 0 vulnerabilities for server and client at the time of writing |
| Privacy | `GET /auth/export` and `DELETE /auth/me` let users take or remove their data |

## Checked in this environment

69 server tests, 9 client tests, and a real browser run (headless Chromium) through sign up, adding, editing and deleting transactions, budget, sample data, PDF download, data export, password change and account deletion, with no Content-Security-Policy or console errors.

## Not possible to check from here

* **Your git history.** Run `npm run prelaunch` in your repository after your first commit. For a deeper scan use `gitleaks detect` or `trufflehog git file://.`.
* **A real MongoDB.** Models were replaced with in-memory stores for testing. Index creation and Atlas settings were not exercised.
* **Your custom domain and HTTPS.** Follow the README steps and check the padlock yourself.
* **Legal review.** The privacy policy and terms describe what this app actually does. They are plain-language templates, not legal advice. Have them read before you launch with real users.

## What you must do

1. **Rotate anything that has been exposed.** If your OpenAI key or MongoDB password was ever pasted in chat, a screenshot or committed to git, treat it as leaked: create a new one and delete the old one.
2. **Atlas network access.** Replace `0.0.0.0/0` with your host's IP address.
3. **Atlas database user.** Give the app's user read and write access to one database only.
4. Set `NODE_ENV=production`, `FRONTEND_URL`, `TRUST_PROXY` and a fresh `JWT_SECRET` on the host.
5. Set `VITE_OPERATOR_NAME` and `VITE_CONTACT_EMAIL` before building the client.

## Known limits

* Some dependencies are held back one major version on purpose, because upgrading them could not be tested without a real database: Express 4 (not 5), Mongoose 7 (not 9), zod 3 (not 4), the OpenAI SDK 4, dotenv 16. None has an open advisory today. Re-run `npm audit` regularly.
* Rate limits are kept in memory. If you run more than one server instance, move them to a shared store such as Redis.
* The PDF report prints amounts as "Rs." because the built-in PDF font has no rupee sign.
* Forecasts are statistical estimates. The app says so on every page that shows them.
