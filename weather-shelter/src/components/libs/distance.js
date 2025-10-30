export function haversineDistance(lat1, lon1, lat2, lon2, unit = 'miles') {
    if (
        lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        Number.isNaN(Number(lat1)) || Number.isNaN(Number(lon1)) || Number.isNaN(Number(lat2)) || Number.isNaN(Number(lon2))
    ) {
        return null;
    }

    const toRad = (v) => (v * Math.PI) / 180;
    const R_km = 6371.0088;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R_km * c;
    if (unit === 'km' || unit === 'kilometers') return distKm;
    return distKm / 1.609344;
}
export function attachDistancesToShelters(shelters = [], userLat, userLon) {
    if (!userLat || !userLon) {
        return shelters.map((s) => ({ ...s, distanceKm: s.distanceMeters ? s.distanceMeters / 1000 : null, distanceMiles: s.distanceMeters ? s.distanceMeters / 1609.34 : (s.distance ? s.distance : null) }));
    }

    return shelters.map((s) => {
        if (s.distanceMeters != null) {
            const km = s.distanceMeters / 1000;
            return { ...s, distanceKm: km, distanceMiles: km / 1.609344 };
        }

        if (s.lat != null && s.lon != null) {
            const miles = haversineDistance(userLat, userLon, s.lat, s.lon, 'miles');
            const km = haversineDistance(userLat, userLon, s.lat, s.lon, 'km');
            return { ...s, distanceKm: km, distanceMiles: miles };
        }

        return { ...s, distanceKm: null, distanceMiles: null };
    }).sort((a, b) => {
        const da = a.distanceKm ?? Infinity;
        const db = b.distanceKm ?? Infinity;
        return da - db;
    });
}
