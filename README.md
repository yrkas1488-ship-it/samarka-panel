# 🦊 Панель Самарка v0.2.0 · Samarka Panel v0.2.0

<p align="center">
  <img alt="Samarka Logo" src="./frontend/public/logo.png" width="130" style="border-radius: 50%;">
</p>

<p align="center">
  <b>Современная панель управления Xray-core с пресетами Reality, обходом белых списков через российские CDN и кластерной архитектурой</b><br>
  <b>Next-gen Xray-core Control Panel with Reality presets, Russian CDN bypass & Multi-Node Cluster Orchestration</b>
</p>

<p align="center">
  <a href="README.md">English & Русский</a> | <a href="README.ru_RU.md">Русский (RU)</a> | <a href="README.uk_UA.md">Українська (UA)</a>
</p>

---

## 🇷🇺 Русское описание / Russian Overview

### 🌟 Ключевые особенности Панели Самарка

- **🎨 Полный эксклюзивный редизайн**:
  - Верхний статус-бар: мониторинг `HOST / УЗЕЛ`, быстрый поиск `[Поиск / Search: Cmd+K]`, скорости трафика в реальном времени (`↓ ... Mbps`, `↑ ... Mbps`), потребление ОЗУ (`RAM`) и нагрузка процессора (`CPU`).
  - **Active Inbounds (Активные подключения)**: карточки активных туннелей с крупным номером порта (`:8443`, `:443`, `:8388`), параметрами `sni`, `ShortId`, числом пользователей, зеленой кнопкой **`QR & Ссылка / Link`** и тумблером мгновенного включения/отключения `Active`.
  - **Live Sniffer (Живой мониторинг)**: интерактивная таблица соединений (`Время / Time` | `Клиент / Client` | `Протокол / Protocol` | `Целевой хост / Target` | `Статус / Status`) с цветными статусами (`Direct 🟢 Прямой`, `Proxy 🔵 Прокси`, `Blocked 🔴 Заблокирован`) и автоматическим обновлением телеметрии Xray.
  - Лаконичная навигация: только нужные разделы в сайдбаре (Дашборд, Входящие & Reality, Клиенты, Исходящие, Маршрутизация, Настройки).
- **👑 Архитектура кластера серверов**:
  - **Глав-Главный сервер (Super-Master)**: централизованный пульт мониторинга и координации всех серверов сети с мгновенной привязкой подчиненных узлов по ссылке и валидным API-токенам.
  - **Главный сервер (Master)**: управление клиентами, генерация ключей и быстрых ссылок `samarka://join?...` для подчиненных узлов.
  - **Второстепенный сервер (Worker)**: режим Origin для CDN сетей или узел Двойного VPN (Relay/Exit).
- **☁️ Обход блокировок через российские CDN (порт 443 / XHTTP)**:
  - Готовые пресеты для Yandex Cloud CDN, VK Cloud, Selectel и Cloudflare.
  - Поддержка метода `OPTIONS` (с маппингом в POST через Nginx), заголовка `X-Cache` и обфускации padding `dc`.
  - Встроенное создание CDN Inbound на 443 порту в 1 клик прямо из веб-интерфейса.
- **⚡ Быстрые шаблоны VLESS Reality (порт 8443)**:
  - Автоматическая маскировка под популярные домены (`максвайб.рф` / `nemaxvibe.lol`).
  - Готовые конфигурации Reality TCP и Reality gRPC со сгенерированными ключами X25519.
- **🌐 Привязка домена и SSL**:
  - Выделенная вкладка в настройках с интеграцией Cloudflare DNS, генерацией сертификатов Let's Encrypt и шаблоном Nginx Reverse Proxy.
- **🌍 3 поддерживаемых языка**:
  - Русский (`ru-RU`) — язык по умолчанию
  - English (`en-US`)
  - Українська (`uk-UA`)
  - Интерактивный выбор языка прямо во время установки в консоли.

---

## 🇬🇧 English Description / English Overview

### 🌟 Key Features of Samarka Panel

- **🎨 Complete UI Redesign**:
  - Top header metrics bar: live `HOST` display, `[Search: Cmd+K]` real-time filter, golden-amber traffic rate indicators (`↓ ... Mbps`, `↑ ... Mbps`), RAM and CPU usage stats.
  - **Active Inbounds**: dedicated inbound cards displaying protocol title, large port number (`:8443`, `:443`), `sni`, `ShortId`, user count, green **`QR & Ссылка / Link`** action button, and an instant `Active` toggle switch.
  - **Live Sniffer**: real-time traffic connection table (`Time` | `Client` | `Protocol` | `Target Domain` | `Status`) featuring color-coded statuses (`Direct 🟢`, `Proxy 🔵`, `Blocked 🔴`) and auto-refreshing Xray telemetry.
  - Clean, streamlined navigation: focused sidebar displaying only core areas (Dashboard, Inbounds & Reality, Clients, Outbound, Routing, Settings).
