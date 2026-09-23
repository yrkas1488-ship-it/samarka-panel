# 🦊 Samarka Panel v0.0.3

<p align="center">
  <img alt="Samarka Logo" src="./frontend/public/logo.png" width="130" style="border-radius: 50%;">
</p>

<p align="center">
  <b>Modern Xray-core Control Panel with Reality presets, Russian CDN bypass & Multi-Node Cluster Orchestration</b>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ru_RU.md">Русский</a> | <a href="README.uk_UA.md">Українська</a>
</p>

---

## 🌟 Key Features of Samarka Panel

- **🎨 Exclusive UI Redesign**:
  - Top header metrics bar: live `HOST` display, `[Search: Cmd+K]` real-time filter, golden-amber traffic rate indicators (`↓ ... Mbps`, `↑ ... Mbps`), RAM and CPU usage stats.
  - **Active Inbounds**: dedicated inbound cards displaying protocol title, large port number (`:8443`, `:443`), `sni`, `ShortId`, user count, green **`Get QR/Link`** action button, and an instant `Active` toggle switch.
  - **Live Sniffer**: real-time traffic connection table (`Time` | `Client` | `Protocol` | `Target Domain` | `Status`) featuring color-coded statuses (`Direct 🟢`, `Proxy 🔵`, `Blocked 🔴`) and auto-refreshing Xray telemetry.
  - Clean, streamlined navigation: focused sidebar displaying only core areas (Dashboard, Inbounds & Reality, Clients, Outbound, Routing, Settings).
- **👑 Cluster Hierarchy**:
  - **Super-Master Server**: centralized orchestration dashboard to coordinate multiple Master and Worker nodes with authenticated join tokens.
  - **Master Server**: handles user accounts, traffic accounting, and generates `samarka://join?...` cluster links.
  - **Worker Server**: operates as a CDN Origin node or a Double-VPN Relay/Exit hop.
- **☁️ Russian CDN Bypass (Port 443 / XHTTP)**:
  - Whitelist bypass presets for Yandex Cloud CDN, VK Cloud, Selectel, and Cloudflare.
  - Built-in support for `OPTIONS` HTTP method (mapped to POST via Nginx), `X-Cache` header, and `dc` padding obfuscation.
  - 1-click in-panel CDN inbound deployment.
- **⚡ 1-Click VLESS Reality Presets (Port 8443)**:
  - Camouflage domains pre-configured (`максвайб.рф` / `nemaxvibe.lol`).
  - Out-of-the-box Reality TCP and Reality gRPC presets with automatic X25519 keypair generation.
- **🌐 Domain & SSL Integration**:
  - Dedicated tab for Cloudflare DNS mapping, Let's Encrypt Certbot generation, and Nginx reverse proxy templates.
- **🌍 3 Core Supported Languages**:
  - Russian (`ru-RU`) — default
  - English (`en-US`)
  - Ukrainian (`uk-UA`)
  - Interactive language selector during bash installation.

---

## 🚀 Quick Start

Install Samarka Panel with a single command on Linux (Ubuntu, Debian, CentOS, AlmaLinux, Rocky, Alpine, Arch):

```bash
bash <(curl -Ls https://raw.githubusercontent.com/yrkas1488-ship-it/samarka-panel/main/install.sh)
```

### Installation Defaults:
* **Web Panel Port:** `2053` (configurable)
* **Reality Direct Inbounds:** `8443`
* **CDN Inbounds:** `443`
* **Database:** SQLite (`/etc/x-ui/x-ui.db`) or PostgreSQL

Once installation finishes, your access credentials and URL will be displayed in the terminal. When opening the web panel for the first time, an **Onboarding Setup Wizard** will guide you through server role selection and CDN setup.

To manage the server locally, run `samarka` or `x-ui` in your terminal.

---

## 📦 Database Options

1. **SQLite** (default) — single-file database at `/etc/x-ui/x-ui.db`. Zero-configuration and ideal for standalone servers.
2. **PostgreSQL** — recommended for high-load installations with many nodes and users. The installer can configure local PostgreSQL automatically or connect to an external cluster.

To migrate an existing SQLite database to PostgreSQL:
```bash
x-ui migrate-db --dsn "postgres://user:password@127.0.0.1:5432/samarka?sslmode=disable"
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `XUI_PORT` | Web panel port override | `2053` |
| `XUI_DB_TYPE` | Database engine (`sqlite` or `postgres`) | `sqlite` |
| `XUI_DB_DSN` | PostgreSQL connection string | — |
| `XUI_DB_FOLDER` | Directory for the SQLite database | `/etc/x-ui` |
| `XUI_INIT_WEB_BASE_PATH` | Initial URL path prefix | `/` |
| `XUI_ENABLE_FAIL2BAN` | Enable Fail2ban client IP limiting | `true` |
| `XUI_LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warning`, `error`) | `info` |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

* **Repository:** [github.com/yrkas1488-ship-it/samarka-panel](https://github.com/yrkas1488-ship-it/samarka-panel)
* **Issues:** [GitHub Issues](https://github.com/yrkas1488-ship-it/samarka-panel/issues)

---

## 📜 License

Distributed under the **GNU General Public License v3.0 (GPL-3.0)**. See [LICENSE](LICENSE) for details.
