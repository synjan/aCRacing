# Assetto Corsa Server – Komplett Tech Stack

## 🖥️ Infrastruktur
| Komponent | Detaljer |
|-----------|----------|
| **Server** | Hetzner CX32 – 4 vCPU, 8GB RAM, 80GB SSD |
| **OS** | Ubuntu 24.04 LTS |
| **Prosesstyring** | systemd |
| **Brannmur** | UFW |
| **Reverse Proxy** | Caddy (automatisk HTTPS) |
| **Domene** | Subdomener per tjeneste |

## 🏎️ Server-software
| Komponent | Detaljer |
|-----------|----------|
| **AssettoServer** | Alle 3 instanser (erstatter vanilla acServer) |
| **Checksums** | Mod-validering innebygd i AssettoServer |
| **Blacklist** | Ban-system innebygd i AssettoServer |
| **Real Penalty Plugin** | Track limits, drive-through penalties |
| **Race Control Plugin** | Safety car, rødt flagg, restart |

## 🌦️ Grafikk / Vær
| Komponent | Detaljer |
|-----------|----------|
| **CSP (Patreon)** | Custom Shaders Patch – ~€5/mnd, RubberFX, dynamic surface |
| **Sol** | Dynamisk vær, tåke, regn, dag/natt-syklus |
| **Pure** | Fotorealistisk lysetting og himmelsystem |
| **Rain FX** | Regndråper på frontrute, vannsøl – del av CSP |
| **Grass FX** | Dynamisk gress, vind i trær – del av CSP |
| **Weather Sync** | Alle spillere ser nøyaktig samme vær |

## 🤖 AI
| Komponent | Detaljer |
|-----------|----------|
| **AssettoServer AiPlugin** | Innebygd, aktiveres under 5 spillere |
| **AI Splines** | .ai-filer per bane (community eller egengenerert) |
| **Modus** | Trackday: TrafficMode / Formula+Roadcar: RacingMode |

## 📊 Statistikk & Live
| Komponent | Detaljer |
|-----------|----------|
| **stracker** | Lap times, sesjonshistorikk, webinterface |
| **KissMyRank** | Live rangering in-game (krever stracker) |
| **AC Live Timings** | Live kartvisning i nettleser |

## 🎮 Client-side (anbefal til spillere)
| Komponent | Pris | Detaljer |
|-----------|------|----------|
| **Pure** | Gratis | Beste grafikk i AC |
| **Helicorsa** | Gratis | Radar – obligatorisk for MP |
| **Crew Chief** | Gratis | Stemme-ingeniør/spotter |
| **Extended Physics** | Gratis | Oppdatert fysikk for Kunos-biler |
| **Trading Paints** | Gratis | Custom liveries automatisk synket |
| **Fonsecker Sound** | Gratis | Beste lydmods per bil |
| **Track Ambience** | Gratis | Publikum, fugler, vindstøy |
| **Sidekick** | Gratis | Dekk-temp, drivstoff, skade |
| **SimHub** | Gratis/betalt | Dashboard, haptics, LED |
| **CM Patreon** | Betalt | One-click mod-installasjon |

## 🚗 Servere
| Server | Port | Biler | Baner | Slots |
|--------|------|-------|-------|-------|
| **Trackday** | 9600 | Kunos + mods | Nordschleife (fast) | 24 |
| **Formula** | 9610 | Formula Abarth (Kunos, gratis) | 7 Kunos-baner, roterer daglig | 20 |
| **Roadcar** | 9620 | Kun Kunos originalbiler | Roterende Kunos-baner | 20 |

## ⚙️ Automatisering
| Komponent | Detaljer |
|-----------|----------|
| **Cron** | Daglig banerotering kl. 06:00 |

## 🌐 Subdomener
| URL | Tjeneste |
|-----|----------|
| `stats.dittdomene.no` | stracker webui |
| `live.dittdomene.no` | AC Live Timings |

## 💰 Månedlige kostnader
| Tjeneste | Pris |
|----------|------|
| Hetzner CX32 | ~€13/mnd |
| CSP Patreon | ~€5/mnd |
| **Løpende total** | **~€18/mnd** |
