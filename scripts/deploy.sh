#!/bin/bash
set -euo pipefail
# deploy.sh – Deployer konfigfiler fra repoet til serveren via scp
# Bruk: deploy.sh [--ip IP] [--dry-run] [--only trackday|mx5cup|gt3] [--caddy] [--web]

# ── KONFIGURASJON ───────────────────────────────────────────
SERVER_IP="${AC_SERVER_IP:-}"
DRY_RUN=false
DEPLOY_CADDY=false
DEPLOY_WEB=false
INSTANCES=("trackday" "mx5cup" "gt3")
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── ARGUMENTPARSING ─────────────────────────────────────────
usage() {
  echo "Bruk: deploy.sh [--ip IP] [--dry-run] [--only trackday|mx5cup|gt3] [--caddy]"
  echo ""
  echo "Alternativer:"
  echo "  --ip IP       Server-IP (eller sett AC_SERVER_IP miljøvariabel)"
  echo "  --dry-run     Vis hva som ville blitt deployet, uten å gjøre det"
  echo "  --only INST   Deploy kun én instans (trackday, mx5cup, eller gt3)"
  echo "  --caddy       Deploy også Caddyfile"
  echo "  --web         Bygg og deploy web frontend til /opt/www/"
  echo "  --help        Vis denne hjelpen"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ip)
      SERVER_IP="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --only)
      INSTANCES=("$2")
      shift 2
      ;;
    --caddy)
      DEPLOY_CADDY=true
      shift
      ;;
    --web)
      DEPLOY_WEB=true
      shift
      ;;
    --help)
      usage
      ;;
    *)
      echo "❌ Ukjent argument: $1"
      usage
      ;;
  esac
done

if [[ -z "$SERVER_IP" ]]; then
  echo "❌ Server-IP mangler. Bruk --ip eller sett AC_SERVER_IP."
  exit 1
fi

# ── HJELPEFUNKSJONER ────────────────────────────────────────
run_cmd() {
  if [[ "$DRY_RUN" == true ]]; then
    echo "  [dry-run] $*"
  else
    "$@"
  fi
}

deploy_instance() {
  local inst="$1"
  echo "📦 Deployer ${inst}..."

  # AC-serverkonfig
  local cfg_dir="${SCRIPT_DIR}/${inst}/cfg"
  if [[ -f "${cfg_dir}/server_cfg.ini" ]]; then
    run_cmd scp "${cfg_dir}/server_cfg.ini" "root@${SERVER_IP}:/opt/ac-${inst}/cfg/"
  fi
  if [[ -f "${cfg_dir}/entry_list.ini" ]]; then
    run_cmd scp "${cfg_dir}/entry_list.ini" "root@${SERVER_IP}:/opt/ac-${inst}/cfg/"
  fi

  # AssettoServer extra config
  local extra_file="${SCRIPT_DIR}/${inst}/extra/extra_cfg.yml"
  if [[ -f "$extra_file" ]]; then
    run_cmd scp "$extra_file" "root@${SERVER_IP}:/opt/ac-${inst}/"
  fi

  # stracker config
  local stracker_file="${SCRIPT_DIR}/stracker/${inst}/stracker.ini"
  if [[ -f "$stracker_file" ]]; then
    run_cmd scp "$stracker_file" "root@${SERVER_IP}:/opt/stracker/${inst}/"
  fi

  echo "  ✅ ${inst} deployet"
}

restart_instance() {
  local inst="$1"
  run_cmd ssh "root@${SERVER_IP}" "systemctl restart ac-${inst} stracker-${inst}"
  echo "  🔄 ac-${inst} + stracker-${inst} restartet"
}

# ── DEPLOY ──────────────────────────────────────────────────
echo "🚀 Deploy til ${SERVER_IP}"
[[ "$DRY_RUN" == true ]] && echo "  ⚠️ Dry-run modus — ingen endringer gjøres"
echo ""

for inst in "${INSTANCES[@]}"; do
  deploy_instance "$inst"
done

# Caddy
if [[ "$DEPLOY_CADDY" == true ]]; then
  echo "📦 Deployer Caddyfile..."
  run_cmd scp "${SCRIPT_DIR}/caddy/Caddyfile" "root@${SERVER_IP}:/etc/caddy/Caddyfile"
  echo "  ✅ Caddyfile deployet"
fi

# Web (Express + frontend)
if [[ "$DEPLOY_WEB" == true ]]; then
  echo "📦 Bygger og deployer web..."
  (cd "${SCRIPT_DIR}/web" && npm run build)
  # Kopier alt unntatt node_modules og .env
  run_cmd ssh "root@${SERVER_IP}" "mkdir -p /opt/www"
  run_cmd scp "${SCRIPT_DIR}/web/server.js" "root@${SERVER_IP}:/opt/www/"
  run_cmd scp "${SCRIPT_DIR}/web/package.json" "root@${SERVER_IP}:/opt/www/"
  run_cmd scp -r "${SCRIPT_DIR}/web/dist/." "root@${SERVER_IP}:/opt/www/dist/"
  run_cmd ssh "root@${SERVER_IP}" "cd /opt/www && npm install --omit=dev"
  echo "  ✅ Web deployet til /opt/www/"
fi

# ── RESTART ─────────────────────────────────────────────────
echo ""
if [[ "$DRY_RUN" == true ]]; then
  echo "[dry-run] Ville restartet: ${INSTANCES[*]}"
else
  read -rp "🔄 Restarte tjenester for ${INSTANCES[*]}? [j/N] " svar
  if [[ "$svar" =~ ^[jJyY]$ ]]; then
    for inst in "${INSTANCES[@]}"; do
      restart_instance "$inst"
    done
    if [[ "$DEPLOY_WEB" == true ]]; then
      ssh "root@${SERVER_IP}" "systemctl restart acracing-web"
      echo "  🔄 acracing-web restartet"
    fi
    if [[ "$DEPLOY_CADDY" == true ]]; then
      ssh "root@${SERVER_IP}" "systemctl reload caddy"
      echo "  🔄 Caddy reloadet"
    fi
    echo ""
    echo "✅ Deploy og restart ferdig ($(date '+%F %T'))"
  else
    echo "⏭️ Restart hoppet over — husk å restarte manuelt"
  fi
fi
