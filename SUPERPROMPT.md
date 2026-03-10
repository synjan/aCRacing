# 🏎️ SUPERPROMPT – Assetto Corsa Server Setup
# Bruk via: Anthropic API eller Claude CLI
# Mål: Komplett oppsett av 3 AC-servere på Hetzner CX32

---

## SYSTEM PROMPT

```
Du er en ekspert Linux-serveradministrator og Assetto Corsa-spesialist.
Du skal sette opp et komplett Assetto Corsa dedicated server-miljø på en
Hetzner CX32 (Ubuntu 24.04). Du kommuniserer kun via bash-kommandoer og
konfig-filer. Du er presis, grundig og følger alltid prinsippene nedenfor.
```

---

## UTVIKLINGSPRINSIPPER

### 1. Idempotens
Alle scripts MÅ kunne kjøres flere ganger uten bivirkninger.
Sjekk alltid om noe eksisterer før du oppretter det.

```bash
# ✅ Riktig
[ -d /opt/ac-trackday ] || mkdir -p /opt/ac-trackday

# ❌ Feil
mkdir /opt/ac-trackday
```

### 2. Fail fast – stopp ved feil
```bash
#!/bin/bash
set -euo pipefail          # -e: stopp ved feil, -u: udefinerte variabler er feil
                           # -o pipefail: feil i pipes propageres
trap 'echo "❌ FEIL på linje $LINENO" >&2' ERR
```

### 3. Logging – alt skal logges
```bash
LOG=/var/log/ac-setup.log
exec > >(tee -a "$LOG") 2>&1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starter installasjon..."
```

### 4. Aldri hardkode secrets
Bruk miljøvariabler eller .env-fil:
```bash
source /opt/ac-setup/.env
# .env inneholder: ADMIN_PASSWORD, DOMAIN, HETZNER_API_KEY
```

### 5. Atomic operasjoner
Skriv til temp-fil, flytt atomisk:
```bash
# ✅ Atomic – aldri korrupt config
tmp=$(mktemp)
cat > "$tmp" << 'EOF'
[SERVER]
NAME=Min Server
EOF
mv "$tmp" /opt/ac-trackday/cfg/server_cfg.ini
```

### 6. Backup før endring
```bash
backup_file() {
  local f="$1"
  [ -f "$f" ] && cp "$f" "${f}.bak.$(date +%Y%m%d_%H%M%S)"
}
backup_file /opt/ac-trackday/cfg/server_cfg.ini
```

### 7. Verifiser etter hvert steg
```bash
verify_service() {
  local svc="$1"
  systemctl is-active --quiet "$svc" \
    && echo "✅ $svc kjører" \
    || { echo "❌ $svc feilet"; exit 1; }
}
```

### 8. Minimal tilgang (principle of least privilege)
- AC-serverne kjører som dedikert `acserver`-bruker uten shell
- Ingen sudo-tilgang fra AC-prosessene
- Stracker har kun lese/skriv til egne databaser

---

## OPPGAVE: KOMPLETT SERVEROPPSETT

### FASE 0 – TEARDOWN (slett eksisterende)

```bash
#!/bin/bash
set -euo pipefail
LOG=/var/log/ac-setup.log
exec > >(tee -a "$LOG") 2>&1

echo "🗑️  FASE 0: Rydder eksisterende oppsett..."

# Stop og deaktiver alle AC-relaterte tjenester
for svc in ac-trackday ac-formula ac-roadcar \
           stracker-trackday stracker-formula stracker-roadcar \
           ac-live-timings; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    systemctl stop "$svc"
    echo "  Stoppet: $svc"
  fi
  if systemctl is-enabled --quiet "$svc" 2>/dev/null; then
    systemctl disable "$svc"
  fi
  rm -f "/etc/systemd/system/${svc}.service"
done

systemctl daemon-reload

# Slett installasjonsmapper
for dir in /opt/ac-trackday /opt/ac-formula /opt/ac-roadcar \
           /opt/stracker /opt/ac-live-timings /opt/scripts; do
  if [ -d "$dir" ]; then
    rm -rf "$dir"
    echo "  Slettet: $dir"
  fi
done

# Slett Caddy-konfig (behold Caddy selv)
rm -f /etc/caddy/Caddyfile

# Slett UFW AC-regler (behold SSH og HTTP/HTTPS)
ufw delete allow 9600/tcp 2>/dev/null || true
ufw delete allow 9600/udp 2>/dev/null || true
ufw delete allow 9610/tcp 2>/dev/null || true
ufw delete allow 9610/udp 2>/dev/null || true
ufw delete allow 9620/tcp 2>/dev/null || true
ufw delete allow 9620/udp 2>/dev/null || true

echo "✅ Teardown ferdig"
```

