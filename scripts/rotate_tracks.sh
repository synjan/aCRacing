#!/bin/bash
set -euo pipefail
# rotate_tracks.sh – Roterer baner daglig for Formula og Roadcar
# Kjøres av cron kl. 06:00 hver dag: 0 6 * * * /opt/scripts/rotate_tracks.sh

# ── FORMULA BANER ────────────────────────────────────────────
FORMULA_TRACKS=(
  "monza|"
  "spa|"
  "ks_silverstone|gp"
  "rt_suzuka|suzukagp"
  "ks_barcelona|"
  "ks_red_bull_ring|gp"
  "imola|"
)

# ── ROADCAR BANER ────────────────────────────────────────────
ROADCAR_TRACKS=(
  "ks_barcelona|"
  "ks_silverstone|gp"
  "monza|"
  "ks_red_bull_ring|gp"
  "mugello|"
  "magione|"
  "ks_vallelunga|"
)

# ── HJELPEFUNKSJON ───────────────────────────────────────────
get_track_index() {
  # Beregner hvilken bane basert på dag i året (0-6)
  DAY_OF_WEEK=$(date +%u)  # 1=mandag, 7=søndag
  echo $(( (DAY_OF_WEEK - 1) % ${#1[@]} ))
}

update_server_cfg() {
  local cfg_file="$1"
  local track="$2"
  local config="$3"

  if [[ ! -f "$cfg_file" ]]; then
    echo "❌ FEIL: Konfigurasjonsfil finnes ikke: $cfg_file" >&2
    return 1
  fi

  # Sjekk at track-mappen finnes på serveren
  local server_dir
  server_dir="$(dirname "$(dirname "$cfg_file")")"
  local track_path="${server_dir}/content/tracks/${track}"
  if [[ ! -d "$track_path" ]]; then
    echo "⚠️ ADVARSEL: Track-mappe finnes ikke: $track_path" >&2
    echo "  Fortsetter likevel – AssettoServer vil feile ved oppstart hvis banen mangler." >&2
  fi

  sed -i "s/^TRACK=.*/TRACK=${track}/" "$cfg_file"
  sed -i "s/^CONFIG_TRACK=.*/CONFIG_TRACK=${config}/" "$cfg_file"
  echo "✅ Oppdatert $cfg_file → $track ($config)"
}

restart_server() {
  local service="$1"
  systemctl restart "$service"
  echo "🔄 Restartet $service"
}

# ── FORMULA ROTERING ─────────────────────────────────────────
FORMULA_TRACKS_LIST=("${FORMULA_TRACKS[@]}")
IDX=$(( ($(date +%u) - 1) % ${#FORMULA_TRACKS_LIST[@]} ))
IFS='|' read -r TRACK CONFIG <<< "${FORMULA_TRACKS_LIST[$IDX]}"
update_server_cfg "/opt/ac-formula/cfg/server_cfg.ini" "$TRACK" "$CONFIG"
restart_server "ac-formula"

echo "📅 Formula i dag ($(date +%A)): $TRACK"

# ── ROADCAR ROTERING ──────────────────────────────────────────
ROADCAR_TRACKS_LIST=("${ROADCAR_TRACKS[@]}")
IDX=$(( ($(date +%u) - 1) % ${#ROADCAR_TRACKS_LIST[@]} ))
IFS='|' read -r TRACK CONFIG <<< "${ROADCAR_TRACKS_LIST[$IDX]}"
update_server_cfg "/opt/ac-roadcar/cfg/server_cfg.ini" "$TRACK" "$CONFIG"
restart_server "ac-roadcar"

echo "📅 Roadcar i dag ($(date +%A)): $TRACK"
echo "✅ Rotasjon ferdig $(date)"
