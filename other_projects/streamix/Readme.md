# 🎬 Streamix

A full-stack movie streaming platform built with **Next.js 14**, **PostgreSQL**, and the **TMDb API**. Browse thousands of movies in HD, build a personal watchlist, track your history, and pick up right where you left off — completely free.

> **Educational project.** Movie data is provided by [The Movie Database (TMDb)](https://www.themoviedb.org). Streamix does not host any media files.

---

## Features

- **Movie Browser** — Hero banner with rotating trending films, horizontally scrollable rows by category (Trending, Now Playing, Top Rated, Popular, Upcoming) and genre
- **Search** — Full-text movie search powered by TMDb
- **Watch Page** — Embedded video player with multi-source fallback across 8 streaming providers
- **Progress Tracking** — Playback position saved automatically; resumes on next visit
- **Watchlist** — Add/remove movies; persisted per user in PostgreSQL
- **Watch History** — Full log of every movie watched, with timestamps
- **Authentication** — JWT-based auth (register, login, logout) with HTTP-only cookies
- **Route Protection** — Middleware guards `/browse` and `/watch` routes; unauthenticated users are redirected to `/login`
- **Responsive UI** — Mobile-first design with a collapsible sidebar drawer and top navbar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via `pg`) |
| Auth | JWT (`jose`) + `bcryptjs` for password hashing |
| Movie Data | TMDb REST API |
| Cookie Handling | `cookies-next` |

---

## Project Structure

```
streamix/
├── app/
│   ├── page.tsx                  # Main browse page (home, search, genre, type filters)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles & Tailwind base
│   ├── browse/
│   │   ├── layout.tsx            # Browse shell: AuthProvider + Navbar + Footer
│   │   ├── watchlist/page.tsx    # User's watchlist
│   │   └── history/page.tsx      # User's watch history
│   ├── watch/[id]/
│   │   ├── page.tsx              # Watch page entry
│   │   └── WatchClient.tsx       # Video player client component
│   ├── login/                    # Login page
│   ├── register/                 # Register page
│   └── api/
│       ├── auth/login/           # POST — authenticate user, set JWT cookie
│       ├── auth/logout/          # POST — clear JWT cookie
│       ├── auth/register/        # POST — create account
│       ├── auth/me/              # GET  — return current user from session
│       ├── movies/               # GET  — proxy to TMDb
│       ├── history/              # GET/POST — watch history CRUD
│       ├── watchlist/            # GET/POST/DELETE — watchlist CRUD
│       └── progress/             # GET/POST — playback progress CRUD
├── components/
│   ├── AuthContext.tsx           # React context: user state, login/logout helpers
│   ├── layout/
│   │   └── Navbar.tsx            # Top navbar + sidebar drawer
│   └── movie/
│       ├── HeroBanner.tsx        # Auto-rotating hero with top-5 trending films
│       ├── MovieRow.tsx          # Horizontally scrollable movie shelf
│       ├── MovieCard.tsx         # Individual poster card with hover overlay
│       └── VideoPlayer.tsx       # Embedded player with multi-source fallback
├── lib/
│   ├── tmdb.ts                   # TMDb API client + type definitions
│   ├── db.ts                     # PostgreSQL connection pool + query helpers
│   ├── auth.ts                   # Session helpers: getSession, getUserFromSession
│   ├── jwt.ts                    # signToken / verifyToken (jose)
│   └── streaming.ts              # Streaming source URL builders
├── middleware.ts                 # Route protection & auth redirect logic
├── scripts/
│   └── setup-db.js               # Creates all DB tables and indexes
├── .env.local.example            # Environment variable template
└── next.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A free [TMDb API key](https://www.themoviedb.org/settings/api)

### 1. Install

```bash
cd streamix
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/streamix

# JWT secret — use a long random string in production
JWT_SECRET=change-this-to-a-long-random-secret-string

# TMDb API key — get one free at https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here