---

### FASE 1 – SYSTEM & AVHENGIGHETER

```bash
echo "📦 FASE 1: Installerer avhengigheter..."

apt-get update -qq
apt-get install -y \
  wget curl unzip git \
  python3 python3-pip \
  nodejs npm \
  caddy ufw \
  tmux htop \
  sqlite3

# Opprett dedikert bruker
id acserver &>/dev/null || useradd -r -m -s /sbin/nologin acserver

# Opprett mappestruktur
mkdir -p \
  /opt/ac-{trackday,formula,roadcar}/{cfg,extra,content/{cars,tracks}} \
  /opt/stracker/{trackday,formula,roadcar} \
  /opt/ac-live-timings \
  /opt/scripts \
  /var/log/ac

chown -R acserver:acserver \
  /opt/ac-{trackday,formula,roadcar} \
  /opt/stracker \
  /opt/ac-live-timings \
  /var/log/ac

echo "✅ System klart"
```

---

### FASE 2 – ASSETTOSERVER INSTALLASJON

```bash
echo "🏎️  FASE 2: Installerer AssettoServer..."

ASSETTOSERVER_VERSION=$(curl -s https://api.github.com/repos/compujuckel/AssettoServer/releases/latest \
  | grep '"tag_name"' | cut -d'"' -f4)

echo "  Laster ned versjon: $ASSETTOSERVER_VERSION"

cd /tmp
wget -q "https://github.com/compujuckel/AssettoServer/releases/download/${ASSETTOSERVER_VERSION}/AssettoServer-linux-x64.tar.gz"
tar -xzf AssettoServer-linux-x64.tar.gz -C /tmp/assettoserver/

for server in trackday formula roadcar; do
  cp -r /tmp/assettoserver/* /opt/ac-${server}/
  chmod +x /opt/ac-${server}/AssettoServer
  chown -R acserver:acserver /opt/ac-${server}
  echo "  ✅ Installert: ac-${server}"
done

rm -rf /tmp/assettoserver* /tmp/AssettoServer*
echo "✅ AssettoServer installert ($ASSETTOSERVER_VERSION)"
```

---

### FASE 3 – KONFIG-FILER

Last opp konfig-filene fra `ac-server-setup.zip` til serveren:

```bash
# Fra lokal maskin:
scp ac-server-setup.zip root@<SERVER_IP>:/tmp/
ssh root@<SERVER_IP> << 'ENDSSH'
  cd /tmp && unzip -q ac-server-setup.zip

  # Kopier konfig-filer
  cp ac-server-setup/trackday/cfg/server_cfg.ini    /opt/ac-trackday/cfg/
  cp ac-server-setup/trackday/extra/extra_cfg.yml   /opt/ac-trackday/
  cp ac-server-setup/formula/cfg/server_cfg.ini     /opt/ac-formula/cfg/
  cp ac-server-setup/formula/extra/extra_cfg.yml    /opt/ac-formula/
  cp ac-server-setup/roadcar/cfg/server_cfg.ini     /opt/ac-roadcar/cfg/
  cp ac-server-setup/roadcar/extra/extra_cfg.yml    /opt/ac-roadcar/

  # stracker
  cp ac-server-setup/stracker/trackday/stracker.ini /opt/stracker/trackday/
  cp ac-server-setup/stracker/formula/stracker.ini  /opt/stracker/formula/
  cp ac-server-setup/stracker/roadcar/stracker.ini  /opt/stracker/roadcar/

  # Caddy
  cp ac-server-setup/caddy/Caddyfile /etc/caddy/Caddyfile

  # Scripts
  cp ac-server-setup/scripts/rotate_tracks.sh /opt/scripts/
  chmod +x /opt/scripts/rotate_tracks.sh

  chown -R acserver:acserver /opt/ac-{trackday,formula,roadcar} /opt/stracker
  rm -rf /tmp/ac-server-setup*
ENDSSH
```

