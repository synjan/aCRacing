# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Configuration repository for three Assetto Corsa dedicated servers running on a Hetzner CX32 (4 vCPU, 8GB RAM, Ubuntu 24.04). Uses AssettoServer (community replacement for vanilla acServer) with Sol weather, AI traffic, stracker statistics, and Caddy reverse proxy.

Language: Norwegian (all docs, comments, and in-game messages are in Norwegian).

## Architecture

### Three Server Instances

| Instance | Port (TCP/UDP) | HTTP Port | Mode | Track |
|----------|---------------|-----------|------|-------|
| **trackday** | 9600 | 9680 | Practice (MODE=1) – open driving | Nordschleife TF (fixed) |
| **formula** | 9610 | 9690 | Race (MODE=2) – P/Q/R sessions | 7 Kunos tracks, daily rotation |
| **roadcar** | 9620 | 9700 | Race (MODE=2) – P/Q/R sessions | 7 Kunos tracks, daily rotation |

Each instance has the same structure:
- `{instance}/cfg/server_cfg.ini` – AC server config (ports, cars, track, sessions, weather)
- `{instance}/extra/extra_cfg.yml` – AssettoServer extended config (AI, weather plugin, penalties, race control)

### Supporting Services

| Service | Port | Purpose |
|---------|------|---------|
| stracker (x3) | 50041/50042/50043 | Lap time DB + web stats UI |
| AC Live Timings | 8772 | Live track map in browser |
| Caddy | 80/443 | Reverse proxy with auto-SSL |

stracker instances are bound to 127.0.0.1 and exposed only via Caddy at `stats.{domain}/{trackday,formula,roadcar}`. Live Timings is at `live.{domain}`.

### Config Relationships

```
trackday/extra/extra_cfg.yml  -->  StrackerPort: 50041  -->  stracker/trackday/stracker.ini
formula/extra/extra_cfg.yml   -->  StrackerPort: 50042  -->  stracker/formula/stracker.ini
roadcar/extra/extra_cfg.yml   -->  StrackerPort: 50043  -->  stracker/roadcar/stracker.ini
```

Ports must stay synchronized between `extra_cfg.yml` (StrackerPort), `stracker.ini` (listening_port + HTTP port), and `plugins/ac-live-timings.conf` (httpPort per server).

### Key Behavioral Differences Between Servers

- **Trackday**: AI uses `TrafficMode` (tourist driving), no track limits, no race control, `ChecksumEnabled: false`
- **Formula/Roadcar**: AI uses `RacingMode`, track limits enforced via RealPenaltyPlugin, Race Control plugin enabled (safety car, red flag, VSC)

## Directory Layout

```
trackday/           # Nordschleife server configs
formula/            # Formula race server configs
roadcar/            # Roadcar race server configs
stracker/           # stracker configs (one per server)
caddy/Caddyfile     # Reverse proxy config (replace dittdomene.no with actual domain)
plugins/            # Plugin reference configs (KissMyRank, Race Control, AC Live Timings)
scripts/
  firewall_setup.sh   # UFW rules for all ports
  rotate_tracks.sh    # Daily cron track rotation for formula + roadcar
  systemd-services.conf      # systemd units for the 3 AC servers
  stracker-services.conf     # systemd units for 3 stracker instances
```

## Deployment

Configs are deployed to the server via `scp` to `/opt/ac-{trackday,formula,roadcar}/`. See `INSTALLASJON.md` for the full 10-step installation guide. The `SUPERPROMPT.md` contains automated setup scripts (phases 0-10).

Key deploy paths on server:
- `/opt/ac-{trackday,formula,roadcar}/` – AssettoServer binaries + configs
- `/opt/stracker/{trackday,formula,roadcar}/` – stracker instances + SQLite DBs
- `/opt/ac-live-timings/` – Node.js live timing app
- `/opt/scripts/` – operational scripts

## Common Operations

```bash
# Deploy config to server
scp trackday/cfg/server_cfg.ini root@SERVER_IP:/opt/ac-trackday/cfg/
scp trackday/extra/extra_cfg.yml root@SERVER_IP:/opt/ac-trackday/

# Restart a server instance
systemctl restart ac-trackday

# View live logs
journalctl -u ac-formula -f

# Manually trigger track rotation
bash /opt/scripts/rotate_tracks.sh

# Check all services
systemctl status ac-trackday ac-formula ac-roadcar
```

## Important Conventions

- All `server_cfg.ini` files contain `ADMIN_PASSWORD=CHANGE_ME` – this placeholder must be replaced during deployment, never committed with real passwords
- The `plugins/` directory contains reference configs, not files deployed directly – the actual plugin settings live inside each server's `extra_cfg.yml`
- Track rotation (`rotate_tracks.sh`) runs via cron at 06:00 daily and uses day-of-week modulo to select from the track arrays
- Track entries use `"track_name|config"` pipe-separated format (empty config after pipe = default layout)
- The `{trackday,formula,roadcar}/` directory at root level is an empty artifact (literal brace name, not bash expansion) and can be ignored
