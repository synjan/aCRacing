#!/usr/bin/env python3
"""Genererer stracker testdata SQL-filer for trackday, mx5cup og gt3."""

import random
import os

random.seed(42)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Felles data ───────────────────────────────────────────────
PLAYERS = [
    (1, '76561100000000001', 'Ansen'),
    (2, '76561100000000002', 'Bjørnar'),
    (3, '76561100000000003', 'Christoffer'),
    (4, '76561100000000004', 'Dagfinn'),
    (5, '76561100000000005', 'Erik'),
    (6, '76561100000000006', 'Frida'),
    (7, '76561100000000007', 'Gunhild'),
    (8, '76561100000000008', 'Henrik'),
]

# Timestamps (2026-03-xx 00:00 UTC)
MAR04 = 1772582400
MAR05 = MAR04 + 86400
MAR06 = MAR05 + 86400
MAR07 = MAR06 + 86400
MAR08 = MAR07 + 86400
MAR09 = MAR08 + 86400


def players_sql():
    rows = [f"({p[0]}, '{p[1]}', '{p[2]}', 0)" for p in PLAYERS]
    return ("INSERT INTO Players (PlayerId, SteamGuid, Name, ArtInt) VALUES\n"
            + ",\n".join(rows) + ";")


def gen_sectors(lap_time_ms, ratios):
    """Splitt rundetid i sektorer basert på ratioer, med litt tilfeldig variasjon."""
    total_r = sum(ratios)
    sectors = []
    remaining = lap_time_ms
    for i, r in enumerate(ratios):
        if i == len(ratios) - 1:
            sectors.append(remaining)
        else:
            base = int(lap_time_ms * r / total_r)
            var = max(1, int(base * 0.02))
            s = base + random.randint(-var, var)
            sectors.append(s)
            remaining -= s
    return sectors


def format_sectors(sectors):
    """Formater sektortider som SQL-verdier, padder med NULL til 10."""
    parts = [str(s) for s in sectors]
    parts += ["NULL"] * (10 - len(sectors))
    return ", ".join(parts)


def gen_laps(pis_id, session_start, base_time, num_laps, num_sectors, sector_ratios,
             tyre_ids, max_speed_base, variation=15000):
    """Generer runder for en spiller i en sesjon."""
    laps = []
    cum_time = random.randint(5000, 30000)

    for lap_count in range(1, num_laps + 1):
        lap_time = base_time + random.randint(-variation, int(variation * 1.3))
        sectors = gen_sectors(lap_time, sector_ratios)
        sector_str = format_sectors(sectors)

        valid = 1 if random.random() < 0.85 else 0
        cuts = 0 if valid else random.randint(1, 3)
        coll_car = random.randint(1, 2) if random.random() < 0.08 else 0
        coll_env = 1 if random.random() < 0.05 else 0

        tyre_id = random.choice(tyre_ids)
        temp_amb = random.randint(293, 298)
        temp_track = random.randint(303, 313)
        speed = max_speed_base + random.uniform(-5, 5)
        grip = round(random.uniform(0.96, 1.0), 3)
        fuel = round(random.uniform(0.5, 1.0), 2)

        cum_time += lap_time
        timestamp = session_start + cum_time // 1000

        laps.append({
            'pis_id': pis_id,
            'tyre_id': tyre_id,
            'lap_count': lap_count,
            'session_time': cum_time,
            'lap_time': lap_time,
            'sector_str': sector_str,
            'fuel': fuel,
            'valid': valid,
            'temp_amb': temp_amb,
            'temp_track': temp_track,
            'timestamp': timestamp,
            'speed': speed,
            'cuts': cuts,
            'coll_car': coll_car,
            'coll_env': coll_env,
            'grip': grip,
        })
    return laps


def lap_to_sql(lap_id, lap):
    return (f"({lap_id}, {lap['pis_id']}, {lap['tyre_id']}, {lap['lap_count']}, "
            f"{lap['session_time']}, {lap['lap_time']}, {lap['sector_str']}, "
            f"NULL, {lap['fuel']}, {lap['valid']}, 0, NULL, NULL, "
            f"{lap['temp_amb']}, {lap['temp_track']}, {lap['timestamp']}, "
            f"NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, "
            f"{lap['speed']:.1f}, 0, 0, 0, {lap['cuts']}, "
            f"{lap['coll_car']}, {lap['coll_env']}, {lap['grip']}, 0.0)")