**Sett secrets (kjør manuelt etter opplasting):**
```bash
# Bytt ut CHANGE_ME med sterkt passord
ADMIN_PASS=$(openssl rand -base64 16)
DOMAIN="dittdomene.no"

for server in trackday formula roadcar; do
  sed -i "s/CHANGE_ME/${ADMIN_PASS}/" /opt/ac-${server}/cfg/server_cfg.ini
done

sed -i "s/dittdomene.no/${DOMAIN}/g" /etc/caddy/Caddyfile

echo "Admin password: $ADMIN_PASS" > /root/.ac-secrets
chmod 600 /root/.ac-secrets
echo "✅ Lagret i /root/.ac-secrets"
```

---

### FASE 4 – STRACKER

```bash
echo "📊 FASE 4: Installerer stracker..."

pip3 install stracker --break-system-packages -q \
  || { echo "Prøver alternativ installasjon..."; 
       cd /opt && git clone https://github.com/NEYS/stracker.git; }

# Opprett tomme databaser
for srv in trackday formula roadcar; do
  touch /opt/stracker/${srv}/stracker.db3
  chown acserver:acserver /opt/stracker/${srv}/stracker.db3
done

echo "✅ stracker installert"
```

---

### FASE 5 – AC LIVE TIMINGS

```bash
echo "🗺️  FASE 5: Installerer AC Live Timings..."

cd /opt/ac-live-timings
git clone https://github.com/nitrocrime/ac-live-timings . -q
npm install --silent
cp /tmp/ac-server-setup/plugins/ac-live-timings.conf config.json

chown -R acserver:acserver /opt/ac-live-timings
echo "✅ AC Live Timings installert"
```

---

### FASE 6 – SYSTEMD SERVICES

```bash
echo "⚙️  FASE 6: Oppretter systemd-tjenester..."

# Funksjon for å opprette service-fil
create_service() {
  local name="$1" dir="$2" bin="$3" mem="$4" cpu="$5"
  cat > "/etc/systemd/system/${name}.service" << EOF
[Unit]
Description=${name}
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=acserver
WorkingDirectory=${dir}
ExecStart=${bin}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${name}
MemoryMax=${mem}
CPUQuota=${cpu}

[Install]
WantedBy=multi-user.target
EOF
  echo "  Opprettet: ${name}.service"
}

# AC servere
create_service "ac-trackday"  /opt/ac-trackday      "/opt/ac-trackday/AssettoServer"  "2500M" "80%"
create_service "ac-formula"   /opt/ac-formula       "/opt/ac-formula/AssettoServer"   "2000M" "70%"
create_service "ac-roadcar"   /opt/ac-roadcar       "/opt/ac-roadcar/AssettoServer"   "2000M" "70%"

# stracker
create_service "stracker-trackday" /opt/stracker/trackday \
  "python3 /opt/stracker/stracker.py --config /opt/stracker/trackday/stracker.ini" "300M" "20%"
create_service "stracker-formula" /opt/stracker/formula \
  "python3 /opt/stracker/stracker.py --config /opt/stracker/formula/stracker.ini" "300M" "20%"
create_service "stracker-roadcar" /opt/stracker/roadcar \
  "python3 /opt/stracker/stracker.py --config /opt/stracker/roadcar/stracker.ini" "300M" "20%"

# AC Live Timings
create_service "ac-live-timings" /opt/ac-live-timings \
  "node /opt/ac-live-timings/server.js" "200M" "10%"

systemctl daemon-reload

# Aktiver og start alle
for svc in ac-trackday ac-formula ac-roadcar \
           stracker-trackday stracker-formula stracker-roadcar \
           ac-live-timings; do
  systemctl enable --now "$svc"
  sleep 2
  verify_service "$svc"
done

echo "✅ Alle tjenester oppe"
```

---

### FASE 7 – BRANNMUR

```bash
echo "🔥 FASE 7: Konfigurerer UFW..."
bash /opt/scripts/firewall_setup.sh
echo "✅ Brannmur konfigurert"
```

---

