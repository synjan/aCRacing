#!/usr/bin/env python3
"""
Kuraterer bilder fra ac_assets/ til web/public/images/
Velger de beste bildene basert på filstørrelse, relevans og diversitet.
"""

import json
import os
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AC_ASSETS = ROOT / "ac_assets"
OUTPUT = ROOT / "web" / "public" / "images"

# Aktive server-biler (P1)
ACTIVE_CARS = {
    # MX-5 Cup
    "mazda_mx5_cup", "ks_mazda_mx5_cup",
    # GT3
    "bmw_m4_gt3_2022", "ks_bmw_m4_gt3_2022",
    "ferrari_296_gt3_2023", "ks_ferrari_296_gt3_2023",
    "porsche_992_gt3_r_2023",
    "lamborghini_huracan_evo2_gt3", "mclaren_720s_gt3_evo",
    "bm_amg_evo_2020_gt3", "ford_mustang_gt3_2024", "corvette_z06_gt3_2024",
    "acf_aston_martin_vantage_gt3_evo", "ac_friends_honda_nsx_gt3_evo",
}

# Aktive baner (P1) - delvis match på slug
ACTIVE_TRACKS = [
    "nordschleife__touristenfahrten",
    "rt_lime_rock_park",
    "laguna_seca",
    "okayama_international",
    "summit_point",
    "lilski_road_america",
    "spa__2022",
    "mx_sebring",
    "lilski_watkins_glen",
    "road_atlanta2018",
    "zandvoort",
]

# Racing-klasser som gir høyere prioritet
RACING_TAGS = {"gt3", "gte", "gt2", "gt4", "lmp", "cup", "dtm", "wec", "imsa", "race"}

HERO_COUNT = 35
HERO_MAX_PER_BRAND = 4
GALLERY_MAX_PER_CAR = 5
MIN_SKIN_SIZE = 50_000  # 50KB minimum for skins


