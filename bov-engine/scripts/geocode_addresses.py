#!/usr/bin/env python3
"""
Geocode all addresses in a BOV JSON data file using geopy/ArcGIS.

Usage:
    python geocode_addresses.py <data.json> [--update]

Without --update: prints coordinates to console for review.
With --update: writes geocoded coordinates back into the JSON file.
"""

import json
import sys
import time
import argparse
from pathlib import Path

try:
    from geopy.geocoders import ArcGIS
except ImportError:
    print("ERROR: geopy is not installed. Run: pip install geopy")
    sys.exit(1)


def extract_addresses(data: dict) -> list:
    """Extract all addresses from a BOV data file that need geocoding."""
    addresses = []

    # Subject property
    cover = data.get('cover', {})
    subject_addr = f"{cover.get('address_street', '')}, {cover.get('address_city', '')}, {cover.get('address_state', '')} {cover.get('address_zip', '')}"
    addresses.append(('subject', subject_addr, ['coordinates', 'subject']))

    # Sale comps
    for i, comp in enumerate(data.get('sale_comps', {}).get('comps', [])):
        city_state = f"{cover.get('address_city', '')}, {cover.get('address_state', '')} {cover.get('address_zip', '')}"
        addr = f"{comp.get('address', '')}, {city_state}"
        addresses.append((f"sale_comp_{i}", addr, ['sale_comps', 'comps', i, 'coords']))

    # Active comps
    for i, comp in enumerate(data.get('active_comps', {}).get('comps', [])):
        city_state = f"{cover.get('address_city', '')}, {cover.get('address_state', '')} {cover.get('address_zip', '')}"
        addr = f"{comp.get('address', '')}, {city_state}"
        addresses.append((f"active_comp_{i}", addr, ['active_comps', 'comps', i, 'coords']))

    # Rent comps
    for gi, group in enumerate(data.get('rent_comps', {}).get('groups', [])):
        for ci, comp in enumerate(group.get('comps', [])):
            city_state = f"{cover.get('address_city', '')}, {cover.get('address_state', '')} {cover.get('address_zip', '')}"
            addr = f"{comp.get('address', '')}, {city_state}"
            addresses.append((f"rent_comp_{gi}_{ci}", addr, ['rent_comps', 'groups', gi, 'comps', ci, 'coords']))

    return addresses


def geocode_all(addresses: list) -> dict:
    """Geocode all addresses and return results."""
    geolocator = ArcGIS()
    results = {}

    print(f"\nGeocoding {len(addresses)} addresses...\n")

    success = 0
    failed = 0

    for label, addr, json_path in addresses:
        try:
            loc = geolocator.geocode(addr)
            if loc:
                coords = [round(loc.latitude, 6), round(loc.longitude, 6)]
                results[label] = {'address': addr, 'coords': coords, 'json_path': json_path}
                print(f"  OK  {label:20s} [{coords[0]}, {coords[1]}]  // {addr}")
                success += 1
            else:
                results[label] = {'address': addr, 'coords': None, 'json_path': json_path}
                print(f"  FAIL {label:20s} NOT FOUND  // {addr}")
                failed += 1
            time.sleep(0.5)
        except Exception as e:
            results[label] = {'address': addr, 'coords': None, 'json_path': json_path, 'error': str(e)}
            print(f"  ERR  {label:20s} {e}  // {addr}")
            failed += 1

    print(f"\n  Total: {len(addresses)} | Success: {success} | Failed: {failed}")
    return results


def update_json(data: dict, results: dict) -> dict:
    """Update the JSON data with geocoded coordinates."""
    for label, result in results.items():
        if result['coords'] is None:
            continue

        path = result['json_path']
        obj = data
        for key in path[:-1]:
            obj = obj[key]
        obj[path[-1]] = result['coords']

    return data


def main():
    parser = argparse.ArgumentParser(description='Geocode addresses in a BOV JSON data file')
    parser.add_argument('data', help='Path to the JSON data file')
    parser.add_argument('--update', action='store_true', help='Write coordinates back to JSON file')

    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        print(f"ERROR: File not found: {data_path}")
        sys.exit(1)

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    addresses = extract_addresses(data)
    results = geocode_all(addresses)

    if args.update:
        data = update_json(data, results)
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nUpdated: {data_path}")
    else:
        print(f"\nDry run complete. Use --update to write coordinates to {data_path}")


if __name__ == '__main__':
    main()
