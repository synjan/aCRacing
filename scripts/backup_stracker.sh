#!/bin/bash
set -euo pipefail
# backup_stracker.sh – Automatisert backup av stracker-databaser
# Kjøres av cron kl. 04:00 hver dag: 0 4 * * * /opt/scripts/backup_stracker.sh >> /var/log/ac-backup.log 2>&1

# ── KONFIGURASJON ───────────────────────────────────────────
BACKUP_DIR="/backup/stracker"
RETENTION_DAYS=14
INSTANCES=("trackday" "mx5cup" "gt3")
DATE=$(date +%F)
LOG_PREFIX="[$(date '+%F %T')]"

# ── OPPRETT BACKUP-MAPPE ───────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── KOPIER DATABASER ────────────────────────────────────────
ERRORS=0
for instance in "${INSTANCES[@]}"; do
  src="/opt/stracker/${instance}/stracker.db3"
  dst="${BACKUP_DIR}/${instance}-${DATE}.db3"

  if [[ ! -f "$src" ]]; then
    echo "${LOG_PREFIX} ❌ Kildefil finnes ikke: $src"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  if cp "$src" "$dst"; then
    echo "${LOG_PREFIX} ✅ Kopiert: $src → $dst"
  else
    echo "${LOG_PREFIX} ❌ Feil ved kopiering av $src"
    ERRORS=$((ERRORS + 1))
  fi
done

# ── SLETT GAMLE BACKUPS ─────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "*.db3" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [[ $DELETED -gt 0 ]]; then
  echo "${LOG_PREFIX} 🗑️ Slettet $DELETED backup(s) eldre enn ${RETENTION_DAYS} dager"
fi

# ── OPPSUMMERING ────────────────────────────────────────────
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "${LOG_PREFIX} 📦 Backup ferdig — totalt: $TOTAL_SIZE, feil: $ERRORS"

exit $ERRORS
