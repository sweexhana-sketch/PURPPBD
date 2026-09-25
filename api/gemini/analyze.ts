import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageBuffer, locationData } = req.body;

        if (!imageBuffer) {
            return res.status(400).json({ error: 'imageBuffer is required' });
        }

        // Extract base64 part
        const base64Data = imageBuffer.split(',')[1];
        if (!base64Data) {
             return res.status(400).json({ error: 'Invalid image format' });
        }

        const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        
        if (!API_KEY) {
            console.error("Gemini API Key is missing on the server.");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Use new @google/genai SDK (v1 endpoint compatible with new API keys)
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        let locContext = "";
        if (locationData && locationData.latitude && locationData.latitude !== 'Tidak tersedia') {
            locContext = `\n\n📍 DATA LOKASI DARI SISTEM:\n- Koordinat GPS: ${locationData.latitude}, ${locationData.longitude}\n- Jalan Terdekat (WebGIS): ${locationData.roadName || 'Tidak teridentifikasi'}\n- Status Wewenang Jalan: ${locationData.jurisdiction || 'Tidak diketahui'}\n- Status Tata Ruang/Kawasan Hutan (GIS): ${locationData.statusKawasan || 'Tidak diketahui'}`;
        } else {
            locContext = `\n\n📍 DATA LOKASI: Koordinat GPS tidak tersedia saat foto diambil.`;
        }

        const prompt = `Kamu adalah Asisten Sigap Dinas PUPR Papua Barat Daya. Analisis foto ini secara mendetail sebagai petugas lapangan profesional.
${locContext}

Tugas analisis:
1. Identifikasi kondisi pada foto (jalan rusak, lubang, retakan, longsoran, banjir, infrastruktur rusak, atau kondisi lingkungan lainnya).
2. Perkirakan tingkat kerusakan/urgensi berdasarkan foto.
3. Cocokkan dengan data sistem yang tersedia di atas.
4. Berikan rekomendasi layanan.

PENTING: Balas HANYA dengan JSON valid tanpa teks lain, tanpa markdown, tanpa kode blocks:
{"isValid": true, "kategori": "nama kategori", "message": "laporan markdown lengkap berisi:\\n📸 **Hasil Analisis Foto:** [kondisi detail, tingkat kerusakan]\\n\\n📍 **Informasi Lokasi:** [koordinat, nama jalan]\\n\\n🗺️ **Status Kawasan:** [dari data GIS]\\n\\n✅ **Rekomendasi Layanan:** [saran tindakan]\\n\\n⚠️ **Prioritas:** [Rendah/Sedang/Tinggi/Darurat]"}

IsValid = false HANYA jika foto tidak relevan (selfie, makanan, dll). Semua foto infrastruktur/lingkungan = isValid true.`;

        // Deteksi mimeType dari data URL
        let mimeType = "image/jpeg";
        if (imageBuffer.startsWith('data:image/png')) mimeType = "image/png";
        else if (imageBuffer.startsWith('data:image/webp')) mimeType = "image/webp";
        else if (imageBuffer.startsWith('data:image/gif')) mimeType = "image/gif";

        const result = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { data: base64Data, mimeType: mimeType as any } }
                    ]
                }
            ]
        });

        const text = result.text;

        return res.status(200).json({ text });
    } catch (error: any) {
        console.error("Image Analysis Error:", error?.message || error);
        return res.status(500).json({ error: 'Terjadi gangguan saat menganalisis gambar.' });
    }
}
