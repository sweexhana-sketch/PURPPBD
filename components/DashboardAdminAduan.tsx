import React, { useState, useEffect, useMemo } from 'react';
import { AduanReport } from '../types';
import { aduanService } from '../services/aduanService';
import { authService } from '../services/authService';
import DashboardKKPR from './DashboardKKPR';

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
            else if (role === 'ADMIN_SDA') defaultFilter = 'Sumber Daya Air';
            
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
            return ['Semua', 'Jalan', 'Cipta Karya', 'Sumber Daya Air', 'Perumahan', 'Tata Ruang', 'Permohonan KKPR'];
        } else if (userRole === 'ADMIN_BINA_MARGA') {
            return ['Jalan'];
        } else if (userRole === 'ADMIN_CIPTA_KARYA') {
            return ['Cipta Karya'];
        } else if (userRole === 'ADMIN_PERUMAHAN') {
            return ['Perumahan'];
        } else if (userRole === 'ADMIN_TATA_RUANG') {
            return ['Tata Ruang', 'Permohonan KKPR'];
        } else if (userRole === 'ADMIN_SDA') {
            return ['Sumber Daya Air'];
        }
        return ['Semua', 'Jalan', 'Cipta Karya', 'Sumber Daya Air', 'Perumahan', 'Tata Ruang'];
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

            {filterCategory === 'Permohonan KKPR' ? (
                <DashboardKKPR />
            ) : (
                <>
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
                            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                                <tr>
                                    <th className="p-4 font-semibold">Tanggal</th>
                                    <th className="p-4 font-semibold">Pelapor</th>
                                    <th className="p-4 font-semibold">Kategori</th>
                                    <th className="p-4 font-semibold">Detail Laporan</th>
                                    <th className="p-4 font-semibold">Lokasi</th>
                                    <th className="p-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            Tidak ada laporan ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map(report => (
                                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(report.created_at!).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{report.nama_pelapor}</div>
                                                <div className="text-sm text-blue-600">{report.no_hp}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                                                    {report.kategori}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-600 line-clamp-2 max-w-xs" title={report.deskripsi}>
                                                    {report.deskripsi}
                                                </p>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate">
                                                {report.lokasi_kejadian || '-'}
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={report.status}
                                                    onChange={(e) => updateReportStatus(report.id!, e.target.value as any)}
                                                    className={`text-sm font-bold rounded-lg border-2 px-3 py-2 outline-none transition-colors
                                                        ${report.status === 'Baru' ? 'bg-red-50 text-red-600 border-red-200' :
                                                            report.status === 'Diproses' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                                'bg-green-50 text-green-600 border-green-200'
                                                        }`}
                                                >
                                                    <option value="Baru" className="text-gray-900 bg-white">Baru</option>
                                                    <option value="Diproses" className="text-gray-900 bg-white">Diproses</option>
                                                    <option value="Selesai" className="text-gray-900 bg-white">Selesai</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardAdminAduan;
