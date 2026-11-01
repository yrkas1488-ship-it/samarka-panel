package service

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"
)

type DecoyService struct{}

type DecoyInfo struct {
	Theme       string `json:"theme"`
	CompanyName string `json:"companyName"`
	Tagline     string `json:"tagline"`
	AccentColor string `json:"accentColor"`
	Directory   string `json:"directory"`
	IsCustom    bool   `json:"isCustom"`
}

var (
	companyPrefixes = []string{
		"Vortex", "Nexura", "Aether", "Luminary", "Krypton", "Stratum", "Solas", "Veritas",
		"Hyperion", "Synapse", "Quantum", "Apex", "Omni", "Prism", "Cobalt", "Echo",
	}
	companySuffixes = []string{
		"Analytics", "Technologies", "Solutions", "Networks", "Data Labs", "Systems",
		"Digital", "Consulting", "Cloud", "Logistics", "Media", "Engineering",
	}
	taglines = []string{
		"Intelligent High-Throughput Cloud & Data Infrastructure",
		"Architecting Next-Generation Distributed Systems",
		"Empowering Modern Enterprise with Real-Time Telemetry",
		"Secure, Scalable & Low-Latency Enterprise Computing",
		"Transforming Complex Workflows into Seamless Digital Experiences",
	}
	colorPalettes = []struct {
		Name    string
		Primary string
		Hover   string
		DarkBg  string
		CardBg  string
	}{
		{"Indigo Modern", "#6366f1", "#4f46e5", "#0b0f19", "#111827"},
		{"Emerald Pure", "#10b981", "#059669", "#06130e", "#0c1f17"},
		{"Cyber Violet", "#8b5cf6", "#7c3aed", "#0e0c18", "#171424"},
		{"Ocean Blue", "#0ea5e9", "#0284c7", "#08131d", "#0e2030"},
		{"Sunset Amber", "#f59e0b", "#d97706", "#141009", "#201a0e"},
	}
)

func randomElement[T any](items []T) T {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(items))))
	if err != nil || len(items) == 0 {
		return items[0]
	}
	return items[n.Int64()]
}

// GenerateUniqueDecoy builds a complete, unique static website in targetDir
func (s *DecoyService) GenerateUniqueDecoy(targetDir string) (*DecoyInfo, error) {
	if strings.TrimSpace(targetDir) == "" {
		targetDir = "/var/www/decoy"
	}
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory %s: %w", targetDir, err)
	}

	company := fmt.Sprintf("%s %s", randomElement(companyPrefixes), randomElement(companySuffixes))
	tagline := randomElement(taglines)
	palette := randomElement(colorPalettes)

	htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%s · Modern Cloud & Data Solutions</title>
  <meta name="description" content="%s. Scalable engineering for global teams.">
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <nav class="navbar">
    <div class="container nav-container">
      <div class="logo">
        <span class="logo-dot"></span>
        <span class="logo-text">%s</span>
      </div>
      <div class="nav-links">
        <a href="#services">Platform</a>
        <a href="#architecture">Architecture</a>
        <a href="#about">About</a>
        <a href="#contact" class="btn btn-outline">Client Access</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="container hero-container">
      <span class="badge">Enterprise Infrastructure v2.4</span>
      <h1>%s</h1>
      <p class="hero-desc">
        Engineered for mission-critical reliability, automated telemetry, and sub-millisecond edge latency across tier-3 data centers.
      </p>
      <div class="hero-actions">
        <a href="#contact" class="btn btn-primary">Schedule Demo</a>
        <a href="#architecture" class="btn btn-secondary">Platform Status</a>
      </div>
    </div>
  </header>

  <section id="services" class="section">
    <div class="container">
      <div class="section-header">
        <h2>Core Capabilities</h2>
        <p>Built from the ground up for high-concurrency environments and strict compliance.</p>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-icon">⚡</div>
          <h3>Edge Data Telemetry</h3>
          <p>Real-time distributed metrics aggregation with sub-second visibility across global endpoints.</p>
        </div>
        <div class="card">
          <div class="card-icon">🛡️</div>
          <h3>Zero-Trust Perimeter</h3>
          <p>Multi-layered isolation, end-to-end transport layer security, and authenticated access tunnels.</p>
        </div>
        <div class="card">
          <div class="card-icon">🌐</div>
          <h3>Anycast Route Routing</h3>
          <p>Dynamic intelligent packet switching ensuring 99.999%% operational availability worldwide.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="architecture" class="section section-dark">
    <div class="container">
      <div class="section-header">
        <h2>Global Infrastructure</h2>
        <p>Reliable backbone operating under stringent SLA guarantees.</p>
      </div>
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-num">99.99%%</span>
          <span class="stat-label">Uptime SLA</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">&lt; 15ms</span>
          <span class="stat-label">Edge Response</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">24 / 7</span>
          <span class="stat-label">NOC Telemetry</span>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container footer-container">
      <p>&copy; 2026 %s Inc. All rights reserved. System Operational.</p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Security Disclosure</a>
      </div>
    </div>
  </footer>
