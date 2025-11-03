export async function getDirections(origin = {}, destination = {}, mode = 'walking') {
    const haversineMeters = (lat1, lon1, lat2, lon2) => {
        if ([lat1, lon1, lat2, lon2].some((v) => v == null || Number.isNaN(Number(v)))) return Infinity;
        const toRad = (v) => (v * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const formatMeters = (m) => {
        if (!isFinite(m) || m === Infinity) return 'an unknown distance';
        if (m < 1000) return `${Math.round(m)} meters`;
        return `${(m / 1000).toFixed(2)} km`;
    };

    const olat = origin.lat || origin.latitude || origin[0] || null;
    const olon = origin.lon || origin.longitude || origin[1] || null;
    const dlat = destination.lat || destination.latitude || destination[0] || null;
    const dlon = destination.lon || destination.longitude || destination[1] || null;

    const total = haversineMeters(olat, olon, dlat, dlon);
    const estSpeed = mode === 'walking' ? 1.4 : mode === 'bicycling' ? 5 : 15;
    const estTime = isFinite(total) ? Math.round(total / estSpeed) : 0;

    const steps = [];
    if (isFinite(total) && total > 0) {
        steps.push({ order: 1, instruction: `Head towards ${destination.address || 'the destination'}`, distanceMeters: Math.round(total * 0.7), start: { lat: olat, lon: olon }, end: { lat: (olat + dlat) / 2, lon: (olon + dlon) / 2 } });
        steps.push({ order: 2, instruction: `Continue to ${destination.address || 'your destination'} — approximately ${formatMeters(total * 0.3)}`, distanceMeters: Math.round(total * 0.3), start: { lat: (olat + dlat) / 2, lon: (olon + dlon) / 2 }, end: { lat: dlat, lon: dlon } });
    } else {
        steps.push({ order: 1, instruction: 'Unable to compute a route between the provided coordinates.', distanceMeters: 0, start: { lat: olat, lon: olon }, end: { lat: dlat, lon: dlon } });
    }

    return {
        steps,
        totalDistanceMeters: Math.round(total) || 0,
        estimatedTimeSeconds: estTime || 0,
    };
}