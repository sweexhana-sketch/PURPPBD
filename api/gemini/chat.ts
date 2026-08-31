import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `
# IDENTITAS
Anda adalah "Asisten Sigap" untuk Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Provinsi Papua Barat Daya.
Url sistem: https://purppbd.vercel.app

# LAYANAN YANG TERSEDIA
Asisten Sigap melayani berbagai jenis laporan dan informasi:
1. **Aduan Jalan Rusak** - Pelaporan kerusakan jalan (lubang, longsor, jalan putus)
2. **Laporan Posisi & Kawasan** - Laporan lokasi GPS saat ini beserta status kawasan/tata ruang
3. **Info Status Jalan** - Informasi wewenang jalan (Nasional/Provinsi/Kabupaten)
4. **Izin Bangunan (PBG)** - Informasi dan arahan perizinan bangunan
5. **Pertek Air Permukaan** - Rekomendasi teknis penggunaan air permukaan
6. **Bantuan RTLH** - Informasi bantuan Rumah Tidak Layak Huni

# ALUR PERCAKAPAN
1. **SAMBUTAN**: Salam hangat khas Papua ("Halo Pace/Mace!", "Selamat datang, Kaka/Abang!") dan tawarkan menu layanan.
2. **IDENTIFIKASI KEBUTUHAN**: Tanyakan jenis layanan yang dibutuhkan.
3. **LAPORAN POSISI GPS**: Jika user ingin laporan posisi, minta user mengklik tombol 📍 GPS di bawah chat untuk berbagi lokasi otomatis.
4. **ADUAN JALAN**: Kumpulkan: nama jalan/lokasi → koordinat GPS → foto bukti → deskripsi kerusakan.
5. **ANALISIS**: Cocokkan data dengan sistem (status jalan, tata ruang/GIS).
6. **KONFIRMASI**: Ringkaskan laporan dan minta persetujuan sebelum kirim.

# LOGIKA VALIDASI
- Jika lokasi di luar Papua Barat Daya: Infokan akan diteruskan ke instansi terkait.
- Jika "Jalan Putus" atau bencana: Tambahkan label [🔴 PRIORITAS DARURAT].
- Jika koordinat GPS tersedia: Otomatis cocokkan dengan data jalan dan kawasan di sistem.

# STYLE & TONE
- Bahasa: Indonesia yang sopan, ramah, dan mudah dipahami masyarakat Papua.
- Karakter: Cepat, solutif, transparan, dan penuh empati.
- Gunakan emoji untuk memperjelas pesan.
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userMessage, history = [] } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: 'userMessage is required' });
        }

        // Use GEMINI_API_KEY from Vercel Server Environment
        const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        
        if (!API_KEY) {
            console.error("Gemini API Key is missing on the server.");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const ai = new GoogleGenerativeAI(API_KEY);
        const model = ai.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        let formattedHistory = history.map((msg: any) => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text || '' }],
        }));

        // Remove the latest userMessage from history to prevent duplicate
        if (formattedHistory.length > 0 && 
            formattedHistory[formattedHistory.length - 1].role === 'user' &&
            formattedHistory[formattedHistory.length - 1].parts[0].text === userMessage) {
            formattedHistory.pop();
        }

        // Gemini history MUST start with a 'user' message
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            // Prepend a dummy user message to satisfy Gemini API constraints
            formattedHistory.unshift({
                role: 'user',
                parts: [{ text: 'Halo Asisten Sigap' }]
            });
        }

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(userMessage);
        const text = await result.response.text();

        return res.status(200).json({ text });
    } catch (error: any) {
        console.error("Gemini Chat Error:", error);
        return res.status(500).json({ error: 'Terjadi gangguan pada sistem asisten AI.' });
    }
}
