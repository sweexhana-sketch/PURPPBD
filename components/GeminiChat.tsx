
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini, analyzeRoadImage } from '../services/geminiService';
import { checkJurisdiction, checkStatusKawasan } from '../services/verificationService';
import { sendBlazwaMessage } from '../services/whatsappService';
import { aduanService } from '../services/aduanService';
import exifr from 'exifr';

interface Message {
  role: 'user' | 'ai' | 'admin';
  text: string;
  image?: string;
  isImageAnalysis?: boolean;
  type?: 'receipt';
  receiptData?: {
    id: string;
    roadName: string;
    jurisdiction: string;
    coordinates: string;
    timestamp: string;
  };
}

const GeminiChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Halo, Pace Mace! 👋 Selamat datang di **Asisten Sigap** Dinas PUPR Papua Barat Daya.\n\nSaya siap membantu Kaka/Abang dengan berbagai layanan:\n\n🚧 **Aduan Jalan Rusak** - Laporkan kerusakan jalan\n📍 **Laporan Posisi Lokasi** - Cek status kawasan & jalan di lokasi Anda\n🏠 **Bantuan RTLH** - Info bantuan rumah tidak layak huni\n📋 **Izin Bangunan (PBG)** - Informasi perizinan\n💧 **Pertek Air Permukaan** - Rekomendasi teknis\n\nKetik kebutuhan Anda, atau klik 📍 **tombol GPS** di bawah untuk langsung cek posisi Anda sekarang!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [complaintData, setComplaintData] = useState({
    lokasi_jalan: '',
    latitude: '',
    longitude: '',
    deskripsi: '',
    image_url: '',
    jurisdiction: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);

  const handleShareGPS = async () => {
    if (!navigator.geolocation) {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Browser Anda tidak mendukung GPS. Mohon ketik koordinat manual (contoh: -0.8615, 131.2521).' }]);
      return;
    }
    setIsGettingGPS(true);
    setMessages(prev => [...prev, { role: 'user', text: '📍 Mengambil posisi GPS saya saat ini...' }]);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy);

      const [verification, kawasan] = await Promise.all([
        checkJurisdiction(lat, lng),
        checkStatusKawasan(lat, lng)
      ]);

      setComplaintData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
        jurisdiction: verification.jurisdiction,
        lokasi_jalan: verification.roadName || prev.lokasi_jalan,
        status_kawasan: kawasan
      } as any));

      const locMsg = [
        `✅ **Posisi GPS berhasil diambil!**`,
        ``,
        `📍 **Koordinat:** ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        `🎯 **Akurasi:** ±${accuracy} meter`,
        `🛣️ **Jalan Terdekat:** ${verification.roadName || 'Tidak terdeteksi'}`,
        `🏢 **Wewenang:** ${verification.jurisdiction || 'Tidak diketahui'}`,
        `🗺️ **Status Kawasan (GIS):** ${kawasan || 'Tidak diketahui'}`,
        ``,
        `Apakah Kaka ingin **melaporkan kondisi lokasi ini**? Silakan kirim foto atau ceritakan keadaan di sini.`
      ].join('\n');

      setMessages(prev => [...prev, { role: 'ai', text: locMsg }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Gagal mengambil GPS. Mohon izinkan akses lokasi di browser Anda, atau ketik koordinat manual.' }]);
    }
    setIsGettingGPS(false);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const userMsg = overrideText || input.trim();
    if (!userMsg && !overrideText) return;

    if (isLoading) return;

    const newMessage: Message = { role: 'user', text: userMsg };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Coordinate Parsing Logic
    const coordRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match = userMsg.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      const verification = await checkJurisdiction(lat, lng);
      setComplaintData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
        jurisdiction: verification.jurisdiction,
        lokasi_jalan: verification.roadName || prev.lokasi_jalan
      }));

      let verificationMsg = '';
      if (verification.jurisdiction === 'Provinsi') {
        verificationMsg = `📍 Koordinat terdeteksi di **${verification.roadName}**. Ini adalah wewenang **Provinsi**, laporan Kaka akan diprioritaskan oleh Dinas PUPR PBD!`;
      } else if (verification.jurisdiction === 'Nasional') {
        verificationMsg = `📍 Koordinat terdeteksi di **${verification.roadName}**. Ini adalah **Jalan Nasional**, kami akan membantu meneruskan ke Balai Pelaksana Jalan Nasional.`;
      } else {
        verificationMsg = `📍 Koordinat terdeteksi. Lokasi ini tampaknya berada di luar jaringan jalan utama provinsi/nasional. Namun kami tetap akan mencatat laporan Kaka.`;
      }

      setMessages(prev => [...prev, { role: 'ai', text: verificationMsg + "\n\nSekarang, mohon unggah foto bukti kerusakan jalannya menggunakan tombol kamera di bawah." }]);
      setIsLoading(false);
      return;
    }

    // AI Response logic
    const aiResponse = await chatWithGemini(userMsg, updatedMessages);

    // Heuristic: Capture description if previous AI msg asked for it
    const lastAiMsg = messages.filter(m => m.role === 'ai').pop();
    if (lastAiMsg && (lastAiMsg.text.toLowerCase().includes('deskripsi') || lastAiMsg.text.toLowerCase().includes('jelaskan'))) {
      setComplaintData(prev => ({ ...prev, deskripsi: userMsg }));
    }

    // Capture location if it's the first response (after greeting)
    if (messages.length === 1) {
      setComplaintData(prev => ({ ...prev, lokasi_jalan: userMsg }));
    }

    if (!aiResponse || aiResponse.includes('gangguan pada sistem')) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Maaf Bapa/Mama, Asisten sedang ada gangguan koneksi. \n\nMohon pastikan Kakak sudah mengatur API Key di file .env (VITE_GEMINI_API_KEY) atau coba lagi sebentar ya.' }]);
    } else {
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input agar file yang sama bisa dipilih lagi
    e.target.value = '';

    // Buat image element untuk kompresi
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = async () => {
      // Kompresi gambar dengan Canvas agar ukuran file < 4MB (Batas Vercel)
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert ke base64 (JPEG, quality 0.7)
      const base64Image = canvas.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(objectUrl);

      setMessages(prev => [...prev, {
        role: 'user',
        text: '📸 Memproses foto & mengambil posisi GPS...',
        image: base64Image
      }]);

      setIsLoading(true);

      // 1. Ambil GPS. Prioritas: EXIF Foto -> High Accuracy GPS -> Low Accuracy GPS
      let currentLat = '';
      let currentLng = '';
      let currentJurisdiction = complaintData.jurisdiction;
      let currentRoadName = complaintData.lokasi_jalan;
      let currentStatusKawasan = (complaintData as any).status_kawasan || '';
      let locationAvailable = false;

      try {
        // Coba ekstrak metadata GPS dari foto aslinya (EXIF)
        const exifData = await exifr.gps(file);
        if (exifData && exifData.latitude && exifData.longitude) {
          currentLat = exifData.latitude.toFixed(6);
          currentLng = exifData.longitude.toFixed(6);
          locationAvailable = true;
          console.log('GPS diambil dari metadata Foto (EXIF)');
        }
      } catch (exifErr) {
        console.warn('Gagal membaca EXIF foto:', exifErr);
      }

      // Jika tidak ada EXIF di foto, gunakan GPS browser
      if (!locationAvailable && navigator.geolocation) {
        // Helper function to wrap Geolocation API in a Promise
        const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });
        };

        try {
          // Coba High Accuracy dulu
          const position = await getPosition({
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: 0
          });
          currentLat = position.coords.latitude.toFixed(6);
          currentLng = position.coords.longitude.toFixed(6);
          locationAvailable = true;
          console.log('GPS diambil dari Browser (High Accuracy)');
        } catch (err) {
          console.warn('High accuracy GPS failed, trying low accuracy...', err);
          try {
            // Fallback ke Low Accuracy jika gagal/timeout (sering terjadi di HP Android)
            const position = await getPosition({
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0
            });
            currentLat = position.coords.latitude.toFixed(6);
            currentLng = position.coords.longitude.toFixed(6);
            locationAvailable = true;
            console.log('GPS diambil dari Browser (Low Accuracy)');
          } catch (err2) {
             console.warn('Low accuracy GPS also failed:', err2);
          }
        }
      }

      if (locationAvailable) {
        try {
          // Query WebGIS data secara paralel
          const [verification, kawasan] = await Promise.all([
            checkJurisdiction(parseFloat(currentLat), parseFloat(currentLng)),
            checkStatusKawasan(parseFloat(currentLat), parseFloat(currentLng))
          ]);

          currentJurisdiction = verification.jurisdiction;
          currentRoadName = verification.roadName || currentRoadName;
          currentStatusKawasan = kawasan;

          setComplaintData(prev => ({
            ...prev,
            latitude: currentLat,
            longitude: currentLng,
            jurisdiction: currentJurisdiction,
            lokasi_jalan: currentRoadName,
            status_kawasan: kawasan
          } as any));
        } catch (webgisErr) {
          console.warn('Error querying WebGIS:', webgisErr);
        }
      } else if (complaintData.latitude) {
        // Fallback gunakan koordinat lama jika sama sekali gagal ambil GPS baru
        currentLat = complaintData.latitude;
        currentLng = complaintData.longitude;
        locationAvailable = true;
      }

      // 2. Perform AI Analysis + WebGIS data
      try {
        const locationDataForAI = {
          latitude: currentLat || 'Tidak tersedia',
          longitude: currentLng || 'Tidak tersedia',
          roadName: currentRoadName || 'Tidak teridentifikasi',
          jurisdiction: currentJurisdiction || 'Tidak diketahui',
          statusKawasan: currentStatusKawasan || 'Tidak diketahui',
          locationAvailable
        };

        const analysisResult = await analyzeRoadImage(base64Image, locationDataForAI);

        // Robust JSON parser - handle berbagai format respons AI
        let parsedAnalysis: any = null;
        try {
          // Coba extract JSON dari dalam teks (model kadang tambahkan teks di sekitar JSON)
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedAnalysis = JSON.parse(jsonMatch[0]);
          } else {
            parsedAnalysis = JSON.parse(analysisResult.trim());
          }
        } catch (parseErr) {
          // Jika parse gagal, buat response manual dari teks mentah
          parsedAnalysis = {
            isValid: true,
            kategori: 'Laporan Foto',
            message: analysisResult
          };
        }

        // Bangun pesan lengkap dengan data WebGIS
        const locInfoBlock = locationAvailable ? [
          ``,
          `---`,
          `📍 **Koordinat GPS:** ${currentLat}, ${currentLng}`,
          `🛣️ **Jalan Terdekat:** ${currentRoadName || 'Tidak teridentifikasi'}`,
          `🏢 **Status Jalan:** ${currentJurisdiction}`,
          `🗺️ **Status Kawasan (GIS):** ${currentStatusKawasan}`,
        ].join('\n') : `\n\n⚠️ *Koordinat GPS tidak tersedia. Silakan klik tombol 📍 GPS atau ketik koordinat manual.*`;

        const fullMessage = (parsedAnalysis.message || '') + locInfoBlock;

        if (parsedAnalysis.isValid !== false) {
          setComplaintData(prev => ({ 
            ...prev, 
            image_url: base64Image,
            deskripsi: parsedAnalysis.message // Simpan analisis AI ke deskripsi
          }));
          setMessages(prev => [...prev, {
            role: 'ai',
            text: fullMessage + '\n\n**Apakah Bapa/Mama ingin mengirimkan laporan ini ke sistem PUPR?** (Ketik "Ya" untuk mengirim)'
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'ai',
            text: fullMessage
          }]);
        }
      } catch (e) {
        console.error('AI Analysis Error:', e);
        // Tetap tampilkan info lokasi meski analisis AI gagal
        const fallbackMsg = locationAvailable
          ? `⚠️ Analisis AI sedang terganggu, namun data lokasi berhasil diambil:\n\n📍 **Koordinat:** ${currentLat}, ${currentLng}\n🛣️ **Jalan:** ${currentRoadName || '-'}\n🏢 **Status:** ${currentJurisdiction}\n🗺️ **Kawasan:** ${currentStatusKawasan}\n\nSilakan deskripsikan kondisi di lokasi tersebut.`
          : `⚠️ Analisis foto gagal. Mohon izinkan akses kamera & lokasi, lalu coba lagi.`;
        setMessages(prev => [...prev, { role: 'ai', text: fallbackMsg }]);
      }

      setIsLoading(false);
    };
  };

  const sendToN8nWebhook = async (data: any) => {
    // URL Webhook n8n diambil dari Environment Variables (Vercel)
    // Jika belum diatur, pastikan Kaka mengisi VITE_N8N_WEBHOOK_URL di .env
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn("n8n Webhook URL belum diatur di VITE_N8N_WEBHOOK_URL");
      return false;
    }

    try {
      console.log("Mengirim data ke n8n Webhook...");
      const response = await fetch(webhookUrl, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) 
      });
      
      if (response.ok) {
        console.log("Berhasil mengirim data ke n8n!");
        return true;
      } else {
        console.error("Gagal mengirim ke n8n:", response.statusText);
        return false;
      }
    } catch (e) {
      console.error("Error koneksi ke n8n Webhook:", e);
      return false;
    }
  };

  const handleSubmitFinal = async () => {
    const isJalanPutus = messages.some(m => m.text.toLowerCase().includes('putus'));
    const finalDescription = isJalanPutus ? `[PRIORITAS TINGGI] ${complaintData.deskripsi || 'Sesuai Foto'}` : (complaintData.deskripsi || 'Sesuai Foto');

    const finalReport = {
      ...complaintData,
      deskripsi: finalDescription,
      timestamp: new Date().toISOString(),
      source: 'Asisten Sigap'
    };

    // Construct WhatsApp Message
    const phoneNumber = '6281141902984';
    const statusJalan = finalReport.jurisdiction === 'Provinsi' ? '🔴 JALAN PROVINSI' : (finalReport.jurisdiction === 'Nasional' ? '🔵 JALAN NASIONAL' : '⚪ LUAR JARINGAN');
    const statusKawasan = (finalReport as any).status_kawasan ? `🗺️ *Status Kawasan:* ${(finalReport as any).status_kawasan}` : '';

    const message = `Halo Dinas PUPR Papua Barat Daya, berikut laporan baru dari Asisten Sigap:
    
*STATUS WEWENANG:* ${statusJalan}
${statusKawasan}
📌 *Lokasi Terdekat:* ${finalReport.lokasi_jalan || 'Tidak terdeteksi'}
📍 *Koordinat GPS:* ${finalReport.latitude}, ${finalReport.longitude}

*--- HASIL ANALISIS AI ---*
${finalReport.deskripsi}

📦 *Data ID:* PBD-${Math.floor(Math.random() * 10000)}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    const reportId = `PBD-${Math.floor(Math.random() * 10000)}`;
    const finalReportFinal = {
      ...finalReport,
      kategori: 'Jalan',
      status: 'Baru' as const
    };

    setIsLoading(true);
    // Save to Supabase for Admin Dashboard
    try {
      const payload = { ...finalReportFinal };
      delete (payload as any).timestamp;
      delete (payload as any).status_kawasan;
      await aduanService.tambahAduan(payload);
    } catch (e) {
      console.error("Gagal menyimpan aduan:", e);
    }

    // Kirim data ke n8n (di-trigger secara background)
    await sendToN8nWebhook(finalReportFinal);
    setIsLoading(false);

    // Add Digital Receipt to Chat
    setMessages(prev => [...prev, {
      role: 'ai',
      text: 'Berikut adalah Resi Digital laporan Bapa/Mama:',
      type: 'receipt',
      receiptData: {
        id: reportId,
        roadName: finalReport.lokasi_jalan || 'Tidak Terdeteksi',
        jurisdiction: finalReport.jurisdiction || 'Luar Jaringan',
        coordinates: `${finalReport.latitude}, ${finalReport.longitude}`,
        timestamp: new Date().toLocaleString('id-ID')
      }
    }]);

    // Simulated Admin Auto-Reply based on Jurisdiction
    setTimeout(() => {
      let adminText = '';
      if (finalReport.jurisdiction === 'Provinsi') {
        adminText = '📢 **BALASAN OTOMATIS ADMIN PUPR PBD**:\n\nLaporan diterima. Status jalan adalah **Kewenangan Provinsi**. Laporan Kaka akan segera kami proses untuk penanganan lebih lanjut. Terima kasih!';
      } else {
        adminText = '📢 **BALASAN OTOMATIS ADMIN PUPR PBD**:\n\nLaporan diterima. Status jalan **bukan kewenangan Provinsi**. Kami akan menampung laporan ini untuk tetap diteruskan ke instansi yang berwenang (Balai Jalan/Kabupaten). Terima kasih!';
      }

      setMessages(prev => [...prev, {
        role: 'admin',
        text: adminText
      }]);
    }, 1500);

    // Send automated WhatsApp notification (BlazWA Integration)
    const waResponse = await sendBlazwaMessage(phoneNumber, message);
    if (waResponse.status) {
      console.log('BlazWA: Notifikasi otomatis berhasil dikirim');
    }

    window.open(whatsappUrl, '_blank');

    setMessages(prev => [...prev, {
      role: 'ai',
      text: 'Laporan sudah diteruskan ke WhatsApp Dinas PUPR. Ada lagi yang PACE MACE mau laporkan?'
    }]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-900 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-alt'} text-2xl`}></i>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-[450px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 animate-slide-up">
          <div className="bg-blue-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-blue-900">
                <i className="fas fa-robot text-xl"></i>
              </div>
              <div>
                <h4 className="font-bold">Asisten Sigap</h4>
                <p className="text-xs text-blue-200">Dinas PUPR PBD | Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                  ? 'bg-blue-900 text-white rounded-tr-none'
                  : msg.role === 'admin'
                    ? 'bg-yellow-100 text-blue-900 border-2 border-yellow-400 rounded-tl-none font-medium'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {msg.type === 'receipt' && msg.receiptData && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                      <div className="flex items-center justify-between mb-2 border-b border-blue-100 pb-1">
                        <span className="font-bold text-xs">RESI DIGITAL PUPR</span>
                        <span className="text-[10px] opacity-70">#{msg.receiptData.id}</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p><strong>📍 Lokasi:</strong> {msg.receiptData.roadName}</p>
                        <p><strong>🏢 Status:</strong> {msg.receiptData.jurisdiction}</p>
                        <p><strong>🧭 GPS:</strong> {msg.receiptData.coordinates}</p>
                        <p><strong>🕒 Waktu:</strong> {msg.receiptData.timestamp}</p>
                      </div>
                      <div className="mt-2 text-center text-[10px] font-bold text-blue-600">
                        STATUS: TERVERIFIKASI SISTEM
                      </div>
                    </div>
                  )}

                  {msg.image && (
                    <img src={msg.image} alt="Upload bukti" className="mt-2 rounded-lg max-h-48 w-full object-cover" />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            {messages.length > 5 && !messages[messages.length - 1].text.includes('berhasil') && (
              <button
                onClick={handleSubmitFinal}
                className="w-full mb-3 bg-yellow-500 text-blue-900 font-bold py-2 rounded-lg shadow-md hover:bg-yellow-400 transition-colors"
              >
                <i className="fas fa-paper-plane mr-2"></i> Kirim Laporan ke Database
              </button>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Unggah Foto"
              >
                <i className="fas fa-camera"></i>
              </button>
              <button
                onClick={handleShareGPS}
                disabled={isGettingGPS}
                className="bg-gray-100 text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="Bagikan Posisi GPS"
              >
                {isGettingGPS ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-map-marker-alt"></i>}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tulis pesan..."
                className="flex-1 bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-900 outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading}
                className="bg-blue-900 text-white p-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiChat;
