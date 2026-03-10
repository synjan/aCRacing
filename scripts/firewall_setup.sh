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

# ── Formula (port 9610) ──────────────────────────────────────
ufw allow 9610/tcp comment "AC Formula TCP"
ufw allow 9610/udp comment "AC Formula UDP"
ufw allow 9690/tcp comment "AC Formula HTTP"

# ── Roadcar (port 9620) ──────────────────────────────────────
ufw allow 9620/tcp comment "AC Roadcar TCP"
ufw allow 9620/udp comment "AC Roadcar UDP"
ufw allow 9700/tcp comment "AC Roadcar HTTP"

# ── stracker (kun lokalt, Caddy proxyer) ────────────────────
# Ikke åpne stracker-porter eksternt – Caddy håndterer dette

# ── Status ───────────────────────────────────────────────────
echo ""
echo "✅ UFW oppsett ferdig:"
ufw status verbose
