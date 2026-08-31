import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aduanService } from '../services/aduanService';

const KATEGORI_TATA_RUANG = [
    { value: 'Alih Fungsi Lahan', label: 'Alih Fungsi Lahan (Pertanian/Hutan → Non-pertanian)' },
    { value: 'Bangunan Tanpa IMB', label: 'Bangunan Tanpa Izin di Kawasan Tertentu' },
    { value: 'Pembukaan Lahan Ilegal', label: 'Pembukaan Lahan di Kawasan Lindung' },
    { value: 'Pelanggaran GSB', label: 'Pelanggaran Garis Sempadan Bangunan (GSB)' },
    { value: 'Pelanggaran KWT', label: 'Pelanggaran Koefisien Wilayah Terbangun (KWT)' },
    { value: 'Pencemaran Kawasan', label: 'Pencemaran di Kawasan Lindung / Hijau' },
    { value: 'Lainnya', label: 'Pelanggaran Tata Ruang Lainnya' },
];

const KABUPATEN_LIST = [
    'Kota Sorong', 'Kabupaten Sorong', 'Kabupaten Sorong Selatan',
    'Kabupaten Raja Ampat', 'Kabupaten Maybrat', 'Kabupaten Tambrauw',
];

const LaporTataRuang: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [form, setForm] = useState({
        kategoriPelanggaran: '',
        lokasi: '',
        kabupaten: '',
        deskripsi: '',
        namaPerlapor: '',
        kontakPerlapor: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.kategoriPelanggaran || !form.lokasi || !form.kabupaten || !form.deskripsi) {
            alert('Mohon lengkapi semua field yang wajib diisi (*)');
            return;
        }

        setIsSubmitting(true);
        try {
            await aduanService.tambahAduan({
                kategori: 'Tata Ruang',
                lokasi_jalan: form.lokasi,
                latitude: '0',
                longitude: '0',
                deskripsi: `[${form.kategoriPelanggaran}] ${form.deskripsi}${form.namaPerlapor ? ` | Pelapor: ${form.namaPerlapor}` : ''}${form.kontakPerlapor ? ` (${form.kontakPerlapor})` : ''}`,
                image_url: '',
                jurisdiction: form.kabupaten,
                source: 'Web - Form Tata Ruang',
                status: 'Baru',
            });
            setIsSuccess(true);
        } catch (error) {
            console.error('Gagal mengirim laporan', error);
            alert('Gagal mengirim laporan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check-circle text-4xl text-green-600"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Laporan Berhasil Dikirim!</h2>
                    <p className="text-gray-500 mb-6">
                        Laporan pelanggaran Tata Ruang Anda telah diterima dan akan segera ditindaklanjuti oleh Bidang Tata Ruang Dinas PUPR Papua Barat Daya.
                    </p>
                    <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                        <p className="text-sm text-blue-800 font-medium">
                            <i className="fas fa-info-circle mr-2"></i>
                            Tim kami akan memverifikasi laporan dan menghubungi Anda jika diperlukan. Proses verifikasi lapangan dapat memakan waktu 3–7 hari kerja.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/info-tata-ruang')}
                            className="flex-1 bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors"
                        >
                            <i className="fas fa-map mr-2"></i>Kembali ke Peta
                        </button>
                        <button
                            onClick={() => { setIsSuccess(false); setForm({ kategoriPelanggaran: '', lokasi: '', kabupaten: '', deskripsi: '', namaPerlapor: '', kontakPerlapor: '' }); }}
                            className="flex-1 border-2 border-blue-900 text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                        >
                            <i className="fas fa-plus mr-2"></i>Lapor Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-pupr text-white py-14">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/info-tata-ruang')}
                        className="mb-6 flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors group"
                    >
                        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                        <span className="font-semibold">Kembali ke Info Tata Ruang</span>
                    </button>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <i className="fas fa-map-marked-alt text-2xl text-blue-900"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold">Lapor Pelanggaran Tata Ruang</h1>
                            <p className="text-blue-200 mt-1">Bidang Tata Ruang — Dinas PUPR Papua Barat Daya</p>
                        </div>
                    </div>
                    <p className="text-blue-100 max-w-2xl">
                        Laporkan dugaan pelanggaran pemanfaatan ruang di wilayah Papua Barat Daya. Laporan Anda akan langsung masuk ke sistem pengelolaan Bidang Tata Ruang.
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Informasi Pelanggaran */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                            <i className="fas fa-exclamation-triangle text-yellow-500 mr-3"></i>
                            Informasi Pelanggaran
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Jenis Pelanggaran <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="kategoriPelanggaran"
                                    value={form.kategoriPelanggaran}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                                >
                                    <option value="">-- Pilih Jenis Pelanggaran --</option>
                                    {KATEGORI_TATA_RUANG.map(k => (
                                        <option key={k.value} value={k.value}>{k.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Kabupaten/Kota <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="kabupaten"
                                    value={form.kabupaten}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                                >
                                    <option value="">-- Pilih Kabupaten/Kota --</option>
                                    {KABUPATEN_LIST.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Lokasi / Nama Tempat <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lokasi"
                                    value={form.lokasi}
                                    onChange={handleChange}
                                    required
                                    placeholder="Contoh: Jl. Basuki Rahmat Km 9, Kelurahan Klasaman"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Deskripsi Pelanggaran <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="deskripsi"
                                    value={form.deskripsi}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    placeholder="Jelaskan secara rinci pelanggaran yang terjadi, termasuk kondisi fisik, dugaan jenis bangunan/aktivitas, dan kapan pertama kali terlihat..."
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Identitas Pelapor (Opsional) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                            <i className="fas fa-user-shield text-blue-500 mr-3"></i>
                            Identitas Pelapor
                            <span className="ml-2 text-sm font-normal text-gray-400">(Opsional)</span>
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Data ini bersifat rahasia dan hanya digunakan untuk keperluan tindak lanjut jika diperlukan.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Pelapor</label>
                                <input
                                    type="text"
                                    name="namaPerlapor"
                                    value={form.namaPerlapor}
                                    onChange={handleChange}
                                    placeholder="Nama lengkap Anda"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nomor HP / WhatsApp</label>
                                <input
                                    type="text"
                                    name="kontakPerlapor"
                                    value={form.kontakPerlapor}
                                    onChange={handleChange}
                                    placeholder="Contoh: 0812xxxx"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tombol Submit */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/info-tata-ruang')}
                            className="flex-1 md:flex-none border-2 border-gray-300 text-gray-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <><i className="fas fa-circle-notch fa-spin mr-3"></i>Mengirim Laporan...</>
                            ) : (
                                <><i className="fas fa-paper-plane mr-3"></i>Kirim Laporan</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LaporTataRuang;