LAP_COLUMNS = ("LapId, PlayerInSessionId, TyreCompoundId, LapCount, SessionTime, "
               "LapTime, SectorTime0, SectorTime1, SectorTime2, SectorTime3, SectorTime4, "
               "SectorTime5, SectorTime6, SectorTime7, SectorTime8, SectorTime9, "
               "HistoryInfo, FuelRatio, Valid, SectorsAreSoftSplits, MaxABS, MaxTC, "
               "TemperatureAmbient, TemperatureTrack, Timestamp, "
               "AidABS, AidTC, AidAutoBlib, AidAutoBrake, AidAutoClutch, AidAutoShift, "
               "AidIdealLine, AidStabilityControl, AidSlipStream, AidTyreBlankets, "
               "MaxSpeed_KMH, TimeInPitLane, TimeInPit, ESCPressed, Cuts, "
               "CollisionsCar, CollisionsEnv, GripLevel, Ballast")


# ── TRACKDAY ──────────────────────────────────────────────────
def generate_trackday():
    lines = []
    lines.append("-- stracker testdata: Trackday (Nordschleife Touristenfahrten)")
    lines.append("-- Generert 2026-03-11")
    lines.append("BEGIN TRANSACTION;")
    lines.append("")
    lines.append(players_sql())
    lines.append("")

    # Bane
    lines.append("INSERT INTO Tracks (TrackId, Track, UiTrackName, Length) VALUES")
    lines.append("(1, 'ks_nordschleife-touristenfahrten_ai', 'Nordschleife Touristenfahrten', 20832.0);")
    lines.append("")

    # Biler
    cars = [
        (1, 'abarth500', 'Abarth 500', 'Abarth'),
        (2, 'bmw_m3_e30', 'BMW M3 E30', 'BMW'),
        (3, 'bmw_m3_e92', 'BMW M3 E92', 'BMW'),
        (4, 'ks_porsche_911_gt3_r_2016', 'Porsche 911 GT3 R', 'Porsche'),
        (5, 'ks_mazda_mx5_nd', 'Mazda MX-5 ND', 'Mazda'),
        (6, 'ks_toyota_gt86', 'Toyota GT86', 'Toyota'),
        (7, 'alfa_romeo_giulietta_qv', 'Alfa Romeo Giulietta QV', 'Alfa Romeo'),
    ]
    car_rows = [f"({c[0]}, '{c[1]}', '{c[2]}', '{c[3]}')" for c in cars]
    lines.append("INSERT INTO Cars (CarId, Car, UiCarName, Brand) VALUES")
    lines.append(",\n".join(car_rows) + ";")
    lines.append("")

    # Dekk
    lines.append("INSERT INTO TyreCompounds (TyreCompoundId, TyreCompound) VALUES")
    lines.append("(1, 'Street'),\n(2, 'Semislicks');")
    lines.append("")

    # 3 Practice-sesjoner
    sessions = [
        (1, MAR05 + 64800, MAR05 + 70200, 90),   # 5. mars 18:00-19:30
        (2, MAR07 + 72000, MAR07 + 77400, 90),    # 7. mars 20:00-21:30
        (3, MAR09 + 50400, MAR09 + 57600, 120),   # 9. mars 14:00-16:00
    ]
    sess_rows = [f"({s[0]}, 1, 'Practice', 1, 0, {s[3]}, '46.225.176.106:9600', {s[1]}, {s[2]}, 0, 4, 1.0, 1.0, 1.0)"
                 for s in sessions]
    lines.append("INSERT INTO Session (SessionId, TrackId, SessionType, Multiplayer, NumberOfLaps, "
                 "Duration, ServerIpPort, StartTimeDate, EndTimeDate, PenaltiesEnabled, "
                 "AllowedTyresOut, TyreWearFactor, FuelRate, Damage) VALUES")
    lines.append(",\n".join(sess_rows) + ";")
    lines.append("")

    # Base-tider (ms) per spiller — Nordschleife TF
    base = {1: 480000, 2: 500000, 3: 520000, 4: 475000,
            5: 540000, 6: 510000, 7: 555000, 8: 460000}
    max_spd = {1: 180, 2: 210, 3: 240, 4: 260, 5: 195, 6: 200, 7: 220}
    sector_ratios = [0.37, 0.35, 0.28]

    # Spillere per sesjon: (player_id, car_id)
    session_players = {
        1: [(1, 1), (2, 2), (4, 3), (5, 5), (6, 6), (8, 4)],
        2: [(1, 4), (2, 3), (3, 2), (4, 1), (5, 7), (7, 5), (8, 4)],
        3: [(1, 6), (3, 4), (6, 2), (7, 7), (8, 3)],
    }

    # PlayerInSession
    pis_entries = []
    pis_id = 0
    for sid in [1, 2, 3]:
        for pid, cid in session_players[sid]:
            pis_id += 1
            pis_entries.append((pis_id, sid, pid, cid))

    pis_rows = [f"({e[0]}, {e[1]}, {e[2]}, '1.16.4', '0.0.54', NULL, NULL, {e[3]}, 1000, 0)"
                for e in pis_entries]
    lines.append("INSERT INTO PlayerInSession (PlayerInSessionId, SessionId, PlayerId, "
                 "ACVersion, PTVersion, TrackChecksum, CarChecksum, CarId, FinishPosition, RaceFinished) VALUES")
    lines.append(",\n".join(pis_rows) + ";")
    lines.append("")

    # Generer runder
    all_laps = []
    for pis_id_val, sid, pid, cid in pis_entries:
        session_start = sessions[sid - 1][1]
        num_laps = random.randint(5, 7)
        laps = gen_laps(pis_id_val, session_start, base[pid], num_laps, 3, sector_ratios,
                        [1, 2], max_spd[cid], variation=15000)
        all_laps.extend(laps)

    lap_rows = [lap_to_sql(i + 1, lap) for i, lap in enumerate(all_laps)]
    lines.append(f"INSERT INTO Lap ({LAP_COLUMNS}) VALUES")
    lines.append(",\n".join(lap_rows) + ";")
    lines.append("")
    lines.append("COMMIT;")
    return "\n".join(lines)


