# Contributing to Samarka Panel

Thanks for taking the time to contribute to **Samarka Panel**! This guide explains how to get a development environment running locally, the project architecture, and the conventions to follow so your contributions land cleanly.

## Prerequisites

- **Go 1.26+** (the version pinned in `go.mod`)
- **Node.js 22+** and npm 10+ (for the React frontend)
- **Git**
- **A C compiler** — required by the CGo SQLite driver (`github.com/mattn/go-sqlite3`). Linux and macOS already ship one; for Windows see below.

### Windows: MinGW-w64

`go build` on Windows requires a C compiler for SQLite CGo bindings.

**Option A — standalone zip (fastest, no package manager)**

1. Download the latest build from <https://github.com/niXman/mingw-builds-binaries/releases>. For most setups, pick a release named:
   ```
   x86_64-<version>-release-posix-seh-ucrt-rt_<n>-rev<m>.7z
   ```
   (64-bit, POSIX threads, SEH exceptions, UCRT runtime — matches modern Windows defaults.)
2. Extract it somewhere stable, e.g. `C:\mingw64\`.
3. Add `C:\mingw64\bin` to your **Windows** `PATH` (System Properties → Environment Variables → Path → New).
4. Open a fresh terminal and confirm:
   ```powershell
   gcc --version
   ```

**Option B — MSYS2 (when a Unix shell is also useful)**

1. Install MSYS2 from <https://www.msys2.org/>.
2. Open the **MSYS2 UCRT64** shell and update:
   ```bash
   pacman -Syu
   ```
3. Install the UCRT64 toolchain:
   ```bash
   pacman -S --needed mingw-w64-ucrt-x86_64-gcc mingw-w64-ucrt-x86_64-pkg-config
   ```
4. Add `C:\msys64\ucrt64\bin` to your Windows `PATH`.
5. Verify with `gcc --version` in a fresh terminal.

---

## First-time Setup

```bash
git clone https://github.com/yrkas1488-ship-it/samarka-panel.git
cd samarka-panel

cp .env.example .env

mkdir -p x-ui

go mod download

cd frontend
npm install
npm run build
cd ..
```

`.env.example` ships with defaults that keep the database, logs, and xray binary inside the local `x-ui/` directory so nothing escapes the project folder:

```env
XUI_DEBUG=true
XUI_DB_FOLDER=x-ui
XUI_LOG_FOLDER=x-ui
XUI_BIN_FOLDER=x-ui
XUI_INIT_WEB_BASE_PATH=/
# XUI_PORT=2053
```

Drop the Xray binary (`xray-windows-amd64.exe` on Windows, `xray-linux-amd64` on Linux, etc.) plus the matching `geoip.dat` and `geosite.dat` files into `x-ui/`. The easiest source is a [released Xray-core build](https://github.com/XTLS/Xray-core/releases).

---

## Running Locally

```bash
go run .
```

Open [http://localhost:2053](http://localhost:2053) and log in with your credentials (or `admin` / `admin` on a fresh test database).

### Inside VS Code

The repo includes VS Code launch profiles in `.vscode/launch.json`:
- **Run Samarka Panel (Debug)**: runs with SQLite locally.
- **Run Samarka Panel (Postgres)**: runs against local PostgreSQL.

```jsonc
{
  "$schema": "vscode://schemas/launch",
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Samarka Panel (Debug)",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "${workspaceFolder}",
      "cwd": "${workspaceFolder}",
      "env": {
        "XUI_DEBUG": "true",
        "XUI_DB_FOLDER": "x-ui",
        "XUI_LOG_FOLDER": "x-ui",
        "XUI_BIN_FOLDER": "x-ui"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Working on the Frontend

The panel UI is a **React 19 + Ant Design 6 + TypeScript** application located under `frontend/`, built with Vite.

### Architecture

The frontend compiles into static bundles emitted into `internal/web/dist/` and embedded into the Go binary at compile time via `embed.FS`:

- **`index.html`** — the main single-page admin application. `src/main.tsx` mounts a `react-router` `createBrowserRouter` (see `src/routes.tsx`) under `/panel`; each primary route is lazy-loaded inside `PanelLayout` (`AppSidebar` + content area).
- **`login.html`** — standalone login + 2FA entry point.
- **`subpage.html`** — public subscription viewer.

### State and Data Flow

- **Server state via TanStack Query**: API reads go through `@tanstack/react-query` (`QueryProvider` in `src/main.tsx`, keys in `src/api/queryKeys.ts`). Responses are cached and invalidated on mutations.
- **Zod schemas as single source of truth**: Schemas in `src/schemas/` define data models; forms validate through them, and TypeScript types are inferred with `z.infer`.
- **Domain logic**: Reality key generation, CDN presets (XHTTP + OPTIONS + padding `dc`), link generators, and wire adapters live in `src/lib/xray/` and `src/pages/inbounds/form/`.
- **HTTP**: `HttpUtil` in `src/utils/index.ts` is an Axios wrapper handling CSRF, authentication, and user feedback.

### Supported Languages (i18n)

Samarka Panel focuses on **three core languages**:
- **Русский (`ru-RU`)** (Default)
- **English (`en-US`)**
- **Українська (`uk-UA`)**

Translation files live in `internal/web/translation/<locale>.json`. When adding or modifying keys, ensure they are updated across all three locales.

### Dev Workflow

| Goal | Command |
|------|---------|
| Frontend HMR development | `cd frontend && npm run dev` (Vite on `:5173`, proxies API requests to Go backend on `:2053`). |
| Production build check | `cd frontend && npm run build` |
| Typecheck & tests | `cd frontend && npm run typecheck && npm run test` |

---

## Project Structure

| Path | Purpose |
|------|---------|
| `main.go` | Application entry point and CLI commands |
| `frontend/` | React 19 + TypeScript + Ant Design 6 web dashboard source |
| `internal/web/` | Gin HTTP server, controllers, services, API endpoints, embedded web assets |
| `internal/database/` | GORM database models, migrations (SQLite / PostgreSQL) |
| `internal/xray/` | Xray-core daemon lifecycle and gRPC management |
| `internal/sub/` | Subscription generation services |
| `internal/config/` | Configuration, environment parsing, and default constants |
| `install.sh` | Production Linux bash installer |

---

## Pull Requests

1. Fork and create a branch off `main` (e.g. `feat/feature-name` or `fix/bug-fix`).
2. Run quality checks before submitting:
   ```bash
   go test ./...
   cd frontend && npm run typecheck && npm run test && npm run build
   ```
3. Commit messages should follow conventional commit formatting: `feat: ...`, `fix: ...`, `refactor: ...`.
4. Submit pull requests to `main` at <https://github.com/yrkas1488-ship-it/samarka-panel>.

## Bug Reports & Feature Requests

Please submit issues and feature proposals via [GitHub Issues](https://github.com/yrkas1488-ship-it/samarka-panel/issues).
