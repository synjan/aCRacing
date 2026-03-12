#!/bin/bash
# firewall_setup.sh – UFW konfigurasjon for alle 3 AC-servere
# Kjør som root: sudo bash firewall_setup.sh

echo "🔥 Setter opp UFW brannmur for Assetto Corsa servere..."

# Aktiver UFW
ufw --force enable

# ── Standard policy ──────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing

# ── SSH ──────────────────────────────────────────────────────
ufw allow 22/tcp comment "SSH"

# ── HTTP/HTTPS (Caddy) ───────────────────────────────────────
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"

# ── Trackday (port 9600) ─────────────────────────────────────
ufw allow 9600/tcp comment "AC Trackday TCP"
ufw allow 9600/udp comment "AC Trackday UDP"
ufw allow 9680/tcp comment "AC Trackday HTTP"

# ── MX-5 Cup (port 9610) ────────────────────────────────────
ufw allow 9610/tcp comment "AC MX5Cup TCP"
ufw allow 9610/udp comment "AC MX5Cup UDP"
ufw allow 9690/tcp comment "AC MX5Cup HTTP"

# ── GT3 (port 9620) ────────────────────────────────────────
ufw allow 9620/tcp comment "AC GT3 TCP"
ufw allow 9620/udp comment "AC GT3 UDP"
ufw allow 9700/tcp comment "AC GT3 HTTP"

# ── Caddy reverse proxy ────────────────────────────────────
ufw allow 8080/tcp comment "Dashboard (Caddy)"
ufw allow 8081/tcp comment "Stracker trackday (Caddy)"
ufw allow 8082/tcp comment "Stracker MX-5 Cup (Caddy)"
ufw allow 8083/tcp comment "Stracker GT3 (Caddy)"

# ── stracker (kun lokalt, Caddy proxyer) ────────────────────
# Ikke åpne stracker-porter eksternt – Caddy håndterer dette

# ── Status ───────────────────────────────────────────────────
echo ""
echo "✅ UFW oppsett ferdig:"
ufw status verbose
