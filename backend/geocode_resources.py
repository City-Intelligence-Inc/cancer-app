"""
Batch-geocode all resources in DynamoDB using Mapbox Geocoding API.
For each resource, geocodes the first city + country to get lat/lng.
Updates the resource in DynamoDB via the PATCH endpoint.

Usage: python geocode_resources.py
"""

import json
import os
import time
import urllib.request
import urllib.parse

API = "https://iutm2kyhqq.us-east-1.awsapprunner.com"
MAPBOX_TOKEN = os.environ.get("MAPBOX_TOKEN", "")

# Cache city+country -> (lat, lng) to avoid duplicate geocode calls
coord_cache: dict[str, tuple[float, float]] = {}


def geocode(query: str) -> tuple[float, float] | None:
    """Geocode a query string using Mapbox Geocoding API."""
    if query in coord_cache:
        return coord_cache[query]

    encoded = urllib.parse.quote(query)
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded}.json?access_token={MAPBOX_TOKEN}&limit=1"

    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
            features = data.get("features", [])
            if features:
                lng, lat = features[0]["center"]
                coord_cache[query] = (lat, lng)
                return (lat, lng)
    except Exception as e:
        print(f"  Geocode error for '{query}': {e}")

    return None


def patch_resource(resource_id: str, lat: float, lng: float, address: str) -> bool:
    """PATCH a resource with lat/lng/address."""
    url = f"{API}/resources/{resource_id}"
    payload = json.dumps({"lat": lat, "lng": lng, "address": address}).encode()
    req = urllib.request.Request(url, data=payload, method="PATCH")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            return result.get("status") == "ok"
    except Exception as e:
        print(f"  PATCH error for {resource_id}: {e}")
        return False


def main():
    # Fetch all resources
    print("Fetching all resources...")
    with urllib.request.urlopen(f"{API}/resources", timeout=30) as resp:
        data = json.loads(resp.read())
    resources = data.get("resources", [])
    print(f"Got {len(resources)} resources")

    # Filter to those without lat/lng
    todo = [r for r in resources if not r.get("lat")]
    print(f"{len(todo)} need geocoding")

    success = 0
    failed = 0
    skipped = 0

    for i, r in enumerate(todo):
        rid = r.get("resourceId", "?")
        name = r.get("name", "?")
        cities = r.get("cities", [])
        countries = r.get("countries", [])

        # Build geocode query: first city + first country
        if cities and countries:
            query = f"{cities[0]}, {countries[0]}"
            address = f"{cities[0]}, {countries[0]}"
        elif cities:
            query = cities[0]
            address = cities[0]
        elif countries:
            query = countries[0]
            address = countries[0]
        else:
            skipped += 1
            continue

        coords = geocode(query)
        if not coords:
            # Try just the city
            if cities:
                coords = geocode(cities[0])
            if not coords:
                print(f"  [{i+1}/{len(todo)}] FAIL: {name} ({query})")
                failed += 1
                continue

        lat, lng = coords
        ok = patch_resource(rid, lat, lng, address)
        if ok:
            success += 1
            if (i + 1) % 50 == 0:
                print(f"  [{i+1}/{len(todo)}] {name} -> {lat:.4f}, {lng:.4f}")
        else:
            failed += 1

        # Rate limit: Mapbox free tier is generous but let's be nice
        time.sleep(0.05)

    print(f"\nDone! Success: {success}, Failed: {failed}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
