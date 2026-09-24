// api/send-whatsapp.ts
// Serverless function untuk mengirim pesan WhatsApp via Fonnte
// API Key Fonnte TIDAK terekspos ke browser karena diproses di sini (server-side)

import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: "Parameter \"to\" dan \"message\" wajib diisi." });
        }

        // Ambil API Key dari environment variable server (TIDAK pernah terekspos ke browser)
        const FONNTE_API_KEY = process.env.FONNTE_API_KEY;

        if (!FONNTE_API_KEY) {
            console.error("FONNTE_API_KEY belum diatur di environment variable server.");
            return res.status(500).json({ error: "Konfigurasi server belum lengkap." });
        }

        const response = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
                "Authorization": FONNTE_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                target: to,
                message: message,
            }).toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Fonnte API error:", data);
            return res.status(502).json({ status: false, message: "Gagal mengirim pesan WhatsApp." });
        }

        return res.status(200).json({
            status: data.status === true,
            message: data.reason || "Pesan berhasil dikirim",
        });

    } catch (error: any) {
        console.error("Error di /api/send-whatsapp:", error.message);
        return res.status(500).json({ status: false, message: "Gagal terhubung ke server Fonnte." });
    }
}
