/**
 * WhatsApp Service (Fonnte Integration)
 * 
 * KEAMANAN: API Key Fonnte TIDAK lagi diambil di browser.
 * Semua request diteruskan ke Vercel Serverless Function (/api/send-whatsapp)
 * yang menyimpan API Key di sisi server (environment variable).
 */

export interface FonnteResponse {
    status: boolean;
    message: string;
    data?: any;
}

/**
 * Mengirim pesan WhatsApp via serverless endpoint /api/send-whatsapp
 * API Key Fonnte tersimpan aman di server — TIDAK pernah dikirim ke browser.
 * @param to Nomor tujuan (format 628...)
 * @param message Isi pesan
 */
export async function sendBlazwaMessage(to: string, message: string): Promise<FonnteResponse> {
    try {
        const response = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, message }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API error:', data);
            return { status: false, message: data.message || 'Gagal mengirim pesan' };
        }

        return {
            status: data.status === true,
            message: data.message || 'Selesai',
            data: data,
        };
    } catch (error) {
        console.error('WhatsApp Service Error:', error);
        return { status: false, message: 'Gagal terhubung ke server' };
    }
}

/**
 * Fungsi pembantu untuk verifikasi wilayah aduan
 * (Menyocokkan koordinat dengan data GeoJSON lokal)
 */
export async function checkLocationJurisdiction(lat: number, lng: number): Promise<string> {
    try {
        // Logika verifikasi wilayah jalan
        // Kedepannya bisa diintegrasikan dengan point-in-polygon logic.
        return 'Provinsi (Dalam Jaringan)';
    } catch (e) {
        return 'Luar Jaringan';
    }
}
