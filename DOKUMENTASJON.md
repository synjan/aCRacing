# DOKUMENTASJON.md — Komplett driftsreferanse

> Sist oppdatert: 2026-03-10
> Samledokument for daglig drift, feilsøking og vedlikehold av tre Assetto Corsa-servere.
> Se også: [INSTALLASJON.md](INSTALLASJON.md) (oppsettguide), [TECHSTACK.md](TECHSTACK.md) (teknologivalg), [SUPERPROMPT.md](SUPERPROMPT.md) (automatisert oppsett).

---

## Innhold

1. [VPS og infrastruktur](#1-vps-og-infrastruktur)
2. [Serveroversikt](#2-serveroversikt)
3. [Nettverkstopologi](#3-nettverkstopologi)
4. [Tjenestestyring (systemd)](#4-tjenestestyring-systemd)
5. [Konfigurasjonsfiler — Referanse](#5-konfigurasjonsfiler--referanse)
6. [AI-systemet](#6-ai-systemet)
7. [Vær- og lyssystem](#7-vær--og-lyssystem)
8. [Banerotasjon](#8-banerotasjon)
9. [Database (stracker)](#9-database-stracker)
10. [Straff og Race Control](#10-straff-og-race-control)
11. [KissMyRank og Live Timings](#11-kissmyrank-og-live-timings)
12. [Vedlikehold](#12-vedlikehold)
13. [Feilsøking](#13-feilsøking)
14. [Klient-oppsett](#14-klient-oppsett)
15. [Filkart](#15-filkart)

---

## 1. VPS og infrastruktur

| Egenskap | Verdi |
|----------|-------|
| Leverandør | Hetzner CX32 |
| CPU | 4 vCPU |
| RAM | 8 GB |
| Lagring | 80 GB NVMe SSD |
| OS | Ubuntu 24.04 LTS |
| IP | 46.225.176.106 |
| Tjenestekonto | `acserver` (opprettet med `useradd -r -s /sbin/nologin acserver`) |
| Kostnad | ~13 EUR (Hetzner) + ~5 EUR (CSP Patreon) = **~18 EUR/mnd** |

---

## 2. Serveroversikt

### Sammenligning

| | Trackday | Formula | Roadcar |
|--|----------|---------|---------|
| **Servernavn** | Nordschleife Touristenfahrten | Formula Series 2026 | Roadcar Series |
| **Bane** | Nordschleife TF (fast) | 7 baner, daglig rotasjon | 7 baner, daglig rotasjon |
| **Modus** | Practice (MODE=1) | Race (MODE=2) | Race (MODE=2) |
| **Biler** | 7 modeller | 1 modell (tatuusfa1) | 9 modeller |
| **Maks spillere** | 24 | 20 | 20 |
| **Sesjoner** | Ubegrenset praksis (9999 min) | Kvali 8 min → Race 15 min | Kvali 8 min → Race 15 min |
| **Race over time** | 0 | 300 sek | 300 sek |
| **TCP/UDP-port** | 9600 | 9610 | 9620 |
| **HTTP-port** | 9680 | 9690 | 9700 |
| **Send interval** | 18 Hz | 18 Hz | 18 Hz |
| **Pickup mode** | Ja | Ja | Ja |
| **Loop mode** | Ja | Ja | Ja |

*Kilde: `{instance}/cfg/server_cfg.ini`*

### Billiste per server

**Trackday** (24 plasser, fra `trackday/cfg/entry_list.ini`):

| Bil | Antall |
|-----|--------|
| abarth500 | 3 |
| bmw_m3_e30 | 3 |
| bmw_m3_e92 | 3 |
| ks_porsche_911_gt3_r_2016 | 4 |
| ks_mazda_mx5_nd | 4 |
| ks_toyota_gt86 | 3 |
| alfa_romeo_giulietta_qv | 4 |

**Formula** (20 plasser, fra `formula/cfg/entry_list.ini`):

| Bil | Antall |
|-----|--------|
| tatuusfa1 | 20 |

**Roadcar** (20 plasser, fra `roadcar/cfg/entry_list.ini`):

| Bil | Antall |
|-----|--------|
| ks_abarth_595ss | 3 |
| alfa_romeo_giulietta_qv | 3 |
| bmw_m3_e30 | 2 |
| ks_mazda_mx5_nd | 2 |
| ks_toyota_gt86 | 2 |
| lotus_elise_sc | 2 |
| ks_porsche_718_cayman_s | 2 |
| ks_bmw_m4 | 2 |
| ks_audi_tt_cup | 2 |

---

## 3. Nettverkstopologi

### Portkart

| Port | Protokoll | Tjeneste | Eksponert eksternt |
|------|-----------|----------|-------------------|
| 22 | TCP | SSH | Ja |
| 80 | TCP | Caddy (HTTP → HTTPS redirect) | Ja |
| 443 | TCP | Caddy (HTTPS) | Ja |
| 9600 | TCP + UDP | ac-trackday | Ja |
| 9680 | TCP | ac-trackday HTTP API | Ja |
| 9610 | TCP + UDP | ac-formula | Ja |
| 9690 | TCP | ac-formula HTTP API | Ja |
| 9620 | TCP + UDP | ac-roadcar | Ja |
| 9700 | TCP | ac-roadcar HTTP API | Ja |
| 50041 | TCP | stracker-trackday | Nei (kun localhost) |
| 50042 | TCP | stracker-formula | Nei (kun localhost) |
| 50043 | TCP | stracker-roadcar | Nei (kun localhost) |
| 8772 | TCP | AC Live Timings | Nei (kun localhost) |

*Kilde: `scripts/firewall_setup.sh`*

### UFW-regler

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp        # SSH
ufw allow 80/tcp        # Caddy HTTP
ufw allow 443/tcp       # Caddy HTTPS
ufw allow 9600/tcp      # Trackday
ufw allow 9600/udp
ufw allow 9680/tcp      # Trackday HTTP
ufw allow 9610/tcp      # Formula
ufw allow 9610/udp
ufw allow 9690/tcp      # Formula HTTP
ufw allow 9620/tcp      # Roadcar
ufw allow 9620/udp
ufw allow 9700/tcp      # Roadcar HTTP
```

Stracker-portene (50041–50043) og Live Timings (8772) er **ikke** åpnet i UFW — de er kun tilgjengelige via Caddy reverse proxy.

### Caddy reverse proxy

| Domene | Sti | Backend |
|--------|-----|---------|
| `stats.dittdomene.no` | `/trackday*` | `localhost:50041` (strip prefix) |
| `stats.dittdomene.no` | `/formula*` | `localhost:50042` (strip prefix) |
| `stats.dittdomene.no` | `/roadcar*` | `localhost:50043` (strip prefix) |
| `stats.dittdomene.no` | `/` (default) | `localhost:50041` |
| `live.dittdomene.no` | `/` | `localhost:8772` |

SSL-sertifikater håndteres automatisk av Caddy via Let's Encrypt.

*Kilde: `caddy/Caddyfile`*

---

## 4. Tjenestestyring (systemd)

### Tjenesteoversikt

| Tjeneste | Avhenger av | Bruker | Arbeidsmappe |
|----------|-------------|--------|-------------|
| `ac-trackday` | — | acserver | /opt/ac-trackday |
| `ac-formula` | — | acserver | /opt/ac-formula |
| `ac-roadcar` | — | acserver | /opt/ac-roadcar |
| `stracker-trackday` | ac-trackday | acserver | /opt/stracker/trackday |
| `stracker-formula` | ac-formula | acserver | /opt/stracker/formula |
| `stracker-roadcar` | ac-roadcar | acserver | /opt/stracker/roadcar |
| `ac-live-timings` | — | acserver | /opt/ac-live-timings |

### Ressursgrenser

| Tjeneste | MemoryMax | CPUQuota | RestartSec |
|----------|-----------|----------|-----------|
| ac-trackday | 2500M | 80% | 5 |
| ac-formula | 2000M | 70% | 5 |
| ac-roadcar | 2000M | 70% | 5 |

Trackday har høyere grenser fordi Nordschleife med AI-trafikk er mer ressurskrevende.

*Kilde: `scripts/systemd-services.conf`, `scripts/stracker-services.conf`*

### Vanlige kommandoer

```bash
# Status for alle AC-servere
systemctl status ac-trackday ac-formula ac-roadcar

# Restart en enkelt server
systemctl restart ac-formula

# Se live-logger
journalctl -u ac-trackday -f

# Restart stracker (stoppes automatisk hvis AC-serveren stopper pga Requires=)
systemctl restart stracker-formula

# Start/stopp alt
systemctl stop ac-trackday ac-formula ac-roadcar
systemctl start ac-trackday ac-formula ac-roadcar
```

---

## 5. Konfigurasjonsfiler — Referanse

### server_cfg.ini — Seksjoner

Hver server har `{instance}/cfg/server_cfg.ini` med følgende INI-seksjoner:

| Seksjon | Innhold |
|---------|---------|
| `[SERVER]` | Servernavn, porter, bane, biler, maks spillere, modus, pickup mode |
| `[PRACTICE]` | Praksissesjon (kun trackday bruker denne aktivt) |
| `[QUALIFY]` | Kvalifiseringssesjon — tid, åpen/lukket |
| `[RACE]` | Racesesjon — tid/runder, ventetid, åpen/lukket |
| `[DYNAMIC_TRACK]` | Baneoverflate — grip ved start, randomness, overføring mellom sesjoner |
| `[WEATHER_0]` … `[WEATHER_N]` | Værkonfigurasjoner — grafikkode, temperatur ±variasjon |

### Dynamisk baneoverflate — sammenligning

| Parameter | Trackday | Formula | Roadcar |
|-----------|----------|---------|---------|
| SESSION_START | 96 | 98 | 96 |
| RANDOMNESS | 2 | 1 | 2 |
| SESSION_TRANSFER | 80 | 90 | 85 |
| LAP_GAIN | 10 | 1 | 3 |

Formula har høyest startgrip (98) og mest overføring (90) for konsistente racetider.

*Kilde: `{instance}/cfg/server_cfg.ini` [DYNAMIC_TRACK]*

### extra_cfg.yml — Blokker

Hver server har `{instance}/extra/extra_cfg.yml` med følgende YAML-blokker:

| Blokk | Innhold |
|-------|---------|
| `AiParams` | AI-oppførsel, antall, ferdighet, aggresjon |
| `PlayerAiSlots` | Aktiveringsregler for AI (minstespillere) |
| `WeatherFxPlugin` | Sol-plugin — starttid, værmiks, regn, tåke |
| `RealPenaltyPlugin` | Banegrensestraff, kjøremodus |
| `RaceControlPlugin` | Safety car, VSC, rødt flagg (kun formula/roadcar) |
| Generelt | Checksum, stracker-port, HUD, gummispor |

### Verdier som varierer mellom servere

| Parameter | Trackday | Formula | Roadcar |
|-----------|----------|---------|---------|
| ChecksumEnabled | false | false | false |
| EnableStracker | true | true | true |
| StrackerPort | 50041 | 50042 | 50043 |
| DynamicTrackSurface | true | true | true |
| RubberFxEnabled | true | true | true |
| ExtraHudEnabled | true | true | true |

*Kilde: `{instance}/extra/extra_cfg.yml`*

---

## 6. AI-systemet

### Modus-sammenligning

| Parameter | Trackday | Formula | Roadcar |
|-----------|----------|---------|---------|
| Behavior | **TrafficMode** | **RacingMode** | **RacingMode** |
| MaxAiTargetCount | 20 | 16 | 14 |
| AiPerPlayerCount | 3 | — | — |
| AiSkillLevel | — | 90 | 85 |
| AiAggression | — | 55 | 42 |
| MinAiSafetyDistanceMeters | 20 | — | — |
| HideAiBeyondDistanceM | 380 | 500 | 400 |
| SplineWeightFilter | 0.5 | — | — |
| MinPlayerCount | 5 | 5 | 5 |

*Kilde: `{instance}/extra/extra_cfg.yml` → AiParams, PlayerAiSlots*

### Hvordan AI fungerer

- **TrafficMode** (trackday): AI-biler kjører som turister på Nordschleife. De følger trafikksplines, holder jevn hastighet, og viker for raskere spillere. Antall AI skalerer med spillere (3 AI per spiller, maks 20).
- **RacingMode** (formula/roadcar): AI-biler deltar i kvalifisering og race. De forsøker å kjøre raskest mulig innenfor ferdighets- og aggresjonsnivå.
- **Aktivering**: AI spawner kun når det er under 5 spillere på serveren (`MinPlayerCount: 5`).
- **CPU-sparing**: `HideAiBeyondDistanceM` skjuler AI-biler som er lengre unna enn angitt avstand for å redusere CPU-last.
- **AI-splines**: `.ai`-filer per bane, lagret under `/opt/ac-{instance}/content/tracks/{bane}/ai/`.

---

## 7. Vær- og lyssystem

### Sol-plugin (WeatherFxPlugin)

| Parameter | Trackday | Formula | Roadcar |
|-----------|----------|---------|---------|
| StartTime | 16:30 | 17:00 | 16:30 |
| StartWeatherType | 3 (Varied) | 1 (Mostly clear) | 1 (Mostly clear) |
| TimeMultiplier | **2x** | 1x | 1x |
| RainChance | **35%** | 15% | 20% |
| FogChance | 25% | — | — |
| SyncWeatherWithClients | true | true | true |

*Kilde: `{instance}/extra/extra_cfg.yml` → WeatherFxPlugin*

Trackday har raskere tid (2x) og høyere regnsjanse (35%) for variasjon under lange praksisøkter. Formula har lavest regnsjanse (15%) for rettferdige race.

### Værgrafikk-koder (server_cfg.ini)

| Kode | Beskrivelse | Brukes av |
|------|-------------|-----------|
| `1_clear` | Klar himmel | Formula, Roadcar |
| `2_clear` | Klar himmel (variant) | Formula |
| `3_clear` | Klar himmel (variant) | Trackday |
| `7_cloudy` | Overskyet | Trackday, Roadcar |
| `8_rain` | Regn | Trackday |

### Temperaturinnstillinger

| | Trackday | Formula | Roadcar |
|--|----------|---------|---------|
| **WEATHER_0** | Ambient 22°C ±3, Road 28°C ±3 | Ambient 24°C ±3, Road 32°C ±3 | Ambient 23°C ±3, Road 30°C ±3 |
| **WEATHER_1** | Ambient 17°C ±4, Road 20°C ±3 | Ambient 23°C ±2, Road 30°C ±2 | Ambient 19°C ±3, Road 23°C ±3 |
| **WEATHER_2** | Ambient 14°C ±3, Road 16°C ±2 | — | — |

*Kilde: `{instance}/cfg/server_cfg.ini` [WEATHER_*]*

---

## 8. Banerotasjon

### Cron-jobb

```bash
0 6 * * * /opt/scripts/rotate_tracks.sh >> /var/log/ac-rotate.log 2>&1
```

Kjøres daglig kl. 06:00. Bruker ukedag modulo antall baner for å velge dagens bane.

### Ukedagsplan

| Ukedag | Formula | Roadcar |
|--------|---------|---------|
| Mandag (1) | `monza\|` | `ks_barcelona\|` |
| Tirsdag (2) | `spa\|` | `ks_silverstone\|gp` |
| Onsdag (3) | `ks_silverstone\|gp` | `monza\|` |
| Torsdag (4) | `rt_suzuka\|suzukagp` | `ks_red_bull_ring\|gp` |
| Fredag (5) | `ks_barcelona\|` | `mugello\|` |
| Lørdag (6) | `ks_red_bull_ring\|gp` | `magione\|` |
| Søndag (7) | `imola\|` | `ks_vallelunga\|` |

**Trackday**: Ingen rotasjon — alltid `ks_nordschleife|touristenfahrten`.

Format: `banenavn|konfig` (tom konfig etter pipe = standard layout).

*Kilde: `scripts/rotate_tracks.sh`*

### Manuell rotasjon

```bash
# Kjør rotasjonsskriptet manuelt
bash /opt/scripts/rotate_tracks.sh

# Sjekk hvilken bane som er aktiv
grep "^TRACK=" /opt/ac-formula/cfg/server_cfg.ini
grep "^CONFIG_TRACK=" /opt/ac-formula/cfg/server_cfg.ini

# Sjekk rotasjonslogg
tail -20 /var/log/ac-rotate.log
```

---

## 9. Database (stracker)

### Database-filer

| Instans | Database | Logg |
|---------|----------|------|
| Trackday | `/opt/stracker/trackday/stracker.db3` | `/opt/stracker/trackday/stracker.log` |
| Formula | `/opt/stracker/formula/stracker.db3` | `/opt/stracker/formula/stracker.log` |
| Roadcar | `/opt/stracker/roadcar/stracker.db3` | `/opt/stracker/roadcar/stracker.log` |

Database-type: SQLite3. Inneholder rundetider, sesjonshistorikk, førere og hendelser.

### Runde-validering

| Parameter | Trackday | Formula | Roadcar |
|-----------|----------|---------|---------|
| max_lap_invalid_cut | **3** | 2 | 2 |
| min_num_laps_in_stats | 1 | 1 | 1 |
| ignore_pits | true | true | true |
| valid_only | — | true | true |

Trackday tillater 3 banekutt før runden ugyldiggjøres (turist-kjøring). Formula/Roadcar er strengere med 2 kutt.

*Kilde: `stracker/{instance}/stracker.ini`*

### Web-grensesnitt

| Instans | URL | Banner |
|---------|-----|--------|
| Trackday | `stats.dittdomene.no/trackday` | Nordschleife Touristenfahrten Stats |
| Formula | `stats.dittdomene.no/formula` | Formula Series 2026 Stats |
| Roadcar | `stats.dittdomene.no/roadcar` | Roadcar Series Stats |

Alle stracker-instanser binder til `127.0.0.1` og er kun tilgjengelige via Caddy.

### Svarteliste

Hver server har sin egen svarteliste:
- `/opt/ac-trackday/blacklist.txt`
- `/opt/ac-formula/blacklist.txt`
- `/opt/ac-roadcar/blacklist.txt`

### Backup

```bash
# Backup alle databaser
cp /opt/stracker/trackday/stracker.db3 /backup/trackday-$(date +%F).db3
cp /opt/stracker/formula/stracker.db3 /backup/formula-$(date +%F).db3
cp /opt/stracker/roadcar/stracker.db3 /backup/roadcar-$(date +%F).db3
```

---

## 10. Straff og Race Control

### RealPenaltyPlugin

| Parameter | Trackday | Formula | Roadcar |
|-----------|----------|---------|---------|
| Enabled | true | true | true |
| TrackLimitsEnabled | **false** | true | true |
| PenaltyMode | — | DriveThrough | DriveThrough |
| AllowedWheelsOffTrack | — | 2 | 2 |
| CutPenaltyThresholdMs | — | 200 | 250 |
| IncidentRating | true | true | true |

Trackday har banegrenser deaktivert — det er fri kjøring. Formula/Roadcar gir drive-through-straff ved 2+ hjul utenfor banen.

*Kilde: `{instance}/extra/extra_cfg.yml` → RealPenaltyPlugin*

### Race Control Plugin (kun formula/roadcar)

| Parameter | Formula | Roadcar |
|-----------|---------|---------|
| Enabled | true | true |
| SafetyCarEnabled | true | true |
| VirtualSafetyCarEnabled | true | true |
| VscMaxSpeed | 100 km/t | 80 km/t |
| RedFlagEnabled | true | true |
| AutoRestartAfterRedFlag | false | false |

Trackday har **ingen** Race Control.

*Kilde: `{instance}/extra/extra_cfg.yml` → RaceControlPlugin*

### Admin-kommandoer (Race Control)

```
/racecontrol sc        — Deploy safety car
/racecontrol vsc       — Deploy virtuell safety car
/racecontrol redflag   — Rødt flagg – alle til pit
/racecontrol restart   — Restart sesjon
/racecontrol clear     — Fjern SC/VSC
```

Meldinger til spillere:
- Safety car: "⚠️ SAFETY CAR – Reduce speed!"
- Rødt flagg: "🚩 RED FLAG – Return to pits!"

---

## 11. KissMyRank og Live Timings

### KissMyRank (in-game overlay)

| Parameter | Trackday | Formula | Roadcar |
|-----------|----------|---------|---------|
| display_mode | RELATIVE | RELATIVE | RELATIVE |
| positions_above | 3 | 3 | 3 |
| positions_below | 3 | 3 | 3 |
| session_type | PRACTICE | RACE | RACE |
| gap_format | LAP_TIME | SECONDS | SECONDS |
| font_size | 14 | 14 | 14 |
| opacity | 0.85 | 0.85 | 0.85 |
| show_gap | true | true | true |
| show_best_lap | true | true | true |

Kobles til respektive stracker-instans (port 50041/50042/50043) for data.

*Kilde: `plugins/kissMyRank.ini`*

### AC Live Timings

| Parameter | Verdi |
|-----------|-------|
| URL | `live.dittdomene.no` |
| Port | 8772 (localhost) |
| Refresh interval | 2000 ms |

**Funksjoner**: Banekart, gaps, beste runde, sektorer, vær. AI-biler er skjult (`showAiCars: false`).

**Servere i Live Timings:**

| Navn | Port | HTTP | Farge |
|------|------|------|-------|
| Trackday – Nordschleife | 9600 | 9680 | Grønn (#2ecc71) |
| Formula Series 2026 | 9610 | 9690 | Rød (#e74c3c) |
| Roadcar Series | 9620 | 9700 | Blå (#3498db) |

*Kilde: `plugins/ac-live-timings.conf`*

---

## 12. Vedlikehold

### Backup-strategi

| Prioritet | Data | Plassering | Metode |
|-----------|------|-----------|--------|
| **Kritisk** | stracker-databaser | `/opt/stracker/*/stracker.db3` | Periodisk kopi til /backup/ |
| Høy | Konfigurasjon | Repo (dette git-prosjektet) | Git push |
| Sekundær | Logger | journald, stracker-logger, Caddy | Roteres automatisk |

### Oppdateringer

| Komponent | Oppdatering | Kommando |
|-----------|-------------|---------|
| Ubuntu | apt update/upgrade | `apt update && apt upgrade -y` |
| AssettoServer | Manuell nedlasting | Last ned fra GitHub, stopp tjeneste, erstatt binær, start |
| stracker | Manuell nedlasting | Last ned, stopp tjeneste, erstatt, start |
| AC Live Timings | npm update | `cd /opt/ac-live-timings && npm update` |
| Caddy | apt | `apt update && apt upgrade caddy` |

### Logg-håndtering

| Logg | Plassering | Visning |
|------|-----------|---------|
| AC-server | journald | `journalctl -u ac-trackday -f` |
| stracker | `/opt/stracker/{instance}/stracker.log` | `tail -f /opt/stracker/trackday/stracker.log` |
| Caddy | `/var/log/caddy/*.log` | `tail -f /var/log/caddy/stats-access.log` |
| Banerotasjon | `/var/log/ac-rotate.log` | `tail -20 /var/log/ac-rotate.log` |

### Automatisert backup (`scripts/backup_stracker.sh`)

Kopierer alle 3 stracker-databaser til `/backup/stracker/` med datoprefix og sletter backups eldre enn 14 dager.

```bash
# Cron-jobb (kl. 04:00 daglig)
0 4 * * * /opt/scripts/backup_stracker.sh >> /var/log/ac-backup.log 2>&1

# Kjør manuelt
bash /opt/scripts/backup_stracker.sh

# Sjekk backup-logg
tail -20 /var/log/ac-backup.log

# Sjekk backup-størrelse
du -sh /backup/stracker/
```

Filnavnformat: `trackday-2026-03-10.db3`, `formula-2026-03-10.db3`, `roadcar-2026-03-10.db3`.

### Helsesjekk (`scripts/health_check.sh`)

Sjekker alle 7 systemd-tjenester, 6 AC-porter, diskbruk og minnebruk. Exit-kode 0 = alt OK, >0 = antall feil.

```bash
# Cron-jobb (hvert 15. minutt med e-postvarsling)
*/15 * * * * /opt/scripts/health_check.sh >> /var/log/ac-health.log 2>&1 || echo "AC HEALTH ALERT" | mail -s "AC Server Alert" admin@example.com

# Kjør manuelt
bash /opt/scripts/health_check.sh

# Sjekk helselogg
tail -20 /var/log/ac-health.log
```

Terskelverdier: disk >90% og RAM >90% gir advarsel. Sjekker også Caddy-status.

### Deploy (`scripts/deploy.sh`)

Deployer konfigfiler fra repoet til serveren via scp.

```bash
# Deploy alle instanser
bash scripts/deploy.sh --ip 46.225.176.106

# Deploy kun formula
bash scripts/deploy.sh --ip 46.225.176.106 --only formula

# Dry-run (vis hva som ville blitt gjort)
bash scripts/deploy.sh --ip 46.225.176.106 --dry-run

# Deploy inkludert Caddyfile
bash scripts/deploy.sh --ip 46.225.176.106 --caddy

# Bruk miljøvariabel for IP
export AC_SERVER_IP=46.225.176.106
bash scripts/deploy.sh
```

Skriptet kopierer `server_cfg.ini`, `entry_list.ini`, `extra_cfg.yml` og `stracker.ini` for valgte instanser, og spør om restart etter deploy.

### Overvåkingskommandoer

```bash
# Minnebruk
free -h

# CPU og prosesser
htop

# Åpne porter
ss -tulpn

# Diskbruk
df -h

# AC-server info (HTTP API)
curl http://localhost:9680/INFO
curl http://localhost:9690/INFO
curl http://localhost:9700/INFO

# Sjekk at alle tjenester kjører
systemctl is-active ac-trackday ac-formula ac-roadcar stracker-trackday stracker-formula stracker-roadcar ac-live-timings
```

---

## 13. Feilsøking

### 1. Server starter ikke

```bash
# Sjekk feilmeldinger
journalctl -u ac-formula -n 50 --no-pager

# Verifiser at baneinnhold finnes
ls /opt/ac-formula/content/tracks/$(grep "^TRACK=" /opt/ac-formula/cfg/server_cfg.ini | cut -d= -f2)/

# Verifiser at bilinnhold finnes
ls /opt/ac-formula/content/cars/tatuusfa1/
```

### 2. Spillere kan ikke koble til

```bash
# Sjekk at tjenesten kjører
systemctl status ac-trackday

# Sjekk at porten er åpen
ss -tulpn | grep 9600

# Sjekk UFW-regler
ufw status verbose

# Test fra ekstern maskin
nc -zv 46.225.176.106 9600
```

### 3. Stracker viser ingen data

```bash
# Sjekk at stracker kjører
systemctl status stracker-formula

# Verifiser port-synkronisering
grep "StrackerPort" /opt/ac-formula/extra_cfg.yml
grep "listening_port" /opt/stracker/formula/stracker.ini
# Begge skal vise 50042

# Sjekk stracker-logg
tail -30 /opt/stracker/formula/stracker.log

# Sjekk at databasen finnes og har data
ls -la /opt/stracker/formula/stracker.db3
sqlite3 /opt/stracker/formula/stracker.db3 "SELECT COUNT(*) FROM lap;"
```

### 4. Caddy returnerer 502 Bad Gateway

```bash
# Sjekk at backend-tjenesten kjører
systemctl status stracker-trackday  # for stats.dittdomene.no
systemctl status ac-live-timings    # for live.dittdomene.no

# Sjekk Caddy-logg
tail -20 /var/log/caddy/stats-access.log

# Test backend direkte
curl http://localhost:50041/
curl http://localhost:8772/

# Restart Caddy
systemctl restart caddy
```

### 5. Banerotasjon feiler

```bash
# Sjekk cron-jobben
crontab -l | grep rotate

# Sjekk rotasjonslogg
tail -20 /var/log/ac-rotate.log

# Kjør manuelt med debug-output
bash -x /opt/scripts/rotate_tracks.sh

# Verifiser at banekatalogene finnes
ls /opt/ac-formula/content/tracks/
```

### 6. Høy CPU/RAM-bruk

```bash
# Identifiser ressursbruk per tjeneste
systemctl status ac-trackday  # viser Memory/CPU

# Sjekk totalt
htop

# Reduser AI-antall midlertidig (i extra_cfg.yml)
# MaxAiTargetCount: 10  (ned fra 20/16/14)
# Restart tjenesten etterpå
systemctl restart ac-trackday
```

---

## 14. Klient-oppsett

### Påkrevd

| Program | Beskrivelse |
|---------|-------------|
| Assetto Corsa | Grunnspillet (Steam) |
| Custom Shaders Patch (CSP) | Nødvendig for AssettoServer, Sol, og moderne funksjoner |
| Sol | Dynamisk vær og dag/natt-syklus |

### Anbefalt

| Program | Beskrivelse |
|---------|-------------|
| Content Manager | Erstatning for AC-launcher med serverbrowser, mod-håndtering |
| Helicorsa | Radar/proximity-app for å se biler rundt deg |
| Pure | Forbedret grafikkfilter som støtter Sol |
| Crew Chief | Stemmebasert spotter og raceingeniør |

### Valgfritt

| Program | Beskrivelse |
|---------|-------------|
| Extended Physics | Forbedret fysikk for støttede biler |
| Trading Paints | Egendefinerte skinn/liveries |
| Fonsecker Sound | Forbedret motorlyd |
| Sidekick | In-game telemetri og data |

### Tilkobling

1. **Via Content Manager**: Søk etter servernavnet i serverbrowseren, eller bruk direkte IP `46.225.176.106` med riktig port.
2. **Via acmanager://-lenke**: Klikk en tilkoblingslenke som åpner Content Manager direkte.

---

## 15. Filkart

### Repo-struktur

```
D:\aCRacing\
├── trackday/
│   ├── cfg/
│   │   ├── server_cfg.ini        # AC-serverkonfig (porter, bane, biler, sesjoner)
│   │   └── entry_list.ini        # Billiste med 24 plasser
│   └── extra/
│       └── extra_cfg.yml         # AssettoServer-utvidelser (AI, vær, straff)
├── formula/
│   ├── cfg/
│   │   ├── server_cfg.ini
│   │   └── entry_list.ini        # 20 plasser, kun tatuusfa1
│   └── extra/
│       └── extra_cfg.yml
├── roadcar/
│   ├── cfg/
│   │   ├── server_cfg.ini
│   │   └── entry_list.ini        # 20 plasser, 9 bilmodeller
│   └── extra/
│       └── extra_cfg.yml
├── stracker/
│   ├── trackday/stracker.ini     # Port 50041, maks 3 kutt
│   ├── formula/stracker.ini      # Port 50042, maks 2 kutt
│   └── roadcar/stracker.ini      # Port 50043, maks 2 kutt
├── caddy/
│   └── Caddyfile                 # Reverse proxy (stats.*/live.*)
├── plugins/
│   ├── kissMyRank.ini            # In-game overlay-konfig
│   ├── race-control.conf         # Safety car, VSC, rødt flagg
│   └── ac-live-timings.conf      # Live banekart-app
├── scripts/
│   ├── backup_stracker.sh        # Daglig backup av stracker-DB (cron 04:00)
│   ├── deploy.sh                 # Deploy konfig til server via scp
│   ├── firewall_setup.sh         # UFW-regler
│   ├── health_check.sh           # Helsesjekk alle tjenester (cron */15)
│   ├── rotate_tracks.sh          # Daglig banerotasjon (cron 06:00)
│   ├── systemd-services.conf     # 3x ac-* tjenester med ressursgrenser
│   └── stracker-services.conf    # 3x stracker-* tjenester
├── servere.html                  # HTML-oversikt over serverne
├── CLAUDE.md                     # Instruksjoner for Claude Code
├── DOKUMENTASJON.md              # ← Dette dokumentet
├── INSTALLASJON.md               # 10-stegs installasjonsguide
├── SUPERPROMPT.md                # Automatiserte oppsettskript (fase 0–10)
└── TECHSTACK.md                  # Teknologivalg og arkitekturbeskrivelse
```

### Deploy-stier: Repo → Server

| Repo-fil | Server-sti |
|----------|-----------|
| `trackday/cfg/server_cfg.ini` | `/opt/ac-trackday/cfg/server_cfg.ini` |
| `trackday/extra/extra_cfg.yml` | `/opt/ac-trackday/extra_cfg.yml` |
| `formula/cfg/server_cfg.ini` | `/opt/ac-formula/cfg/server_cfg.ini` |
| `formula/extra/extra_cfg.yml` | `/opt/ac-formula/extra_cfg.yml` |
| `roadcar/cfg/server_cfg.ini` | `/opt/ac-roadcar/cfg/server_cfg.ini` |
| `roadcar/extra/extra_cfg.yml` | `/opt/ac-roadcar/extra_cfg.yml` |
| `stracker/*/stracker.ini` | `/opt/stracker/*/stracker.ini` |
| `caddy/Caddyfile` | `/etc/caddy/Caddyfile` |
| `scripts/backup_stracker.sh` | `/opt/scripts/backup_stracker.sh` |
| `scripts/deploy.sh` | Kjøres lokalt fra repo |
| `scripts/health_check.sh` | `/opt/scripts/health_check.sh` |
| `scripts/rotate_tracks.sh` | `/opt/scripts/rotate_tracks.sh` |
| `scripts/firewall_setup.sh` | `/opt/scripts/firewall_setup.sh` |
| `scripts/systemd-services.conf` | `/etc/systemd/system/ac-*.service` |
| `scripts/stracker-services.conf` | `/etc/systemd/system/stracker-*.service` |

### Filer som krever manuell redigering ved deploy

| Fil | Hva må endres |
|-----|--------------|
| `*/cfg/server_cfg.ini` | `ADMIN_PASSWORD=CHANGE_ME` → sett faktisk passord |
| `plugins/ac-live-timings.conf` | `adminPassword: "CHANGE_ME"` → sett faktisk passord |
| `caddy/Caddyfile` | `dittdomene.no` → sett faktisk domenenavn |

### Deploy-eksempel

```bash
# Deploy trackday-konfig
scp trackday/cfg/server_cfg.ini root@46.225.176.106:/opt/ac-trackday/cfg/
scp trackday/extra/extra_cfg.yml root@46.225.176.106:/opt/ac-trackday/

# Deploy formula-konfig
scp formula/cfg/server_cfg.ini root@46.225.176.106:/opt/ac-formula/cfg/
scp formula/extra/extra_cfg.yml root@46.225.176.106:/opt/ac-formula/

# Restart etter deploy
ssh root@46.225.176.106 "systemctl restart ac-trackday ac-formula ac-roadcar"
```

### Portsynkroniseringskart

Portene må alltid matche mellom disse filene:

```
extra_cfg.yml (StrackerPort)  ↔  stracker.ini (listening_port + HTTP port)
server_cfg.ini (UDP_PORT)     ↔  firewall_setup.sh (UFW-regler)
server_cfg.ini (HTTP_PORT)    ↔  ac-live-timings.conf (HttpPort)
stracker.ini (HTTP port)      ↔  Caddyfile (reverse_proxy backend)
```

---

*Generert fra konfigurasjonsfiler i dette repoet. Ved avvik mellom dette dokumentet og konfigurasjonsfilene er det konfigurasjonsfilene som gjelder.*