- **👑 Cluster Hierarchy**:
  - **Super-Master Server**: centralized orchestration dashboard to coordinate multiple Master and Worker nodes with authenticated join tokens.
  - **Master Server**: handles user accounts, traffic accounting, and generates `samarka://join?...` cluster links.
  - **Worker Server**: operates as a CDN Origin node or a Double-VPN Relay/Exit hop.
- **☁️ Russian CDN Whitelist Bypass (Port 443 / XHTTP)**:
  - Whitelist bypass presets for Yandex Cloud CDN, VK Cloud, Selectel, and Cloudflare.
  - Built-in support for `OPTIONS` HTTP method (mapped to POST via Nginx), `X-Cache` header, and `dc` padding obfuscation.
  - 1-click in-panel CDN inbound deployment.
- **⚡ 1-Click VLESS Reality Presets (Port 8443)**:
  - Camouflage domains pre-configured (`максвайб.рф` / `nemaxvibe.lol`).
  - Out-of-the-box Reality TCP and Reality gRPC presets with automatic X25519 keypair generation.
- **🌐 Domain & SSL Integration**:
  - Dedicated tab for Cloudflare DNS mapping, Let's Encrypt Certbot generation, and Nginx reverse proxy templates.

---

## 🚀 Быстрый старт / Quick Start

Установка выполняется одной командой в терминале Linux / Single-command installation for Linux (Ubuntu, Debian, CentOS, AlmaLinux, Rocky, Alpine, Arch):

```bash
bash <(curl -Ls https://raw.githubusercontent.com/yrkas1488-ship-it/samarka-panel/main/install.sh)
```

### Параметры по умолчанию при установке / Installation Defaults:
* **Порт веб-панели / Web Panel Port:** `2053`
* **Прямые подключения Reality / Direct Inbounds:** `8443`
* **CDN-подключения / CDN Inbounds:** `443`
* **База данных / Database:** SQLite (`/etc/x-ui/x-ui.db`) или PostgreSQL

После завершения установки в терминале отобразятся учетные данные и адрес для входа. При первом открытии веб-панели вас встретит удобный **Мастер первичной настройки**, который поможет выбрать роль сервера и при необходимости настроить CDN в 1 клик.

Управление службой на сервере осуществляется командой `samarka`.

---

## 📦 Базы данных / Database Options

1. **SQLite** (по умолчанию / default) — один файл базы данных `/etc/x-ui/x-ui.db`. Идеально подходит для автономных серверов и нагрузок до 500+ активных клиентов.
2. **PostgreSQL** — рекомендуется для крупных распределенных кластеров с большим количеством нод и пользователей. Установщик может настроить локальный PostgreSQL автоматически или подключиться к внешнему серверу.

Миграция базы данных в любой момент / Migrate database at any time:
```bash
samarka migrateDB
```

---

## ⚙️ Переменные окружения / Environment Variables

| Переменная / Variable | Описание / Description | По умолчанию / Default |
|---|---|---|
| `XUI_PORT` | Порт веб-панели / Web panel port | `2053` |
| `XUI_DB_TYPE` | Тип БД (`sqlite` или `postgres`) | `sqlite` |
| `XUI_DB_DSN` | DSN подключения к PostgreSQL | — |
| `XUI_DB_FOLDER` | Путь к папке базы SQLite | `/etc/x-ui` |
| `XUI_INIT_WEB_BASE_PATH` | Базовый путь URL панели | `/` |
| `XUI_ENABLE_FAIL2BAN` | Защита от перебора через Fail2ban | `true` |
| `XUI_LOG_LEVEL` | Уровень логирования (`debug`, `info`, `warning`, `error`) | `info` |

---

## 🤝 Участие в разработке / Contributing

Мы приветствуем предложения, исправления и улучшения! Перед созданием Pull Request, пожалуйста, ознакомьтесь с [CONTRIBUTING.md](CONTRIBUTING.md).

* **Репозиторий проекта:** [github.com/yrkas1488-ship-it/samarka-panel](https://github.com/yrkas1488-ship-it/samarka-panel)
* **Сообщить об ошибке или предложить идею:** [GitHub Issues](https://github.com/yrkas1488-ship-it/samarka-panel/issues)

---

## 📜 Лицензия / License

Проект распространяется под свободной лицензией **GNU General Public License v3.0 (GPL-3.0)**. Подробности приведены в файле [LICENSE](LICENSE).
