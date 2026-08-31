
// api/whatsapp-verify.ts
// Serverless function untuk menangani Webhook dari Fonnte
import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';

// Load provincial roads data
function loadProvincialRoads() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'data', 'jlnprov.json');
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading road data:', error);
        return { type: 'FeatureCollection', features: [] };
    }
}

// Check if point is on provincial road
function isPointOnProvincialRoad(lat: number, lng: number, thresholdInKm: number = 0.1): { result: boolean, roadName?: string } {
    const provincialRoads = loadProvincialRoads();
    const pt = turf.point([lng, lat]);
    let minDistance = Infinity;
    let nearestRoadName = 'Unknown Road';

    for (const feature of provincialRoads.features) {
        if (feature.geometry.type === 'LineString') {
            const distance = turf.pointToLineDistance(pt, feature);
            if (distance < minDistance) {
                minDistance = distance;
                nearestRoadName = feature.properties?.Nm_Ruas || 'Ruas Jalan Tanpa Nama';
            }
        } else if (feature.geometry.type === 'MultiLineString') {
            for (const coords of feature.geometry.coordinates) {
                // Konversi setiap bagian MultiLineString menjadi LineString untuk diukur
                const tempLine = turf.lineString(coords);
                const distance = turf.pointToLineDistance(pt, tempLine);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestRoadName = feature.properties?.Nm_Ruas || 'Ruas Jalan Tanpa Nama';
                }
            }
        }
    }

    const isOnRoad = minDistance <= thresholdInKm;

    return {
        result: isOnRoad,
        roadName: isOnRoad ? nearestRoadName : undefined
    };
}

let cachedKawasanHutan: any = null;
function loadKawasanHutan() {
    if (cachedKawasanHutan) return cachedKawasanHutan;
    try {
        const filePath = path.join(process.cwd(), 'public', 'data', 'kwsnhtn 1.json');
        const data = fs.readFileSync(filePath, 'utf8');
        cachedKawasanHutan = JSON.parse(data);
        return cachedKawasanHutan;
    } catch (error) {
        console.error('Error loading kawasan hutan data:', error);
        return { type: 'FeatureCollection', features: [] };
    }
}

function getFungsiKawasan(lat: number, lng: number): string {
    const kawasanHutan = loadKawasanHutan();
    const pt = turf.point([lng, lat]);
    
    for (const feature of kawasanHutan.features) {
        if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
            try {
                if (turf.booleanPointInPolygon(pt, feature)) {
                    return feature.properties?.NAMOBJ || 'Kawasan Tidak Teridentifikasi';
                }
            } catch(e) {
                // Ignore turf errors on invalid geometry
            }
        }
    }
    return 'Area Penggunaan Lain (APL) / Non-Kawasan Hutan';
}

