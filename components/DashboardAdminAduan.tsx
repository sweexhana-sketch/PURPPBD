import React, { useState, useEffect, useMemo } from 'react';
import { AduanReport } from '../types';
import { aduanService } from '../services/aduanService';
import { authService } from '../services/authService';

const DashboardAdminAduan: React.FC = () => {
    const [reports, setReports] = useState<AduanReport[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('Semua');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            const role = await authService.getUserRole();
            setUserRole(role);
            
            let defaultFilter = 'Semua';
            
            if (role === 'ADMIN_BINA_MARGA') defaultFilter = 'Jalan';
            else if (role === 'ADMIN_CIPTA_KARYA') defaultFilter = 'Cipta Karya';
            else if (role === 'ADMIN_PERUMAHAN') defaultFilter = 'Perumahan';
            else if (role === 'ADMIN_TATA_RUANG') defaultFilter = 'Tata Ruang';
            
            setFilterCategory(defaultFilter);
            
            try {
                const data = await aduanService.getAduan(role !== 'super_admin' && role !== 'ADUAN_MANAGER' ? defaultFilter : undefined);
                setReports(data);
            } catch (error) {
                console.error("Gagal memuat aduan", error);
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, []);

    const availableTabs = useMemo(() => {
        if (userRole === 'super_admin' || userRole === 'ADUAN_MANAGER') {
            return ['Semua', 'Jalan', 'Cipta Karya', 'Perumahan', 'Tata Ruang'];
        } else if (userRole === 'ADMIN_BINA_MARGA') {
            return ['Jalan'];
        } else if (userRole === 'ADMIN_CIPTA_KARYA') {
            return ['Cipta Karya'];
        } else if (userRole === 'ADMIN_PERUMAHAN') {
            return ['Perumahan'];
        } else if (userRole === 'ADMIN_TATA_RUANG') {
            return ['Tata Ruang'];
        }
        return ['Semua', 'Jalan', 'Cipta Karya', 'Perumahan', 'Tata Ruang'];
    }, [userRole]);

    const updateReportStatus = async (id: string, newStatus: AduanReport['status']) => {
        try {
            await aduanService.updateStatus(id, newStatus);
            setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            alert('Gagal memperbarui status');
        }
    };
	    const filteredReports = useMemo(() => {
        return filterCategory === 'Semua'
            ? reports
            : reports.filter(r => r.kategori === filterCategory);
    }, [reports, filterCategory]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Dashboard Pengaduan Masyarakat</h2>
                    <p className="text-gray-500 mt-1">Kelola laporan masuk dari masyarakat</p>
                </div>
                <div className="flex bg-white shadow-sm p-1 rounded-lg border border-gray-200">
                    {availableTabs.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat as any)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filterCategory === cat ? 'bg-blue-900 text-white shadow' : 'text-gray-500 hover:text-blue-900'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Laporan</p>
                    <p className="text-3xl font-black text-blue-900 mt-2">{filteredReports.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-red-500 text-xs font-bold uppercase tracking-wider">Perlu Tindakan</p>
                    <p className="text-3xl font-black text-red-600 mt-2">{filteredReports.filter(r => r.status === 'Baru').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-yellow-600 text-xs font-bold uppercase tracking-wider">Sedang Diproses</p>
                    <p className="text-3xl font-black text-yellow-600 mt-2">{filteredReports.filter(r => r.status === 'Diproses').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-green-600 text-xs font-bold uppercase tracking-wider">Selesai</p>
                    <p className="text-3xl font-black text-green-600 mt-2">{filteredReports.filter(r => r.status === 'Selesai').length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Memuat laporan...</div>
                ) : (
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">Kategori & Waktu</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">Detail Laporan</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">Lokasi</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                    Tidak ada laporan ditemukan.
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${report.kategori === 'Jalan' ? 'bg-blue-100 text-blue-800' :
                                                report.kategori === 'Tata Ruang' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {report.kategori}
                                        </span>
                                        <div className="text-xs text-gray-500">{report.created_at ? new Date(report.created_at).toLocaleDateString('id-ID') : '-'}</div>
                                        <div className="text-[10px] text-gray-400">{report.created_at ? new Date(report.created_at).toLocaleTimeString('id-ID') : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{report.deskripsi}</p>
                                        {report.image_url && (
                                            <a href={report.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex/items-center">
                                                <i className="fas fa-image mr-1"></i> Lihat Foto
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="text-sm font-medium text-gray-900">{report.lokasi_jalan}</div>
                                        <div className="text-xs text-gray-500">{report.jurisdiction}</div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <select
                                            value={report.status || 'Baru'}
                                            onChange={(e) => updateReportStatus(report.id!, e.target.value as any)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 outline-none cursor-pointer ${report.status === 'Baru' ? 'border-red-200 text-red-700 bg-red-50' :
                                                    report.status === 'Diproses' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                                        report.status === 'Selesai' ? 'border-green-200 text-green-700 bg-green-50' :
                                                            'border-gray-200 text-gray-700 bg-gray-50'
                                              }`}
                                        >
                                            <option value="Baru">Baru</option>
                                            <option value="Diproses">Diproses</option>
                                            <option value="Diteruskan">Diteruskan</option>
                                            <option value="Selesai">Selesai</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )
                    }
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
};

export default DashboardAdminAduan;
