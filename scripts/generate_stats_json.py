#!/usr/bin/env python3
"""Genererer JSON-statistikk fra stracker-databaser for web-dashboardet.
Kjøres via cron hvert 5. minutt. Output: /opt/www/data/{server}.json"""

import sqlite3
import json
import os
import time

OUTPUT_DIR = "/opt/www/data"
DBS = {
    "trackday": "/opt/stracker/trackday/stracker.db3",
    "mx5cup": "/opt/stracker/mx5cup/stracker.db3",
    "gt3": "/opt/stracker/gt3/stracker.db3",
}


def query_db(db_path, query, params=()):
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query, params).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []


def generate_stats(server_id, db_path):
    # Aggregate stats
    stats_row = query_db(db_path, """
        SELECT
            (SELECT COUNT(*) FROM Lap) AS totalLaps,
            (SELECT COUNT(*) FROM Lap WHERE Valid = 1) AS validLaps,
            (SELECT COUNT(DISTINCT PlayerId) FROM PlayerInSession) AS totalPlayers,
            (SELECT COUNT(*) FROM Session) AS totalSessions
    """)
    stats = stats_row[0] if stats_row else {
        "totalLaps": 0, "validLaps": 0, "totalPlayers": 0, "totalSessions": 0
    }

    # Leaderboard: best valid lap per player (overall)
    leaderboard = query_db(db_path, """
        SELECT
            p.Name AS name,
            p.SteamGuid AS steamGuid,
            c.UiCarName AS car,
            c.Car AS carId,
            t.Track AS track,
            MIN(l.LapTime) AS lapTime,
            l.Timestamp AS timestamp
        FROM Lap l
        JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
        JOIN Players p ON pis.PlayerId = p.PlayerId
        JOIN Cars c ON pis.CarId = c.CarId
        JOIN Session s ON pis.SessionId = s.SessionId
        JOIN Tracks t ON s.TrackId = t.TrackId
        WHERE l.Valid = 1 AND p.ArtInt = 0
        GROUP BY p.PlayerId
        ORDER BY lapTime
        LIMIT 20
    """)

    # Best lap per player per car (for multi-car servers)
    carLeaderboard = query_db(db_path, """
        SELECT
            p.Name AS name,
            p.SteamGuid AS steamGuid,
            c.UiCarName AS car,
            c.Car AS carId,
            t.Track AS track,
            MIN(l.LapTime) AS lapTime
        FROM Lap l
        JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
        JOIN Players p ON pis.PlayerId = p.PlayerId
        JOIN Cars c ON pis.CarId = c.CarId
        JOIN Session s ON pis.SessionId = s.SessionId
        JOIN Tracks t ON s.TrackId = t.TrackId
        WHERE l.Valid = 1 AND p.ArtInt = 0
        GROUP BY p.PlayerId, c.CarId
        ORDER BY lapTime
        LIMIT 30
    """)

    # Recent sessions with results
    sessions = query_db(db_path, """
        SELECT
            s.SessionId AS id,
            s.SessionType AS type,
            t.Track AS track,
            s.StartTimeDate AS startTime,
            COUNT(DISTINCT pis.PlayerId) AS playerCount
        FROM Session s
        JOIN Tracks t ON s.TrackId = t.TrackId
        JOIN PlayerInSession pis ON pis.SessionId = s.SessionId
        GROUP BY s.SessionId
        ORDER BY s.StartTimeDate DESC
        LIMIT 6
    """)

    # Get results for each session
    for sess in sessions:
        results = query_db(db_path, """
            SELECT
                p.Name AS name,
                p.SteamGuid AS steamGuid,
                c.UiCarName AS car,
                pis.FinishPosition AS pos,
                pis.RaceFinished AS finished,
                MIN(l.LapTime) AS bestLap,
                COUNT(l.LapId) AS laps
            FROM PlayerInSession pis
            JOIN Players p ON pis.PlayerId = p.PlayerId
            JOIN Cars c ON pis.CarId = c.CarId
            LEFT JOIN Lap l ON l.PlayerInSessionId = pis.PlayerInSessionId AND l.Valid = 1
            WHERE pis.SessionId = ?
            GROUP BY pis.PlayerInSessionId
            ORDER BY CASE WHEN pis.FinishPosition < 1000 THEN pis.FinishPosition ELSE 999 END,
                     MIN(l.LapTime)
        """, (sess["id"],))
        sess["results"] = results

    return {
        "server": server_id,
        "generated": int(time.time()),
        "stats": stats,
        "leaderboard": leaderboard,
        "carLeaderboard": carLeaderboard,
        "recentSessions": sessions,
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for server_id, db_path in DBS.items():
        if not os.path.exists(db_path):
            continue
        data = generate_stats(server_id, db_path)
        out_path = os.path.join(OUTPUT_DIR, f"{server_id}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"{server_id}: {data['stats']['totalLaps']} laps -> {out_path}")

    print("Ferdig!")


if __name__ == "__main__":
    main()