# App URL
NEXTAUTH_URL=http://localhost:3000
```

### 3. Set up the database

```bash
npm run db:setup
```

This runs `scripts/setup-db.js`, which creates the following tables:

- `users` — account credentials and profile
- `sessions` — (reserved; JWT is stateless, but table is available)
- `watch_history` — per-user movie watch log with progress and completion
- `watchlist` — per-user saved movies

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:setup` | Create/migrate database tables |

---

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Main browse page (hero + movie rows) |
| `/login` | Public (redirects if authed) | Login form |
| `/register` | Public (redirects if authed) | Registration form |
| `/browse/watchlist` | Protected | User's saved movies |
| `/browse/history` | Protected | User's watch history |
| `/watch/[id]` | Protected | Video player for a specific movie |

> **Note:** The root `/` page is the main browsing experience. Unauthenticated users will be redirected to `/login` when they attempt to access `/browse` or `/watch` routes. The landing/marketing page lives separately from the authenticated app shell.

### URL Query Parameters (on `/`)

| Parameter | Example | Effect |
|---|---|---|
| `q` | `/?q=inception` | Full-text movie search |
| `type` | `/?type=popular` | Filter to Popular or Top Rated |
| `genre` + `genreName` | `/?genre=28&genreName=Action` | Browse by genre |

---

## Authentication Flow

1. User registers via `/register` → password hashed with `bcryptjs` → stored in `users` table
2. User logs in via `/login` → credentials verified → JWT signed with `jose` and stored in an HTTP-only cookie (`streamix-token`)
3. `middleware.ts` intercepts every request to `/browse` and `/watch`, verifies the JWT, and redirects unauthenticated users to `/login`
4. Client-side auth state is managed by `AuthContext`, which calls `/api/auth/me` on mount
5. Logout hits `/api/auth/logout`, which clears the cookie

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  avatar       VARCHAR(500),
  plan         VARCHAR(50) DEFAULT 'free',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Watch History
CREATE TABLE watch_history (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  movie_id       INTEGER NOT NULL,
  movie_title    VARCHAR(500) NOT NULL,
  movie_poster   VARCHAR(500),
  movie_backdrop VARCHAR(500),
  movie_rating   DECIMAL(3,1),
  movie_year     INTEGER,
  watched_at     TIMESTAMPTZ DEFAULT NOW(),
  progress       INTEGER DEFAULT 0,
  completed      BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, movie_id)
);

-- Watchlist
CREATE TABLE watchlist (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  movie_id       INTEGER NOT NULL,
  movie_title    VARCHAR(500) NOT NULL,
  movie_poster   VARCHAR(500),
  movie_backdrop VARCHAR(500),
  movie_rating   DECIMAL(3,1),
  movie_year     INTEGER,
  movie_genre    VARCHAR(255),
  added_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);
```

---

## TMDb API

Movie data is fetched server-side from [TMDb](https://www.themoviedb.org) via `lib/tmdb.ts`. All requests are cached for 1 hour (`next: { revalidate: 3600 }`).

Key functions:

| Function | Endpoint |
|---|---|
| `getTrending(timeWindow)` | `/trending/movie/{day\|week}` |
| `getPopular(page)` | `/movie/popular` |
| `getTopRated(page)` | `/movie/top_rated` |
| `getNowPlaying()` | `/movie/now_playing` |
| `getUpcoming()` | `/movie/upcoming` |
| `getMovieDetails(id)` | `/movie/{id}?append_to_response=videos,credits,similar,recommendations` |
| `searchMovies(query, page)` | `/search/movie` |
| `getByGenre(genreId, page)` | `/discover/movie?with_genres={id}` |

---

## Disclaimer

Streamix is an **educational project** built for learning purposes. It does not host, store, or distribute any video content. All movie metadata and images are provided by the [TMDb API](https://www.themoviedb.org). This product uses the TMDb API but is not endorsed or certified by TMDb.