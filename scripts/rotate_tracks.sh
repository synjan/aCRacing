#!/bin/bash
set -euo pipefail
# rotate_tracks.sh – Roterer baner daglig for MX-5 Cup og GT3
# Kjøres av cron kl. 06:00 hver dag: 0 6 * * * /opt/scripts/rotate_tracks.sh

# ── MX-5 CUP BANER ─────────────────────────────────────────
MX5CUP_TRACKS=(
  "rt_lime_rock_park|no_chicane"
  "ks_laguna_seca|"
  "okayama_international|"
  "summit_point|"
)

# ── GT3 BANER ──────────────────────────────────────────────
GT3_TRACKS=(
  "lilski_road_america|"
  "spa|2022"
  "mx_sebring|raceday_standing"
  "lilski_watkins_glen|boot"
  "road_atlanta2018|grandprix"
  "ks_zandvoort|"
)

# ── HJELPEFUNKSJON ───────────────────────────────────────────
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

# ── MX-5 CUP ROTERING ──────────────────────────────────────
MX5CUP_TRACKS_LIST=("${MX5CUP_TRACKS[@]}")
IDX=$(( ($(date +%u) - 1) % ${#MX5CUP_TRACKS_LIST[@]} ))
IFS='|' read -r TRACK CONFIG <<< "${MX5CUP_TRACKS_LIST[$IDX]}"
update_server_cfg "/opt/ac-mx5cup/cfg/server_cfg.ini" "$TRACK" "$CONFIG"
restart_server "ac-mx5cup"

echo "📅 MX-5 Cup i dag ($(date +%A)): $TRACK"

# ── GT3 ROTERING ────────────────────────────────────────────
GT3_TRACKS_LIST=("${GT3_TRACKS[@]}")
IDX=$(( ($(date +%u) - 1) % ${#GT3_TRACKS_LIST[@]} ))
IFS='|' read -r TRACK CONFIG <<< "${GT3_TRACKS_LIST[$IDX]}"
update_server_cfg "/opt/ac-gt3/cfg/server_cfg.ini" "$TRACK" "$CONFIG"
restart_server "ac-gt3"

echo "📅 GT3 i dag ($(date +%A)): $TRACK"
echo "✅ Rotasjon ferdig $(date)"