async function analyzeImageWithGemini(imageUrl: string, messageText: string = ''): Promise<string | null> {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing');
            return null;
        }
        
        // Download image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64Data = Buffer.from(response.data, 'binary').toString('base64');
        const contentType = response.headers['content-type'];
        const mimeType = (Array.isArray(contentType) ? contentType[0] : contentType) as string || 'image/jpeg';
        
        const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        
        const prompt = `Kamu adalah Asisten Sigap Dinas PUPR Papua Barat Daya. 
Tugas analisis foto lapangan:
1. Identifikasi kondisi pada foto (apakah ada jalan rusak, lubang, longsoran, banjir, atau infrastruktur lain).
2. Perkirakan tingkat kerusakan/urgensi berdasarkan foto.
3. Berikan rekomendasi layanan yang tepat (misal penambalan, pembersihan jalan, dll).
Keterangan dari pelapor: "${messageText}"

PENTING: Balas dengan format laporan rapi (gunakan markdown emoji). Jangan memberikan kalimat pembuka/penutup.
Format wajib:
📸 **Hasil Analisis Foto:** [Penjelasan singkat]
✅ **Rekomendasi Tindakan:** [Saran perbaikan]
⚠️ **Prioritas:** [Rendah/Sedang/Tinggi/Darurat]`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);
        
        return result.response.text();
    } catch (e) {
        console.error("Gemini image analysis error:", e);
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // IMPORTANT: Always return 200 to Fonnte webhook, otherwise it will retry
    // Log semua request untuk debugging
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    if (req.method !== 'POST') {
        console.log('Method not allowed:', req.method);
        return res.status(200).json({ status: 'error', message: 'Method not allowed' });
    }

    try {
        // Fonnte mengirim data dalam berbagai format tergantung tipe integrasi
        // Support: Device Webhook, Flow Builder, dan format lainnya
        const body = req.body || {};
        console.log('Full body received:', JSON.stringify(body));

        const sender    = body.sender    || body.from     || body.phone    || body.number   || body.waNumber || '';
        const message   = body.message   || body.text     || body.msg      || body.content  || '';
        const location  = body.location  || body.loc      || body.coordinate || body.latlng || '';
        const latitude  = body.latitude  || body.lat      || '';
        const longitude = body.longitude || body.lng      || body.long     || '';
        const url       = body.url       || '';
        const msgType   = body.type      || '';

        const targetNumber = sender;
        const FONNTE_API_KEY = process.env.FONNTE_API_KEY || process.env.VITE_FONNTE_API_KEY;
        const WEB_URL = "https://purppbd.vercel.app/akses-jalan";
        const MAPS_URL = "https://www.google.com/maps";

        console.log('Parsed Data:');
        console.log('- Target Number:', targetNumber);
        console.log('- Message:', message);
        console.log('- Location:', location);
        console.log('- Latitude:', latitude);
        console.log('- Longitude:', longitude);
        console.log('- API Key Present:', !!FONNTE_API_KEY);
        console.log('- API Key Length:', FONNTE_API_KEY?.length || 0);

        if (!targetNumber) {
            console.error('ERROR: No sender number found in webhook payload');
            console.error('Available keys:', Object.keys(body));
            return res.status(200).json({ status: 'ok', message: 'No sender', keys: Object.keys(body) });
        }

        if (!FONNTE_API_KEY || FONNTE_API_KEY.includes('Paste_Kode')) {
            console.error('ERROR: Fonnte API Key not configured properly');
            return res.status(200).json({ status: 'error', message: 'API Key not configured' });
        }

        if (msgType === 'image' && url) {
            console.log('Processing image from URL:', url);
            const analysisResult = await analyzeImageWithGemini(url, message);
            
            if (analysisResult) {
                const balasan = `*Laporan Analisis AI (Asisten PUPR PBD)*\n━━━━━━━━━━━━━━━━━━━━━━\n\n${analysisResult}\n\nTerima kasih atas laporan Anda! 🙏`;
                
                try {
                    console.log(`Sending image analysis reply to: ${targetNumber}`);
                    await axios.post(
                        'https://api.fonnte.com/send',
                        {
                            target: targetNumber,
                            message: balasan,
                            delay: '2'
                        },
                        {
                            headers: { 'Authorization': FONNTE_API_KEY }
                        }
                    );
                    console.log('Image reply sent successfully');
                } catch (apiError) {
                    console.error('Failed to send image reply');
                }
            }
            return res.status(200).json({ status: 'ok', message: 'Image processed' });
        }

        // 1. Logika: Jika warga kirim Lokasi
        // Fonnte bisa kirim sebagai "lat,lng" string ATAU sebagai field terpisah
        let lat: number | null = null;
        let lng: number | null = null;

        if (location && typeof location === 'string' && location.includes(',')) {
            // Format: "lat,lng" dalam satu string
            const [latStr, lngStr] = location.split(',').map((s: string) => s.trim());
            lat = parseFloat(latStr);
            lng = parseFloat(lngStr);
        } else if (latitude && longitude) {
            // Format: latitude dan longitude sebagai field terpisah
            lat = parseFloat(String(latitude));
            lng = parseFloat(String(longitude));
        }

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            console.log('Parsed coordinates:', { lat, lng });

            // Verifikasi Spasial Otomatis
            const verification = isPointOnProvincialRoad(lat, lng);
            const tataRuangKawasan = getFungsiKawasan(lat, lng);

            console.log('Verification result:', verification);
            console.log('Tata Ruang:', tataRuangKawasan);

            let balasan = '';
            const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jayapura', dateStyle: 'short', timeStyle: 'short' });

            if (verification.result) {
                // Berada di Jalan Provinsi
                balasan = `*✅ VERIFIKASI BERHASIL — JALAN PROVINSI*
━━━━━━━━━━━━━━━━━━━━━━
Halo Pace/Mace! Lokasi Anda telah terverifikasi.

📍 *Titik Koordinat:*
Latitude  : ${lat.toFixed(6)}°
Longitude : ${lng.toFixed(6)}°

🛣️ *Status Jalan Provinsi:*
${verification.roadName}
*(Jaringan Jalan Provinsi Papua Barat Daya)*

🌳 *Tata Ruang Wilayah / Fungsi Kawasan:*
${tataRuangKawasan}

🗺️ *Lihat di Google Maps:*
${MAPS_URL}?q=${lat},${lng}

🌐 *Lihat di Peta PUPR:*
${WEB_URL}?lat=${lat}&lng=${lng}

📋 *Status Laporan:*
✅ DITERIMA & DITERUSKAN ke Tim Teknis PUPR PBD.
Tim akan menindaklanjuti di lapangan.

⏱️ Waktu verifikasi: ${now}
━━━━━━━━━━━━━━━━━━━━━━
Terima kasih atas partisipasi Anda! 🙏`;
            } else {
                // Tidak berada di Jalan Provinsi
                balasan = `*⚖️ VERIFIKASI JARINGAN — DI LUAR KEWENANGAN*
━━━━━━━━━━━━━━━━━━━━━━
Halo Pace/Mace! Kami telah memeriksa lokasi Anda.

📍 *Titik Koordinat:*
Latitude  : ${lat.toFixed(6)}°
Longitude : ${lng.toFixed(6)}°

🛣️ *Status Jalan Provinsi:*
❌ LOKASI BUKAN DI JALAN PROVINSI
(Atau berada di luar area toleransi data kami)

🌳 *Tata Ruang Wilayah / Fungsi Kawasan:*
${tataRuangKawasan}

🗺️ *Lihat di Google Maps:*
${MAPS_URL}?q=${lat},${lng}

🌐 *Lihat di Peta PUPR:*
${WEB_URL}?lat=${lat}&lng=${lng}

📋 *Status Laporan:*
⏳ DITERUSKAN ke instansi terkait
(Dinas PU Kab/Kota atau Balai Nasional)
sesuai kewenangannya.

⏱️ Waktu verifikasi: ${now}
━━━━━━━━━━━━━━━━━━━━━━
Terima kasih atas partisipasi Anda! 🙏`;
            }

            console.log('Sending reply to:', targetNumber);

            try {
                const response = await axios.post('https://api.fonnte.com/send',
                    new URLSearchParams({
                        target: targetNumber,
                        message: balasan
                    }).toString(),
                    {
                        headers: {
                            'Authorization': FONNTE_API_KEY,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );

                console.log('Fonnte API Response:', response.data);
                console.log('Reply sent successfully');
            } catch (sendError: any) {
                console.error('Error sending message via Fonnte:', sendError.response?.data || sendError.message);
            }

            return res.status(200).json({ status: 'ok', message: 'Location reply sent', verification });
        }

        // 2. Logika: Auto-reply standar untuk pesan teks (Jika tidak menyertakan lokasi)
        const msgLower = (message || "").toLowerCase();
        
        // Logika Khusus SPM (Standar Pelayanan Minimal)
        if (msgLower.includes('kendala spm terkait')) {
            let bidang = 'Tim Terpadu PUPR';
            let adminNumber = ''; 
            let adminName = '';
            
            if (msgLower.includes('air minum') || msgLower.includes('sanitasi')) {
                bidang = 'Bidang Cipta Karya';
                // Contoh 2 Nomor Admin Bidang Cipta Karya (Dummy yang bisa diganti nanti)
                adminNumber = '6281200000001,6281200000002'; 
                adminName = 'Admin Cipta Karya';
            } else if (msgLower.includes('rumah')) {
                bidang = 'Bidang Perumahan Rakyat';
                adminNumber = '6281200000003,6281200000004'; 
                adminName = 'Admin Perumahan';
            } else if (msgLower.includes('bencana') || msgLower.includes('jalan')) {
                bidang = 'Bidang Bina Marga / Tanggap Darurat';
                adminNumber = '6281200000005,6281200000006'; 
                adminName = 'Admin Bina Marga';
            }

            // A. Auto-reply Cepat ke Pelapor
            const balasanPelapor = `*LAPORAN SPM DITERIMA* 📥
━━━━━━━━━━━━━━━━━━━━━━
Halo Pace/Mace, terima kasih sudah melaporkan kendala SPM (Standar Pelayanan Minimal).

Laporan Anda telah tercatat secara otomatis di sistem kami dan saat ini **SEDANG DITERUSKAN** kepada *${bidang}*.

Tim ${adminName} akan segera mengambil alih percakapan ini untuk menindaklanjuti keluhan Anda secara langsung.
Mohon siapkan:
📍 *Share Location* (Lokasi Terkini)
📸 *Foto Kondisi Lapangan* (Jika ada)

Terima kasih atas partisipasi Anda membangun Papua Barat Daya! ✊`;

            try {
                await axios.post('https://api.fonnte.com/send', new URLSearchParams({ target: targetNumber, message: balasanPelapor }).toString(), { headers: { 'Authorization': FONNTE_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' } });
            } catch (e) {
                console.error('Failed to send SPM auto-reply');
            }

            // B. Auto-forward Laporan ke Admin Bidang Masing-masing
            const balasanAdmin = `🚨 *NOTIFIKASI PENGADUAN SPM BARU* 🚨
Dari Nomor: ${targetNumber}
Kategori: ${bidang}
Pesan Pelapor: "${message}"

Mohon segera ditindaklanjuti dan hubungi pelapor secara langsung!`;

            try {
                await axios.post('https://api.fonnte.com/send', new URLSearchParams({ target: adminNumber, message: balasanAdmin }).toString(), { headers: { 'Authorization': FONNTE_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' } });
            } catch (e) {
                console.error('Failed to forward to Admin');
            }

            return res.status(200).json({ status: 'ok', message: 'SPM handled and routed' });
        }

        // Logika Teks Standar Lainnya
        if (msgLower.includes('pengaduan') || msgLower.includes('jalan rusak') || msgLower.includes('halo') || msgLower.includes('lapor') || msgLower.length > 0) {
            const balasanStandar = `*LAPORAN DITERIMA (PUPR PBD)* 📥
        
Halo Pace/Mace, terima kasih sudah menghubungi Dinas PUPR Papua Barat Daya.

Agar laporan dapat diverifikasi otomatis oleh sistem peta kami, mohon kirimkan *Share Location* (Lokasi Terkini) Anda dari WhatsApp.

Klik tombol lampiran (klip) -> Pilih 'Lokasi' -> 'Kirim lokasi Anda saat ini'.

Terima kasih atas partisipasi Anda! ✊`;

            console.log('Sending text reply to:', targetNumber);

            try {
                const response = await axios.post('https://api.fonnte.com/send',
                    new URLSearchParams({
                        target: targetNumber,
                        message: balasanStandar
                    }).toString(),
                    {
                        headers: {
                            'Authorization': FONNTE_API_KEY,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );

                console.log('Fonnte API Response:', response.data);
                console.log('Text reply sent successfully');
            } catch (sendError: any) {
                console.error('Error sending message via Fonnte:', sendError.response?.data || sendError.message);
            }

            return res.status(200).json({ status: 'ok', message: 'Text reply sent' });
        }

        return res.status(200).json({ status: 'ok', message: 'Webhook received' });
    } catch (error: any) {
        console.error("Gagal proses webhook Fonnte:", error.message);
        console.error("Error stack:", error.stack);
        // Still return 200 to prevent Fonnte from retrying
        return res.status(200).json({ status: 'error', reason: 'Internal failure', error: error.message });
    }
}
