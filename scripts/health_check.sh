#!/bin/bash
set -uo pipefail
# health_check.sh – Helsesjekk for alle AC-tjenester, porter og systemressurser
# Kjøres av cron hvert 15. minutt:
# */15 * * * * /opt/scripts/health_check.sh >> /var/log/ac-health.log 2>&1 || echo "AC HEALTH ALERT" | mail -s "AC Server Alert" admin@example.com

# ── KONFIGURASJON ───────────────────────────────────────────
SERVICES=(
  "ac-trackday"
  "ac-mx5cup"
  "ac-gt3"
  "stracker-trackday"
  "stracker-mx5cup"
  "stracker-gt3"
  "ac-live-timings"
)
AC_PORTS=(9600 9610 9620)
HTTP_PORTS=(9680 9690 9700)
DISK_THRESHOLD=90
MEM_THRESHOLD=90
ERRORS=0

# ── SJEKK SYSTEMD-TJENESTER ────────────────────────────────
for svc in "${SERVICES[@]}"; do
  if ! systemctl is-active --quiet "$svc"; then
    echo "❌ $svc er NEDE"
    ERRORS=$((ERRORS + 1))
  fi
done

# ── SJEKK AC-PORTER (TCP) ──────────────────────────────────
for port in "${AC_PORTS[@]}"; do
  if ! ss -tlnp | grep -q ":${port} "; then
    echo "❌ TCP-port $port ikke åpen (AC-server)"
    ERRORS=$((ERRORS + 1))
  fi
done

# ── SJEKK HTTP-PORTER ──────────────────────────────────────
for port in "${HTTP_PORTS[@]}"; do
  if ! ss -tlnp | grep -q ":${port} "; then
    echo "❌ TCP-port $port ikke åpen (HTTP API)"
    ERRORS=$((ERRORS + 1))
  fi
done

# ── SJEKK DISKBRUK ─────────────────────────────────────────
DISK_PCT=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [[ $DISK_PCT -gt $DISK_THRESHOLD ]]; then
  echo "⚠️ Disk: ${DISK_PCT}% brukt (terskel: ${DISK_THRESHOLD}%)"
  ERRORS=$((ERRORS + 1))
fi

# ── SJEKK MINNEBRUK ────────────────────────────────────────
MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
if [[ $MEM_PCT -gt $MEM_THRESHOLD ]]; then
  echo "⚠️ RAM: ${MEM_PCT}% brukt (terskel: ${MEM_THRESHOLD}%)"
  ERRORS=$((ERRORS + 1))
fi

# ── SJEKK CADDY ────────────────────────────────────────────
if ! systemctl is-active --quiet caddy; then
  echo "❌ Caddy er NEDE (reverse proxy)"
  ERRORS=$((ERRORS + 1))
fi

# ── RESULTAT ────────────────────────────────────────────────
if [[ $ERRORS -eq 0 ]]; then
  echo "✅ Alt OK ($(date '+%F %T'))"
else
  echo "❌ ${ERRORS} problem(er) funnet ($(date '+%F %T'))"
fi

exit $ERRORS
