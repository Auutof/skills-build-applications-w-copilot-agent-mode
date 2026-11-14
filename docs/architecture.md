# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Keep the existing three-tier structure and implement the contracts in dependency order:

- Presentation tier decision: Keep React 19, React Router, and the four route components. Replace the generic capability cards with focused views that load through `src/api/client.ts` and expose accessible loading, empty, success, and error states. Use the existing seeded Mona account for workout suggestions.
- Logic tier decision: Keep route handlers thin and implement validation and business behavior in `octofitService.ts`. Return deliberate 4xx responses for malformed IDs, missing referenced records, invalid payloads, and unknown workout users; do not let Mongoose cast errors become 500 responses.
- Data tier decision: Add Mongoose required fields and appropriate basic constraints to the existing schemas. Keep seed writes idempotent and preserve unrelated records and existing team-membership reconciliation.
- Activity tracking approach: Validate `userId`, `teamId`, activity type, and positive minutes before writing. Require both referenced records to exist, store their IDs as `user` and `team`, compute points from submitted minutes, and set `occurredAt` when creating an activity.
- Team management approach: Reject a missing or blank name with 400. Persist the supplied name and mascot and valid member IDs; keep the existing empty-members default and return members from list and create responses.
- Leaderboard approach: Sum activity points by team, include team names, sort descending by total, and assign 1-based ranks in the service response.
- Workout suggestions approach: Find the user by email, prefer a workout matching the user's fitness goal, and use recent activity as the fallback signal. Include a short reason for the selected focus and return a 4xx when no user matches.

## Test plan

MongoDB was checked with `ps aux | grep mongod` before the baseline; `mongod` was running. The contract test suites use `mongodb-memory-server` for their database, so they do not depend on the local MongoDB process.

Baseline setup and results:

- `npm ci --prefix octofit-tracker/backend` and `npm ci --prefix octofit-tracker/frontend` — both completed.
- `npm test --prefix octofit-tracker/backend` — red: 8 failed, 1 passed. Four data-contract failures show missing schema validation; four API-contract failures show unfinished activity/team creation, leaderboard aggregation, and workout matching/reason behavior. The seed idempotency test passed.
- `npm test --prefix octofit-tracker/frontend` — red: 15 failed. The four generic screens do not render API data or accessible loading, empty, and error states, and the workout route does not request the expected user-specific suggestions.

Run these checks as implementation proceeds:

- `npm run test:data --prefix octofit-tracker/backend` — verifies required model fields and idempotent, non-destructive demo seeding.
- `npm run test:api --prefix octofit-tracker/backend` — verifies valid creation/listing, deliberate 4xx validation behavior, leaderboard totals/ranks, and user-specific workout recommendations.
- `npm test --prefix octofit-tracker/frontend` — verifies API-backed presentation, the expected workout request, and accessible loading, empty, and error states for all four routes.
- `npm run build --prefix octofit-tracker/backend` — verifies backend TypeScript type-checking.
- `npm run build --prefix octofit-tracker/frontend` — verifies frontend type-checking and the Vite production build.

Smallest safe implementation order: (1) tighten schemas and pass data-contract tests; (2) implement and test the service/API contracts; (3) implement each frontend route using the shared API client and test its states; (4) run both complete test suites and both builds.
