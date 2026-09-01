import React, { useState, useEffect } from 'react';
import { PermohonanKKPR, kkprService } from '../services/kkprService';

const DashboardKKPR: React.FC = () => {
    const [permohonan, setPermohonan] = useState<PermohonanKKPR[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await kkprService.getPermohonan();
            setPermohonan(data);
        } catch (error) {
            console.error("Gagal memuat permohonan KKPR", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await kkprService.updateStatus(id, newStatus);
            setPermohonan(permohonan.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } catch (error) {
            alert('Gagal memperbarui status');
        }
    };

    if (isLoading) return <div className="text-center py-10"><i className="fas fa-spinner fa-spin text-3xl text-blue-900"></i><p className="mt-2 text-gray-500">Memuat data KKPR...</p></div>;

    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Permohonan</p>
                    <p className="text-3xl font-black text-blue-900 mt-2">{permohonan.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-yellow-600 text-xs font-bold uppercase tracking-wider">Menunggu Diproses</p>
                    <p className="text-3xl font-black text-yellow-600 mt-2">{permohonan.filter(p => p.status === 'Baru').length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-green-600 text-xs font-bold uppercase tracking-wider">Selesai</p>
                    <p className="text-3xl font-black text-green-600 mt-2">{permohonan.filter(p => p.status === 'Selesai').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Tanggal</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Pemohon</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rencana Kegiatan</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Lokasi</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {permohonan.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">Belum ada permohonan KKPR</td>
                                </tr>
                            ) : (
                                permohonan.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="font-bold text-gray-900">{p.nama_pemohon}</div>
                                            <div className="text-xs">{p.jenis_pemohon}</div>
                                            <div className="text-xs text-blue-600"><i className="fab fa-whatsapp"></i> {p.telepon}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="font-bold">{p.jenis_kegiatan}</div>
                                            <div className="text-xs truncate max-w-[200px]">{p.nama_kegiatan}</div>
                                            <div className="text-xs text-gray-500">Luas: {p.luas_lahan}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="font-medium truncate max-w-[200px]">{p.alamat_lokasi}</div>
                                            <div className="text-xs">{p.kabupaten} {p.distrik && `- ${p.distrik}`}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${p.status === 'Baru' ? 'bg-red-100 text-red-800' : p.status === 'Diproses' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                {p.status || 'Baru'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <select
                                                value={p.status || 'Baru'}
                                                onChange={(e) => updateStatus(p.id!, e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                            >
                                                <option value="Baru">Baru</option>
                                                <option value="Diproses">Diproses</option>
                                                <option value="Selesai">Selesai</option>
                                                <option value="Ditolak">Ditolak</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardKKPR;