# ── MX-5 CUP ─────────────────────────────────────────────────
def generate_mx5cup():
    lines = []
    lines.append("-- stracker testdata: MX-5 Cup (Laguna Seca)")
    lines.append("-- Generert 2026-03-11")
    lines.append("BEGIN TRANSACTION;")
    lines.append("")
    lines.append(players_sql())
    lines.append("")

    lines.append("INSERT INTO Tracks (TrackId, Track, UiTrackName, Length) VALUES")
    lines.append("(1, 'ks_laguna_seca', 'Laguna Seca', 3602.0);")
    lines.append("")

    lines.append("INSERT INTO Cars (CarId, Car, UiCarName, Brand) VALUES")
    lines.append("(1, 'ks_mazda_mx5_cup', 'Mazda MX-5 Cup', 'Mazda');")
    lines.append("")

    lines.append("INSERT INTO TyreCompounds (TyreCompoundId, TyreCompound) VALUES")
    lines.append("(1, 'SM');")
    lines.append("")

    # 2 Qualify + 2 Race-sesjoner
    sessions = [
        (1, 'Qualify',  MAR06 + 68400, MAR06 + 69000, 10, 0),    # 6. mars 19:00-19:10
        (2, 'Race',     MAR06 + 69120, MAR06 + 69900, 0,  5),    # 6. mars 19:12-19:25
        (3, 'Qualify',  MAR08 + 68400, MAR08 + 69000, 10, 0),    # 8. mars 19:00-19:10
        (4, 'Race',     MAR08 + 69120, MAR08 + 69900, 0,  5),    # 8. mars 19:12-19:25
    ]
    sess_rows = []
    for s in sessions:
        num_laps = s[5]
        dur = s[4]
        sess_rows.append(
            f"({s[0]}, 1, '{s[1]}', 1, {num_laps}, {dur}, '46.225.176.106:9610', "
            f"{s[2]}, {s[3]}, 1, 2, 1.0, 1.0, 1.0)")
    lines.append("INSERT INTO Session (SessionId, TrackId, SessionType, Multiplayer, NumberOfLaps, "
                 "Duration, ServerIpPort, StartTimeDate, EndTimeDate, PenaltiesEnabled, "
                 "AllowedTyresOut, TyreWearFactor, FuelRate, Damage) VALUES")
    lines.append(",\n".join(sess_rows) + ";")
    lines.append("")

    # Base-tider (ms) — MX-5 på Laguna Seca (1:38-1:48)
    base = {1: 100000, 2: 101500, 3: 103000, 4: 99500,
            5: 104000, 6: 102000, 7: 105500, 8: 98500}
    sector_ratios = [0.18, 0.15, 0.17, 0.16, 0.17, 0.17]
    max_speed_base = 205

    # Sortert etter hastighet for race-posisjon
    speed_order = [8, 4, 1, 2, 6, 3, 5, 7]  # Henrik, Dagfinn, Ansen, ...

    # Spillere per sesjon (alle 8 i alle sesjoner)
    pis_entries = []
    pis_id = 0
    for s in sessions:
        sid = s[0]
        stype = s[1]
        for pid in range(1, 9):
            pis_id += 1
            if stype == 'Race':
                pos = speed_order.index(pid) + 1
                # Litt variasjon i race 2
                if sid == 4 and random.random() < 0.3:
                    pos = max(1, min(8, pos + random.choice([-1, 1])))
                finished = 1
            else:
                pos = 1000
                finished = 0
            pis_entries.append((pis_id, sid, pid, 1, pos, finished))

    pis_rows = [f"({e[0]}, {e[1]}, {e[2]}, '1.16.4', '0.0.54', NULL, NULL, {e[3]}, {e[4]}, {e[5]})"
                for e in pis_entries]
    lines.append("INSERT INTO PlayerInSession (PlayerInSessionId, SessionId, PlayerId, "
                 "ACVersion, PTVersion, TrackChecksum, CarChecksum, CarId, FinishPosition, RaceFinished) VALUES")
    lines.append(",\n".join(pis_rows) + ";")
    lines.append("")

    # Generer runder
    all_laps = []
    for entry in pis_entries:
        pis_id_val, sid, pid, cid, pos, finished = entry
        sess = sessions[sid - 1]
        session_start = sess[2]
        stype = sess[1]

        if stype == 'Qualify':
            num_laps = random.randint(3, 5)
        else:
            num_laps = 5

        laps = gen_laps(pis_id_val, session_start, base[pid], num_laps, 6, sector_ratios,
                        [1], max_speed_base, variation=2500)
        all_laps.extend(laps)

    lap_rows = [lap_to_sql(i + 1, lap) for i, lap in enumerate(all_laps)]
    lines.append(f"INSERT INTO Lap ({LAP_COLUMNS}) VALUES")
    lines.append(",\n".join(lap_rows) + ";")
    lines.append("")
    lines.append("COMMIT;")
    return "\n".join(lines)


