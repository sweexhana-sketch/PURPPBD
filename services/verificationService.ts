
export interface Coordinate {
    lat: number;
    lng: number;
}

export interface VerificationResult {
    jurisdiction: 'Provinsi' | 'Nasional' | 'Lainnya';
    roadName?: string;
    distance: number; // in meters
}

/**
 * Calculates the distance between two points in meters using the Haversine formula.
 */
function getDistance(p1: Coordinate, p2: Coordinate): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculates the minimum distance from a point to a line segment.
 */
function distToSegment(p: Coordinate, v: Coordinate, w: Coordinate): number {
    const l2 = Math.pow(getDistance(v, w), 2);
    if (l2 === 0) return getDistance(p, v);

    // This is a simplified version of point-to-segment distance.
    // For better accuracy on a sphere, we'd use cross-track distance, 
    // but for small distances (road buffers), planar approximation is usually fine.
    // However, since we already have getDistance, we can use a basic heuristic.

    const d1 = getDistance(p, v);
    const d2 = getDistance(p, w);
    const d3 = getDistance(v, w);

    // Heron's formula for area
    const s = (d1 + d2 + d3) / 2;
    const area = Math.sqrt(s * (s - d1) * (s - d2) * (s - d3));

    // Height of triangle (distance to line)
    const h = (2 * area) / d3;

    // Check if the projection falls onto the segment
    const isObtuseV = Math.pow(d2, 2) > Math.pow(d1, 2) + Math.pow(d3, 2);
    const isObtuseW = Math.pow(d1, 2) > Math.pow(d2, 2) + Math.pow(d3, 2);

    if (isObtuseV) return d1;
    if (isObtuseW) return d2;
    return h;
}

async function findNearestRoad(point: Coordinate, geojsonUrl: string): Promise<{ roadName?: string, distance: number }> {
    try {
        const response = await fetch(geojsonUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${geojsonUrl}`);
        const data = await response.json();

        let minDistance = Infinity;
        let nearestRoad = '';

        for (const feature of data.features) {
            if (feature.geometry.type === 'LineString') {
                const coords = feature.geometry.coordinates;
                for (let i = 0; i < coords.length - 1; i++) {
                    const v = { lng: coords[i][0], lat: coords[i][1] };
                    const w = { lng: coords[i + 1][0], lat: coords[i + 1][1] };
                    const d = distToSegment(point, v, w);
                    if (d < minDistance) {
                        minDistance = d;
                        nearestRoad = feature.properties?.Nm_Ruas || feature.properties?.Nama_Jalan || 'Tanpa Nama';
                    }
                }
            } else if (feature.geometry.type === 'MultiLineString') {
                for (const line of feature.geometry.coordinates) {
                    for (let i = 0; i < line.length - 1; i++) {
                        const v = { lng: line[i][0], lat: line[i][1] };
                        const w = { lng: line[i + 1][0], lat: line[i + 1][1] };
                        const d = distToSegment(point, v, w);
                        if (d < minDistance) {
                            minDistance = d;
                            nearestRoad = feature.properties?.Nm_Ruas || feature.properties?.Nama_Jalan || 'Tanpa Nama';
                        }
                    }
                }
            }
        }

        return { roadName: nearestRoad, distance: minDistance };
    } catch (error) {
        console.error(`Error processing ${geojsonUrl}:`, error);
        return { distance: Infinity };
    }
}

export async function checkJurisdiction(lat: number, lng: number): Promise<VerificationResult> {
    const point = { lat, lng };

    // Check Provincial Roads
    const prov = await findNearestRoad(point, '/data/jlnprov.json');

    // Check National Roads - file benar adalah jalan_nasional_v2.json
    const nas = await findNearestRoad(point, '/data/jalan_nasional_v2.json');

    const threshold = 500; // 500 meters buffer (lebih toleran untuk wilayah Papua)

    if (prov.distance < threshold && prov.distance <= nas.distance) {
        return { jurisdiction: 'Provinsi', roadName: prov.roadName, distance: prov.distance };
    } else if (nas.distance < threshold) {
        return { jurisdiction: 'Nasional', roadName: nas.roadName, distance: nas.distance };
    } else {
        // Ambil nama jalan terdekat meski di luar threshold
        const nearest = prov.distance <= nas.distance ? prov : nas;
        return { jurisdiction: 'Lainnya', roadName: nearest.roadName, distance: nearest.distance };
    }
}

/**
 * Ray-casting algorithm to check if a point is inside a polygon
 */
function pointInPolygon(point: Coordinate, polygon: number[][]): boolean {
    let x = point.lng, y = point.lat;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Checks the 'Kawasan Hutan' geojson to find the land status (Areal Penggunaan Lain, Hutan Lindung, dll).
 */
export async function checkStatusKawasan(lat: number, lng: number): Promise<string> {
    try {
        // Coba dengan nama file yang benar (spasi di-encode)
        const response = await fetch('/data/kwsnhtn 1.json');
        if (!response.ok) {
            // Fallback dengan URL encoding
            const response2 = await fetch('/data/kwsnhtn%201.json');
            if (!response2.ok) return 'Areal Penggunaan Lain (APL)';
            const data2 = await response2.json();
            return checkKawasanInData(data2, lat, lng);
        }
        const data = await response.json();
        return checkKawasanInData(data, lat, lng);
    } catch (e) {
        console.error("Error checking status kawasan", e);
    }
    return 'Tidak diketahui';
}

function checkKawasanInData(data: any, lat: number, lng: number): string {
    const pt = { lat, lng };
    for (const feature of data.features) {
        if (feature.geometry.type === 'Polygon') {
            for (const ring of feature.geometry.coordinates) {
                if (pointInPolygon(pt, ring)) {
                    return feature.properties.NAMOBJ || 'Tidak diketahui';
                }
            }
        } else if (feature.geometry.type === 'MultiPolygon') {
            for (const polygon of feature.geometry.coordinates) {
                for (const ring of polygon) {
                    if (pointInPolygon(pt, ring)) {
                        return feature.properties.NAMOBJ || 'Tidak diketahui';
                    }
                }
            }
        }
    }
    return 'Areal Penggunaan Lain (APL)'; // Default jika tidak ada polygon yang cocok
}
