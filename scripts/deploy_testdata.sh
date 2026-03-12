#!/bin/bash
set -euo pipefail
# deploy_testdata.sh – Laster testdata inn i stracker-databasene på serveren
# Brukes til å fylle tomme stracker-databaser med realistiske rundetider.

SERVER="root@46.225.176.106"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Stracker testdata-deploy ==="

# 1. Kopier SQL-filer til serveren
echo "Kopierer SQL-filer..."
scp "$SCRIPT_DIR/stracker_testdata_trackday.sql" "$SERVER:/tmp/"
scp "$SCRIPT_DIR/stracker_testdata_mx5cup.sql" "$SERVER:/tmp/"
scp "$SCRIPT_DIR/stracker_testdata_gt3.sql" "$SERVER:/tmp/"

# 2. Stopp stracker, kjør SQL, start igjen
echo "Kjører SQL mot databasene..."
ssh "$SERVER" '
  set -e

  echo "Stopper stracker-instanser..."
  systemctl stop stracker-trackday stracker-mx5cup stracker-gt3

  echo "Setter inn testdata (trackday)..."
  sqlite3 /opt/stracker/trackday/stracker.db3 < /tmp/stracker_testdata_trackday.sql

  echo "Setter inn testdata (mx5cup)..."
  sqlite3 /opt/stracker/mx5cup/stracker.db3 < /tmp/stracker_testdata_mx5cup.sql

  echo "Setter inn testdata (gt3)..."
  sqlite3 /opt/stracker/gt3/stracker.db3 < /tmp/stracker_testdata_gt3.sql

  echo "Starter stracker-instanser..."
  systemctl start stracker-trackday stracker-mx5cup stracker-gt3

  # Verifiser
  echo ""
  echo "=== Verifisering ==="
  echo "Trackday runder: $(sqlite3 /opt/stracker/trackday/stracker.db3 "SELECT COUNT(*) FROM Lap")"
  echo "MX-5 Cup runder: $(sqlite3 /opt/stracker/mx5cup/stracker.db3 "SELECT COUNT(*) FROM Lap")"
  echo "GT3 runder:      $(sqlite3 /opt/stracker/gt3/stracker.db3 "SELECT COUNT(*) FROM Lap")"

  # Rydd opp
  rm /tmp/stracker_testdata_*.sql
  echo ""
  echo "Ferdig!"
'