# ── GT3 ───────────────────────────────────────────────────────
def generate_gt3():
    lines = []
    lines.append("-- stracker testdata: GT3 Series (Spa)")
    lines.append("-- Generert 2026-03-11")
    lines.append("BEGIN TRANSACTION;")
    lines.append("")
    lines.append(players_sql())
    lines.append("")

    lines.append("INSERT INTO Tracks (TrackId, Track, UiTrackName, Length) VALUES")
    lines.append("(1, 'spa-2022', 'Spa-Francorchamps', 7004.0);")
    lines.append("")

    gt3_cars = [
        (1,  'ks_audi_r8_lms',              'Audi R8 LMS',               'Audi'),
        (2,  'ks_audi_r8_lms_2016',         'Audi R8 LMS 2016',         'Audi'),
        (3,  'ks_ferrari_488_gt3',           'Ferrari 488 GT3',           'Ferrari'),
        (4,  'ks_lamborghini_huracan_gt3',   'Lamborghini Huracan GT3',   'Lamborghini'),
        (5,  'ks_mclaren_650_gt3',           'McLaren 650S GT3',          'McLaren'),
        (6,  'ks_mercedes_amg_gt3',          'Mercedes AMG GT3',          'Mercedes'),
        (7,  'ks_nissan_gtr_gt3',            'Nissan GT-R GT3',           'Nissan'),
        (8,  'ks_porsche_911_gt3_r_2016',    'Porsche 911 GT3 R',        'Porsche'),
        (9,  'bmw_z4_gt3',                   'BMW Z4 GT3',               'BMW'),
        (10, 'mercedes_sls_gt3',             'Mercedes SLS GT3',          'Mercedes'),
    ]
    car_rows = [f"({c[0]}, '{c[1]}', '{c[2]}', '{c[3]}')" for c in gt3_cars]
    lines.append("INSERT INTO Cars (CarId, Car, UiCarName, Brand) VALUES")
    lines.append(",\n".join(car_rows) + ";")
    lines.append("")

    lines.append("INSERT INTO TyreCompounds (TyreCompoundId, TyreCompound) VALUES")
    lines.append("(1, 'DHF');")
    lines.append("")

    # 2 Qualify + 2 Race
    sessions = [
        (1, 'Qualify',  MAR05 + 72000, MAR05 + 72600, 8, 0),    # 5. mars 20:00-20:10
        (2, 'Race',     MAR05 + 72720, MAR05 + 74100, 0, 8),    # 5. mars 20:12-20:35
        (3, 'Qualify',  MAR08 + 72000, MAR08 + 72600, 8, 0),    # 8. mars 20:00-20:10
        (4, 'Race',     MAR08 + 72720, MAR08 + 74100, 0, 8),    # 8. mars 20:12-20:35
    ]
    sess_rows = []
    for s in sessions:
        sess_rows.append(
            f"({s[0]}, 1, '{s[1]}', 1, {s[5]}, {s[4]}, '46.225.176.106:9620', "
            f"{s[2]}, {s[3]}, 1, 2, 1.0, 1.0, 1.0)")
    lines.append("INSERT INTO Session (SessionId, TrackId, SessionType, Multiplayer, NumberOfLaps, "
                 "Duration, ServerIpPort, StartTimeDate, EndTimeDate, PenaltiesEnabled, "
                 "AllowedTyresOut, TyreWearFactor, FuelRate, Damage) VALUES")
    lines.append(",\n".join(sess_rows) + ";")
    lines.append("")

    # Base-tider (ms) — GT3 på Spa (2:18-2:35)
    base = {1: 141000, 2: 143000, 3: 146000, 4: 140000,
            5: 148000, 6: 144000, 7: 150000, 8: 139000}
    sector_ratios = [0.35, 0.38, 0.27]

    # Bil per spiller
    player_car = {1: 3, 2: 6, 3: 9, 4: 2, 5: 5, 6: 4, 7: 10, 8: 8}
    max_spd_car = {1: 270, 2: 275, 3: 280, 4: 278, 5: 276,
                   6: 274, 7: 272, 8: 282, 9: 268, 10: 271}
    speed_order = [8, 4, 1, 2, 6, 3, 5, 7]

    pis_entries = []
    pis_id = 0
    for s in sessions:
        sid = s[0]
        stype = s[1]
        for pid in range(1, 9):
            pis_id += 1
            cid = player_car[pid]
            if stype == 'Race':
                pos = speed_order.index(pid) + 1
                if sid == 4 and random.random() < 0.3:
                    pos = max(1, min(8, pos + random.choice([-1, 1])))
                finished = 1
            else:
                pos = 1000
                finished = 0
            pis_entries.append((pis_id, sid, pid, cid, pos, finished))

    pis_rows = [f"({e[0]}, {e[1]}, {e[2]}, '1.16.4', '0.0.54', NULL, NULL, {e[3]}, {e[4]}, {e[5]})"
                for e in pis_entries]
    lines.append("INSERT INTO PlayerInSession (PlayerInSessionId, SessionId, PlayerId, "
                 "ACVersion, PTVersion, TrackChecksum, CarChecksum, CarId, FinishPosition, RaceFinished) VALUES")
    lines.append(",\n".join(pis_rows) + ";")
    lines.append("")

    all_laps = []
    for entry in pis_entries:
        pis_id_val, sid, pid, cid, pos, finished = entry
        sess = sessions[sid - 1]
        session_start = sess[2]
        stype = sess[1]

        if stype == 'Qualify':
            num_laps = random.randint(3, 5)
        else:
            num_laps = 8

        laps = gen_laps(pis_id_val, session_start, base[pid], num_laps, 3, sector_ratios,
                        [1], max_spd_car[cid], variation=3500)
        all_laps.extend(laps)

    lap_rows = [lap_to_sql(i + 1, lap) for i, lap in enumerate(all_laps)]
    lines.append(f"INSERT INTO Lap ({LAP_COLUMNS}) VALUES")
    lines.append(",\n".join(lap_rows) + ";")
    lines.append("")
    lines.append("COMMIT;")
    return "\n".join(lines)


# ── Skriv filer ───────────────────────────────────────────────
if __name__ == '__main__':
    for name, gen_fn in [('trackday', generate_trackday),
                         ('mx5cup', generate_mx5cup),
                         ('gt3', generate_gt3)]:
        path = os.path.join(SCRIPT_DIR, f'stracker_testdata_{name}.sql')
        content = gen_fn()
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content + '\n')
        # Tell antall linjer og runder
        lap_count = content.count('(') - 20  # grovt estimat
        print(f"Skrev {path} ({len(content)} bytes)")

    print("Ferdig!")
