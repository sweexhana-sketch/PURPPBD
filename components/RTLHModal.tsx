import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

interface RTLHModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RTLHModal: React.FC<RTLHModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nama: '',
    telepon: '',
    email: '',
    lokasi: '',
    uraian: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limit check: 30 seconds cooldown
    const lastSubmit = localStorage.getItem('rtlh_last_submit');
    if (lastSubmit) {
      const timePassed = Date.now() - parseInt(lastSubmit);
      if (timePassed < 30000) {
        const remaining = Math.ceil((30000 - timePassed) / 1000);
        setError(`Mohon tunggu ${remaining} detik sebelum mengirim lagi.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('layanan_permohonan')
        .insert([
          {
            nama: formData.nama,
            telepon: formData.telepon,
            email: formData.email,
            lokasi: formData.lokasi,
            uraian: formData.uraian
          }
        ]);

      if (dbError) throw dbError;

      // Update cooldown
      localStorage.setItem('rtlh_last_submit', Date.now().toString());

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ nama: '', telepon: '', email: '', lokasi: '', uraian: '' });
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Terjadi kesalahan saat mengirim permohonan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <div className="p-8">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            <i className="fas fa-home"></i>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Daftar Bantuan RTLH</h2>
          <p className="text-gray-500 text-sm mb-6">
            Bantuan Rumah Tidak Layak Huni — Kewenangan Provinsi
          </p>

          {success ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center mb-6">
              <i className="fas fa-check-circle text-3xl mb-2"></i>
              <p className="font-bold">Permohonan Berhasil Dikirim!</p>
              <p className="text-sm mt-1">Kami akan segera memproses data Anda.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap / Instansi</label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">No. Telepon / WA</label>
                  <input
                    type="text"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="0812..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  placeholder="email@contoh.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kabupaten / Kota Lokasi</label>
                <select
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                >
                  <option value="">Pilih Lokasi</option>
                  <option value="Kota Sorong">Kota Sorong</option>
                  <option value="Kabupaten Sorong">Kabupaten Sorong</option>
                  <option value="Kabupaten Sorong Selatan">Kabupaten Sorong Selatan</option>
                  <option value="Kabupaten Raja Ampat">Kabupaten Raja Ampat</option>
                  <option value="Kabupaten Tambrauw">Kabupaten Tambrauw</option>
                  <option value="Kabupaten Maybrat">Kabupaten Maybrat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Uraian Permohonan</label>
                <textarea
                  name="uraian"
                  value={formData.uraian}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                  placeholder="Tuliskan detail permohonan Anda..."
                ></textarea>
              </div>

              {error && (
                <div className="text-red-500 text-sm font-medium">{error}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center disabled:opacity-70 mt-2"
              >
                {isSubmitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Kirim Permohonan
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RTLHModal;