def load_json(path):
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def copy_file(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def is_active_track(slug):
    return any(t in slug for t in ACTIVE_TRACKS)


def get_car_brand(cars_index, car_slug):
    for car in cars_index:
        if car["slug"] == car_slug:
            return car.get("brand", "")
    return ""


def is_racing_car(cars_index, car_slug):
    for car in cars_index:
        if car["slug"] == car_slug:
            tags = " ".join(car.get("tags", [])).lower()
            cls = car.get("class", "").lower()
            return any(t in tags or t in cls for t in RACING_TAGS)
    return False


def curate_hero(cars_index):
    """Velg de beste skin-renders for hero/bakgrunn."""
    print("\n=== HERO-BILDER ===")
    candidates = []
    skins_dir = AC_ASSETS / "cars" / "skins"

    if not skins_dir.exists():
        return []

    for car_dir in skins_dir.iterdir():
        if not car_dir.is_dir():
            continue
        car_slug = car_dir.name
        brand = get_car_brand(cars_index, car_slug)
        is_active = car_slug in ACTIVE_CARS
        is_racing = is_racing_car(cars_index, car_slug)

        for skin_file in car_dir.iterdir():
            if not skin_file.is_file():
                continue
            if skin_file.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                continue
            size = skin_file.stat().st_size
            if size < MIN_SKIN_SIZE:
                continue

            # Scoring: filstørrelse som basis
            score = size
            if is_active:
                score *= 3.0  # P1 prioritet
            if is_racing:
                score *= 1.5  # Racingbiler ser bedre ut

            candidates.append({
                "path": skin_file,
                "car_slug": car_slug,
                "brand": brand,
                "skin_name": skin_file.stem,
                "size": size,
                "score": score,
                "is_active": is_active,
            })

    # Sorter etter score, velg med diversitetskrav
    candidates.sort(key=lambda x: x["score"], reverse=True)

    selected = []
    brand_count = defaultdict(int)

    # Fase 1: Garanter minst 1 hero per aktive-server merke
    active_brands_seen = set()
    for c in candidates:
        if not c["is_active"]:
            continue
        if c["brand"] in active_brands_seen:
            continue
        selected.append(c)
        brand_count[c["brand"]] += 1
        active_brands_seen.add(c["brand"])

    # Fase 2: Fyll opp resten etter score
    selected_set = {id(c) for c in selected}
    for c in candidates:
        if len(selected) >= HERO_COUNT:
            break
        if id(c) in selected_set:
            continue
        if brand_count[c["brand"]] >= HERO_MAX_PER_BRAND:
            continue
        selected.append(c)
        brand_count[c["brand"]] += 1

    # Kopier
    hero_dir = OUTPUT / "hero"
    hero_index = []
    for s in selected:
        # Filnavn: brand_model_skin.ext
        dst_name = f"{s['car_slug']}_{s['skin_name']}{s['path'].suffix}"
        dst = hero_dir / dst_name
        copy_file(s["path"], dst)
        hero_index.append({
            "path": f"images/hero/{dst_name}",
            "car": s["car_slug"],
            "brand": s["brand"],
            "skin": s["skin_name"],
            "active_server": s["is_active"],
            "size_kb": round(s["size"] / 1024),
        })

    print(f"  Valgt {len(selected)} hero-bilder fra {len(brand_count)} merker")
    for brand, count in sorted(brand_count.items(), key=lambda x: -x[1]):
        print(f"    {brand}: {count}")

    return hero_index


def curate_cars(cars_index):
    """Kopier badges, previews, og topp skins per bil."""
    print("\n=== BILER ===")

    badges_src = AC_ASSETS / "cars" / "badges"
    previews_src = AC_ASSETS / "cars" / "previews"
    skins_src = AC_ASSETS / "cars" / "skins"

    badge_count = 0
    preview_count = 0
    gallery_count = 0
    curated_cars = []

    for car in cars_index:
        slug = car["slug"]
        car_data = {**car, "curated_files": {}}

        # Badge
        badge_file = car.get("files", {}).get("badge")
        if badge_file:
            src = AC_ASSETS / badge_file
            if src.exists():
                dst = OUTPUT / "cars" / "badges" / src.name
                copy_file(src, dst)
                car_data["curated_files"]["badge"] = f"images/cars/badges/{src.name}"
                badge_count += 1

        # Preview
        preview_file = car.get("files", {}).get("preview")
        if preview_file:
            src = AC_ASSETS / preview_file
            if src.exists():
                dst = OUTPUT / "cars" / "previews" / src.name
                copy_file(src, dst)
                car_data["curated_files"]["preview"] = f"images/cars/previews/{src.name}"
                preview_count += 1

        # Gallery: topp skins etter filstørrelse
        skin_dir = skins_src / slug
        if skin_dir.exists():
            skin_files = []
            for f in skin_dir.iterdir():
                if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png"):
                    skin_files.append((f, f.stat().st_size))

            skin_files.sort(key=lambda x: x[1], reverse=True)
            top_skins = skin_files[:GALLERY_MAX_PER_CAR]

            gallery_paths = []
            for sf, _ in top_skins:
                dst = OUTPUT / "cars" / "gallery" / slug / sf.name
                copy_file(sf, dst)
                gallery_paths.append(f"images/cars/gallery/{slug}/{sf.name}")
                gallery_count += 1

            if gallery_paths:
                car_data["curated_files"]["gallery"] = gallery_paths

        car_data["active_server"] = slug in ACTIVE_CARS
        curated_cars.append(car_data)

    print(f"  Badges: {badge_count}")
    print(f"  Previews: {preview_count}")
    print(f"  Gallery skins: {gallery_count}")

    return curated_cars


def curate_tracks(tracks_index):
    """Kopier banefoto, maps og outlines."""
    print("\n=== BANER ===")

    photo_count = 0
    map_count = 0
    outline_count = 0
    curated_tracks = []

    for track in tracks_index:
        slug = track["slug"]
        track_data = {**track, "curated_files": {}}
        track_data["active_server"] = is_active_track(slug)

        # Photo (loading screen)
        preview_file = track.get("files", {}).get("preview")
        if preview_file:
            src = AC_ASSETS / preview_file
            if src.exists():
                dst = OUTPUT / "tracks" / "photos" / src.name
                copy_file(src, dst)
                track_data["curated_files"]["photo"] = f"images/tracks/photos/{src.name}"
                photo_count += 1

        # Map
        map_file = track.get("files", {}).get("map")
        if map_file:
            src = AC_ASSETS / map_file
            if src.exists():
                dst = OUTPUT / "tracks" / "maps" / src.name
                copy_file(src, dst)
                track_data["curated_files"]["map"] = f"images/tracks/maps/{src.name}"
                map_count += 1

        # Outline
        outline_file = track.get("files", {}).get("outline")
        if outline_file:
            src = AC_ASSETS / outline_file
            if src.exists():
                dst = OUTPUT / "tracks" / "outlines" / src.name
                copy_file(src, dst)
                track_data["curated_files"]["outline"] = f"images/tracks/outlines/{src.name}"
                outline_count += 1

        curated_tracks.append(track_data)

    print(f"  Banefoto: {photo_count}")
    print(f"  Maps: {map_count}")
    print(f"  Outlines: {outline_count}")

    return curated_tracks


def main():
    print("=" * 50)
    print("  AC ASSETS KURATØR")
    print("=" * 50)

    # Rydd output
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True, exist_ok=True)

    # Les indekser
    cars_index = load_json(AC_ASSETS / "_index" / "cars.json")
    tracks_index = load_json(AC_ASSETS / "_index" / "tracks.json")
    print(f"\nKilde: {len(cars_index)} biler, {len(tracks_index)} baner")

    # Kurater
    hero_index = curate_hero(cars_index)
    curated_cars = curate_cars(cars_index)
    curated_tracks = curate_tracks(tracks_index)

    # Skriv kuratert indeks
    idx_dir = OUTPUT / "_index"
    idx_dir.mkdir(parents=True, exist_ok=True)

    curated_index = {
        "hero": hero_index,
        "cars": curated_cars,
        "tracks": curated_tracks,
        "stats": {
            "hero_images": len(hero_index),
            "total_cars": len(curated_cars),
            "active_cars": sum(1 for c in curated_cars if c.get("active_server")),
            "total_tracks": len(curated_tracks),
            "active_tracks": sum(1 for t in curated_tracks if t.get("active_server")),
        }
    }

    (idx_dir / "curated.json").write_text(
        json.dumps(curated_index, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    # Oppsummering
    total_files = sum(1 for _ in OUTPUT.rglob("*") if _.is_file())
    total_size = sum(f.stat().st_size for f in OUTPUT.rglob("*") if f.is_file())

    print("\n" + "=" * 50)
    print("  FERDIG")
    print("=" * 50)
    print(f"  Totalt filer: {total_files}")
    print(f"  Totalt størrelse: {total_size / 1024 / 1024:.1f} MB")
    print(f"  Output: {OUTPUT}")


if __name__ == "__main__":
    main()
