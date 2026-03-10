# 📋 Installasjonsguide – AC Server Stack på Hetzner CX32

## Forutsetninger
- Hetzner CX32 med Ubuntu 24.04
- SSH-tilgang som root
- Domenenavn pekende til serverens IP

---

## Steg 1 – Grunnleggende oppsett

```bash
# Oppdater systemet
apt update && apt upgrade -y

# Installer nødvendige pakker
apt install -y wget curl unzip python3 python3-pip caddy ufw tmux

# Opprett dedikert bruker
useradd -r -m -s /sbin/nologin acserver

# Opprett mappestruktur
mkdir -p /opt/ac-{trackday,formula,roadcar}/{cfg,extra,content}
mkdir -p /opt/scripts
```

---

## Steg 2 – AssettoServer installasjon

```bash
# Last ned siste versjon (sjekk https://github.com/compujuckel/AssettoServer/releases)
cd /tmp
wget https://github.com/compujuckel/AssettoServer/releases/latest/download/AssettoServer-linux-x64.tar.gz
tar -xzf AssettoServer-linux-x64.tar.gz

# Kopier til alle tre server-mapper
cp -r AssettoServer-linux-x64/* /opt/ac-trackday/
cp -r AssettoServer-linux-x64/* /opt/ac-formula/
cp -r AssettoServer-linux-x64/* /opt/ac-roadcar/

# Sett rettigheter
chown -R acserver:acserver /opt/ac-{trackday,formula,roadcar}
chmod +x /opt/ac-{trackday,formula,roadcar}/AssettoServer
```

---

## Steg 3 – Last opp konfig-filer

```bash
# Kopier cfg-filer fra dette repoet til serveren
# Fra din lokale maskin:
scp trackday/cfg/server_cfg.ini root@SERVER_IP:/opt/ac-trackday/cfg/
scp trackday/extra/extra_cfg.yml root@SERVER_IP:/opt/ac-trackday/
scp formula/cfg/server_cfg.ini root@SERVER_IP:/opt/ac-formula/cfg/
scp formula/extra/extra_cfg.yml root@SERVER_IP:/opt/ac-formula/
scp roadcar/cfg/server_cfg.ini root@SERVER_IP:/opt/ac-roadcar/cfg/
scp roadcar/extra/extra_cfg.yml root@SERVER_IP:/opt/ac-roadcar/
```

**Viktig:** Bytt ut `CHANGE_ME` i alle `server_cfg.ini`-filer med et sikkert admin-passord!

---

## Steg 4 – Last opp biler og baner

```bash
# Eksempel: Lim inn Kunos content-mappen fra din AC-installasjon
# Standard sti på Windows: C:\Program Files (x86)\Steam\steamapps\common\assettocorsa\content

# Kopier relevant content til serverne
scp -r content/cars/rss_formula_hybrid_x17 root@SERVER_IP:/opt/ac-formula/content/cars/
scp -r content/tracks/ks_nordschleife root@SERVER_IP:/opt/ac-trackday/content/tracks/

# NB: Kunos-biler/baner må kopieres fra din egen AC-installasjon (du eier lisensen)
```

---

## Steg 5 – Brannmur

```bash
# Kjør brannmur-scriptet
cp scripts/firewall_setup.sh /opt/scripts/
chmod +x /opt/scripts/firewall_setup.sh
bash /opt/scripts/firewall_setup.sh
```

---

## Steg 6 – systemd services

```bash
# Opprett separate service-filer (se systemd-services.conf for innhold)
nano /etc/systemd/system/ac-trackday.service
nano /etc/systemd/system/ac-formula.service
nano /etc/systemd/system/ac-roadcar.service

# Aktiver og start
systemctl daemon-reload
systemctl enable --now ac-trackday ac-formula ac-roadcar

# Sjekk at alt kjører
systemctl status ac-trackday ac-formula ac-roadcar
```

---

## Steg 7 – Caddy reverse proxy

```bash
# Bytt ut dittdomene.no i Caddyfile med ditt faktiske domene
cp caddy/Caddyfile /etc/caddy/Caddyfile
nano /etc/caddy/Caddyfile

systemctl restart caddy
systemctl enable caddy
```

---

## Steg 8 – stracker installasjon

```bash
pip3 install stracker --break-system-packages

# Eller last ned binary fra:
# https://github.com/NEYS/stracker/releases

# Opprett config for hver instans
mkdir -p /opt/stracker/{trackday,formula,roadcar}
# Se stracker-dokumentasjon for full konfig
```

---

## Steg 9 – Banerotering (cron)

```bash
cp scripts/rotate_tracks.sh /opt/scripts/
chmod +x /opt/scripts/rotate_tracks.sh

# Legg til cron-jobb
crontab -e
# Legg til denne linjen:
# 0 6 * * * /opt/scripts/rotate_tracks.sh >> /var/log/ac-rotate.log 2>&1
```

---

## Steg 10 – AI Splines

```bash
# For Nordschleife: søk på overtake.gg etter ferdiglagde splines
# Plasser i:
/opt/ac-trackday/content/tracks/ks_nordschleife/ai/fast_lane.ai

# For Formula-baner: AssettoServer kan generere automatisk
# Start server med --record-ai-spline flagget og kjør 2-3 runder jevnt
```

---

## Nyttige kommandoer

```bash
# Se live logg for en server
journalctl -u ac-trackday -f

# Restart en server
systemctl restart ac-formula

# Se RAM-bruk
htop

# Sjekk porter er åpne
ss -tulpn | grep -E '9600|9610|9620'
```

---

## Anbefalt client mod-pakke (del med spillere)

Send denne listen til spillere som vil ha best opplevelse:

1. **Custom Shaders Patch** – overtake.gg
2. **Sol** – overtake.gg
3. **Pure** – overtake.gg
4. **Helicorsa** – overtake.gg (radar, nesten obligatorisk!)
5. **Crew Chief** – crewchief.thecrewchief.org (stemme-ingeniør)
6. **Extended Physics** – overtake.gg (bedre Kunos-bil fysikk)
7. **Fonsecker Sound** – overtake.gg (søk på din bil)
8. **Sidekick** – overtake.gg
9. **Trading Paints** – tradingpaints.com
