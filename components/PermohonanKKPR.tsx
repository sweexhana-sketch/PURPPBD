import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kkprService } from '../services/kkprService';

const JENIS_KEGIATAN = [
    'Perumahan/Permukiman',
    'Pergudangan',
    'Industri',
    'Pertambangan',
    'Perkebunan',
    'Pariwisata',
    'Infrastruktur/Utilitas',
    'Menara/Telekomunikasi',
    'Fasilitas Umum/Sosial',
    'Perdagangan/Jasa',
    'Lainnya',
];

const KABUPATEN = [
    'Sorong',
    'Sorong Selatan',
    'Raja Ampat',
    'Tambraw',
    'Maybrat',
    'Fakfak',
];

const PermohonanKKPR: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({
        jenis_pemohon: 'Perorangan',
        nama_pemohon: '',
        ktp: '',
        nib: '',
        npwp: '',
        telepon: '',
        email: '',
        kabupaten: '',
        distrik: '',
        kampung: '',
        alamat_lokasi: '',
        latitude: '',
        longitude: '',
        luas_lahan: '',
        jenis_kegiatan: '',
        nama_kegiatan: '',
        kbli: '',
        deskripsi_kegiatan: '',
    });

    const set = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleGetLocation = () => {
        if (!navigator.geolocation) { alert('Browser tidak mendukung GPS.'); return; }
        navigator.geolocation.getCurrentPosition(
            pos => {
                set('latitude', pos.coords.latitude.toFixed(6));
                set('longitude', pos.coords.longitude.toFixed(6));
                alert('Koordinat berhasil diambil!');
            },
            () => alert('Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.')
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await kkprService.tambahPermohonan(form);
            const waText = `Halo Admin Tata Ruang, saya mengajukan Permohonan KKPR.\n\n*Nama:* ${form.nama_pemohon}\n*Jenis Pemohon:* ${form.jenis_pemohon}\n*Telepon:* ${form.telepon}\n*Jenis Kegiatan:* ${form.jenis_kegiatan}\n*Nama Kegiatan:* ${form.nama_kegiatan}\n*Lokasi:* ${form.alamat_lokasi}, ${form.kabupaten}\n*Luas Lahan:* ${form.luas_lahan}\n*Koordinat:* ${form.latitude}, ${form.longitude}\n\n*Deskripsi:*\n${form.deskripsi_kegiatan}`;
            window.open(`https://wa.me/6281141902984?text=${encodeURIComponent(waText)}`, '_blank');
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900 font-medium';
    const labelClass = 'block text-gray-700 font-semibold mb-1 text-sm';

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check-circle text-4xl text-green-500"></i>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-3">Permohonan Terkirim!</h2>
                    <p className="text-gray-600 mb-6">Permohonan KKPR Anda telah berhasil disimpan. Tim Bidang Tata Ruang akan menghubungi Anda untuk proses selanjutnya.</p>
                    <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left text-sm text-blue-800">
                        <p className="font-bold mb-1"><i className="fas fa-info-circle mr-2"></i>Langkah Selanjutnya:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700">
                            <li>Siapkan dokumen fisik persyaratan</li>
                            <li>Tunggu konfirmasi dari tim kami via WA</li>
                            <li>Hadir ke kantor Dinas PUPR untuk verifikasi</li>
                        </ol>
                    </div>
                    <button onClick={() => navigate('/info-tata-ruang')} className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors">
                        <i className="fas fa-arrow-left mr-2"></i>Kembali ke Info Tata Ruang
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white py-10">
                <div className="max-w-4xl mx-auto px-4">
                    <button onClick={() => navigate('/info-tata-ruang')} className="mb-4 flex items-center space-x-2 text-blue-200 hover:text-white transition-colors">
                        <i className="fas fa-arrow-left"></i>
                        <span>Kembali ke Info Tata Ruang</span>
                    </button>
                    <h1 className="text-3xl font-black mb-2">
                        <i className="fas fa-file-alt mr-3 text-yellow-400"></i>
                        Permohonan KKPR
                    </h1>
                    <p className="text-blue-200">Kesesuaian Kegiatan Pemanfaatan Ruang — Dinas PUPR Papua Barat Daya</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Step Indicator */}
                <div className="flex items-center justify-center mb-8 space-x-2">
                    {[1,2,3].map(s => (
                        <React.Fragment key={s}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${step >= s ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                                {step > s ? <i className="fas fa-check text-xs"></i> : s}
                            </div>
                            {s < 3 && <div className={`h-1 w-16 rounded transition-all ${step > s ? 'bg-blue-900' : 'bg-gray-200'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex justify-center space-x-16 text-xs font-semibold text-gray-500 mb-8 -mt-4">
                    <span className={step >= 1 ? 'text-blue-900' : ''}>Identitas</span>
                    <span className={step >= 2 ? 'text-blue-900' : ''}>Lokasi</span>
                    <span className={step >= 3 ? 'text-blue-900' : ''}>Rencana Kegiatan</span>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* === STEP 1: IDENTITAS === */}
                    {step === 1 && (
                        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-5">
                            <h2 className="text-xl font-black text-blue-900 mb-6 flex items-center">
                                <i className="fas fa-user-circle mr-3 text-yellow-500"></i>
                                Identitas Pemohon
                            </h2>

                            <div>
                                <label className={labelClass}>Jenis Pemohon <span className="text-red-500">*</span></label>
                                <div className="flex gap-4">
                                    {['Perorangan','Badan Usaha'].map(j => (
                                        <label key={j} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer font-semibold text-sm transition-all ${form.jenis_pemohon === j ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-500'}`}>
                                            <input type="radio" name="jenis_pemohon" value={j} checked={form.jenis_pemohon === j} onChange={e => set('jenis_pemohon', e.target.value)} className="hidden" />
                                            <i className={`fas ${j === 'Perorangan' ? 'fa-user' : 'fa-building'}`}></i>
                                            {j}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Nama Lengkap / Nama Perusahaan <span className="text-red-500">*</span></label>
                                    <input required value={form.nama_pemohon} onChange={e => set('nama_pemohon', e.target.value)} placeholder="Nama lengkap pemohon" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>NIK / KTP <span className="text-red-500">*</span></label>
                                    <input required value={form.ktp} onChange={e => set('ktp', e.target.value)} placeholder="Nomor KTP/NIK pemohon" className={inputClass} />
                                </div>
                                {form.jenis_pemohon === 'Badan Usaha' && (
                                    <div>
                                        <label className={labelClass}>NIB (Nomor Induk Berusaha)</label>
                                        <input value={form.nib} onChange={e => set('nib', e.target.value)} placeholder="Nomor NIB dari OSS" className={inputClass} />
                                    </div>
                                )}
                                <div>
                                    <label className={labelClass}>NPWP <span className="text-gray-400 font-normal">(opsional)</span></label>
                                    <input value={form.npwp} onChange={e => set('npwp', e.target.value)} placeholder="Nomor NPWP" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Nomor Telepon/WhatsApp <span className="text-red-500">*</span></label>
                                    <input required value={form.telepon} onChange={e => set('telepon', e.target.value)} placeholder="08xx-xxxx-xxxx" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Email Aktif <span className="text-gray-400 font-normal">(opsional)</span></label>
                                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@contoh.com" className={inputClass} />
                                </div>
                            </div>

                            <button type="button" onClick={() => setStep(2)} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-all mt-4 flex items-center justify-center gap-2">
                                Lanjut ke Data Lokasi <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    )}

                    {/* === STEP 2: LOKASI === */}
                    {step === 2 && (
                        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-5">
                            <h2 className="text-xl font-black text-blue-900 mb-6 flex items-center">
                                <i className="fas fa-map-marker-alt mr-3 text-yellow-500"></i>
                                Data Lokasi Kegiatan
                            </h2>

                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Kabupaten/Kota <span className="text-red-500">*</span></label>
                                    <select required value={form.kabupaten} onChange={e => set('kabupaten', e.target.value)} className={inputClass}>
                                        <option value="">-- Pilih Kabupaten/Kota --</option>
                                        {KABUPATEN.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Distrik</label>
                                    <input value={form.distrik} onChange={e => set('distrik', e.target.value)} placeholder="Nama distrik" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Kampung/Kelurahan</label>
                                    <input value={form.kampung} onChange={e => set('kampung', e.target.value)} placeholder="Nama kampung/kelurahan" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Luas Lahan <span className="text-red-500">*</span></label>
                                    <input required value={form.luas_lahan} onChange={e => set('luas_lahan', e.target.value)} placeholder="Contoh: 5.000 m² atau 2,5 ha" className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Alamat Lengkap Lokasi <span className="text-red-500">*</span></label>
                                <textarea required value={form.alamat_lokasi} onChange={e => set('alamat_lokasi', e.target.value)} rows={3} placeholder="Tuliskan alamat lengkap lokasi kegiatan yang dimohonkan..." className={inputClass}></textarea>
                            </div>

                            {/* GPS */}
                            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="font-bold text-blue-900 text-sm flex items-center gap-2">
                                        <i className="fas fa-location-arrow text-blue-600"></i>
                                        Koordinat GPS Lokasi
                                    </label>
                                    <button type="button" onClick={handleGetLocation} className="bg-blue-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center gap-1">
                                        <i className="fas fa-crosshairs"></i> Ambil Lokasi Saya
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 font-semibold mb-1 block">Latitude</label>
                                        <input value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="-1.336xxx" className={inputClass + ' text-sm'} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-semibold mb-1 block">Longitude</label>
                                        <input value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="132.237xxx" className={inputClass + ' text-sm'} />
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600 mt-2"><i className="fas fa-info-circle mr-1"></i>Atau isi manual dari link Google Maps Anda</p>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 border-2 border-blue-900 text-blue-900 font-bold py-4 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                    <i className="fas fa-arrow-left"></i> Kembali
                                </button>
                                <button type="button" onClick={() => setStep(3)} className="flex-1 bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
                                    Lanjut ke Rencana Kegiatan <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === STEP 3: RENCANA KEGIATAN === */}
                    {step === 3 && (
                        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-5">
                            <h2 className="text-xl font-black text-blue-900 mb-6 flex items-center">
                                <i className="fas fa-clipboard-list mr-3 text-yellow-500"></i>
                                Data Rencana Kegiatan
                            </h2>

                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Jenis Kegiatan <span className="text-red-500">*</span></label>
                                    <select required value={form.jenis_kegiatan} onChange={e => set('jenis_kegiatan', e.target.value)} className={inputClass}>
                                        <option value="">-- Pilih Jenis Kegiatan --</option>
                                        {JENIS_KEGIATAN.map(j => <option key={j} value={j}>{j}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>KBLI <span className="text-gray-400 font-normal">(opsional)</span></label>
                                    <input value={form.kbli} onChange={e => set('kbli', e.target.value)} placeholder="Kode KBLI dari OSS" className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Nama Kegiatan <span className="text-red-500">*</span></label>
                                <input required value={form.nama_kegiatan} onChange={e => set('nama_kegiatan', e.target.value)} placeholder="Nama kegiatan yang direncanakan, contoh: Pembangunan Gudang Material" className={inputClass} />
                            </div>

                            <div>
                                <label className={labelClass}>Uraian Rencana Kegiatan <span className="text-red-500">*</span></label>
                                <textarea required value={form.deskripsi_kegiatan} onChange={e => set('deskripsi_kegiatan', e.target.value)} rows={5} placeholder="Jelaskan secara singkat: tujuan pembangunan, kapasitas kegiatan, kebutuhan prasarana, dan informasi relevan lainnya..." className={inputClass}></textarea>
                            </div>

                            {/* Ringkasan */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                                <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                                    <i className="fas fa-exclamation-triangle text-yellow-600"></i>
                                    Dokumen Fisik yang Perlu Disiapkan
                                </h3>
                                <ul className="text-sm text-yellow-800 space-y-1">
                                    <li><i className="fas fa-check mr-2 text-yellow-600"></i>Surat permohonan bermeterai</li>
                                    <li><i className="fas fa-check mr-2 text-yellow-600"></i>Fotokopi KTP / Akta perusahaan</li>
                                    <li><i className="fas fa-check mr-2 text-yellow-600"></i>Bukti kepemilikan / penguasaan lahan</li>
                                    <li><i className="fas fa-check mr-2 text-yellow-600"></i>Peta/polygon lokasi (Google Maps)</li>
                                    {form.jenis_kegiatan && <li><i className="fas fa-check mr-2 text-yellow-600"></i>Site plan / rencana tapak</li>}
                                </ul>
                                <p className="text-xs text-yellow-700 mt-3 font-medium">Dokumen fisik dibawa saat verifikasi di kantor Dinas PUPR Papua Barat Daya.</p>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setStep(2)} className="flex-1 border-2 border-blue-900 text-blue-900 font-bold py-4 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                    <i className="fas fa-arrow-left"></i> Kembali
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                    {isSubmitting ? <><i className="fas fa-circle-notch fa-spin"></i> Mengirim...</> : <><i className="fab fa-whatsapp"></i> Kirim Permohonan</>}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PermohonanKKPR;