### FASE 8 – CADDY & HTTPS

```bash
echo "🔒 FASE 8: Starter Caddy..."
systemctl enable --now caddy
sleep 3
verify_service caddy
echo "✅ Caddy oppe med automatisk SSL"
```

---

### FASE 9 – CRON (banerotering)

```bash
echo "⏰ FASE 9: Setter opp cron-jobb..."

CRON_LINE="0 6 * * * /opt/scripts/rotate_tracks.sh >> /var/log/ac/rotate.log 2>&1"
( crontab -l 2>/dev/null | grep -v rotate_tracks; echo "$CRON_LINE" ) | crontab -

echo "✅ Cron aktiv – baner roterer kl. 06:00 daglig"
```

---

### FASE 10 – VERIFISERING

```bash
echo ""
echo "════════════════════════════════════════"
echo "  VERIFIKASJON"
echo "════════════════════════════════════════"

# Sjekk alle tjenester
for svc in ac-trackday ac-formula ac-roadcar \
           stracker-trackday stracker-formula stracker-roadcar \
           ac-live-timings caddy; do
  if systemctl is-active --quiet "$svc"; then
    echo "  ✅ $svc"
  else
    echo "  ❌ $svc – FEILET"
  fi
done

# Sjekk porter
echo ""
echo "Åpne porter:"
ss -tulpn | grep -E ':(9600|9610|9620|8772|50041|50042|50043|80|443)' \
  | awk '{print "  ✅", $5}'

# RAM-bruk
echo ""
echo "RAM-bruk:"
free -h | grep Mem

echo ""
echo "════════════════════════════════════════"
echo "  OPPSETT FERDIG 🏁"
echo "════════════════════════════════════════"
echo ""
echo "  🏔️  Trackday:  ac://<SERVER_IP>:9600"
echo "  🏁  Formula:   ac://<SERVER_IP>:9610"
echo "  🚗  Roadcar:   ac://<SERVER_IP>:9620"
echo ""
echo "  📊  Stats:  https://stats.$DOMAIN"
echo "  🗺️   Live:   https://live.$DOMAIN"
echo ""
echo "  🔑  Admin-passord: $(cat /root/.ac-secrets)"
echo "════════════════════════════════════════"
```

---

## API-BRUK (Anthropic)

Kjør hele oppsettet via Claude API:

```python
import anthropic
import subprocess

client = anthropic.Anthropic()

with open("superprompt.md", "r") as f:
    superprompt = f.read()

# Les system-seksjon ut av prompten
system = superprompt.split("```")[1].strip()

response = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=8096,
    system=system,
    messages=[
        {
            "role": "user",
            "content": f"""
Sett opp komplett AC-server på {SERVER_IP}.
SSH-nøkkel er tilgjengelig.
Konfig-pakke er lastet opp til /tmp/ac-server-setup.zip.

Utfør alle faser i rekkefølge (0-10).
Vis output fra hvert steg.
Stopp og rapporter hvis noe feiler.

Superprompt og konfig-referanse:
{superprompt}
"""
        }
    ]
)

print(response.content[0].text)
```

---

## CLI-BRUK

```bash
# Alternativ 1: Direkte bash (kopier og kjør på server)
ssh root@<SERVER_IP> 'bash -s' < setup.sh

# Alternativ 2: Med Claude CLI (hvis installert)
cat superprompt.md | claude --model claude-opus-4-5 \
  --system "Du er en Linux-serveradministrator" \
  "Utfør oppsettet fase for fase. Server IP: <SERVER_IP>"

# Alternativ 3: Hetzner Cloud CLI + bash
hcloud server ssh <SERVER_NAME> 'bash /tmp/setup.sh'
```

---

## FEILSØKING

```bash
# Se logger for en spesifikk tjeneste
journalctl -u ac-trackday -f --since "10 min ago"

# Sjekk RAM-press
watch -n 2 'free -h && echo "---" && systemctl status ac-*'

# Manuell banerotering (test)
bash /opt/scripts/rotate_tracks.sh

# Restart alt
for svc in ac-trackday ac-formula ac-roadcar; do systemctl restart $svc; done

# Se hvem som er tilkoblet
curl -s http://localhost:9680/INFO | python3 -m json.tool
```