</body>
</html>`, company, tagline, company, tagline, company)

	cssContent := fmt.Sprintf(`:root {
  --primary: %s;
  --primary-hover: %s;
  --bg-dark: %s;
  --bg-card: %s;
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --border: rgba(255, 255, 255, 0.08);
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-main);
  line-height: 1.6;
}
.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px;
}
.navbar {
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(11, 15, 25, 0.85);
}
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: -0.5px;
}
.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%%;
  background: var(--primary);
  box-shadow: 0 0 12px var(--primary);
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}
.nav-links a:hover {
  color: #fff;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid var(--border);
  margin-left: 12px;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}
.btn-outline {
  border: 1px solid var(--border);
  padding: 8px 16px;
}
.hero {
  padding: 110px 0 80px;
  text-align: center;
}
.hero-container {
  max-width: 800px;
}
.badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 24px;
}
.hero h1 {
  font-size: 46px;
  font-weight: 800;
  letter-spacing: -1.2px;
  line-height: 1.15;
  margin-bottom: 20px;
}
.hero-desc {
  font-size: 18px;
  color: var(--text-muted);
  margin-bottom: 36px;
}
.section {
  padding: 80px 0;
}
.section-dark {
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 50px;
}
.section-header h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
}
.section-header p {
  color: var(--text-muted);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 32px;
  transition: transform 0.2s, border-color 0.2s;
}
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
}
.card-icon {
  font-size: 28px;
  margin-bottom: 16px;
}
.card h3 {
  font-size: 18px;
  margin-bottom: 10px;
}
.card p {
  color: var(--text-muted);
  font-size: 14px;
}
.stats-row {
  display: flex;
  justify-content: space-around;
  text-align: center;
  flex-wrap: wrap;
  gap: 24px;
}
.stat-box .stat-num {
  display: block;
  font-size: 42px;
  font-weight: 800;
  color: var(--primary);
}
.stat-box .stat-label {
  font-size: 14px;
  color: var(--text-muted);
}
.footer {
  padding: 40px 0;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-muted);
}
.footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  margin-left: 20px;
}
.footer-links a:hover {
  color: #fff;
}
@media (max-width: 768px) {
  .hero h1 { font-size: 32px; }
  .nav-links { display: none; }
}
`, palette.Primary, palette.Hover, palette.DarkBg, palette.CardBg)

	if err := os.WriteFile(filepath.Join(targetDir, "index.html"), []byte(htmlContent), 0644); err != nil {
		return nil, fmt.Errorf("failed to write index.html: %w", err)
	}
	if err := os.WriteFile(filepath.Join(targetDir, "styles.css"), []byte(cssContent), 0644); err != nil {
		return nil, fmt.Errorf("failed to write styles.css: %w", err)
	}

	return &DecoyInfo{
		Theme:       palette.Name,
		CompanyName: company,
		Tagline:     tagline,
		AccentColor: palette.Primary,
		Directory:   targetDir,
		IsCustom:    false,
	}, nil
}

// GetDecoyStatus inspects targetDir for existing decoy website
func (s *DecoyService) GetDecoyStatus(targetDir string) *DecoyInfo {
	if strings.TrimSpace(targetDir) == "" {
		targetDir = "/var/www/decoy"
	}
	indexPath := filepath.Join(targetDir, "index.html")
	if _, err := os.Stat(indexPath); os.IsNotExist(err) {
		return nil
	}
	data, _ := os.ReadFile(indexPath)
	content := string(data)

	// Simple inspection
	return &DecoyInfo{
		Theme:       "Active Decoy Site",
		CompanyName: "Active Site",
		Directory:   targetDir,
		IsCustom:    !strings.Contains(content, "Enterprise Infrastructure"),
	}
}
