import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseService';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check session on mount
        const checkAuth = async () => {
            const session = await authService.getSession();
            if (!session) {
                navigate('/admin/login');
                return;
            }
            setUserEmail(session.user.email ?? null);
            setUserRole(session.user.user_metadata?.role ?? 'ADUAN_MANAGER');
            setIsLoading(false);
        };

        checkAuth();

        // Listen for auth state changes (e.g., token expiry)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                navigate('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-blue-900 text-xl font-bold">
                    <i className="fas fa-circle-notch fa-spin mr-3"></i>
                    Memverifikasi sesi...
                </div>
            </div>
        );
    }

    const isActive = (path: string) => location.pathname.includes(path);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-blue-900 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 border-b border-blue-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-blue-900 font-bold text-xl shadow-lg">
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Admin Portal</h1>
                            <p className="text-xs text-blue-300">PUPR Papua Barat Daya</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-xs text-blue-400 uppercase font-bold tracking-wider mb-2">Menu Utama</p>
                        <nav className="space-y-2">
                            {(['ADUAN_MANAGER', 'super_admin', 'ADMIN_BINA_MARGA', 'ADMIN_CIPTA_KARYA', 'ADMIN_PERUMAHAN', 'ADMIN_TATA_RUANG'].includes(userRole || '')) && (
                                <button
                                    onClick={() => navigate('/admin/aduan')}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${isActive('aduan')
                                        ? 'bg-blue-800 text-white shadow-lg border-l-4 border-yellow-500'
                                        : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                                        }`}
                                >
                                    <i className="fas fa-clipboard-list w-6"></i>
                                    <span className="font-medium">Pengaduan</span>
                                </button>
                            )}

                            {(userRole === 'NEWS_MANAGER' || userRole === 'super_admin') && (
                                <button
                                    onClick={() => navigate('/admin/berita')}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${isActive('berita')
                                        ? 'bg-blue-800 text-white shadow-lg border-l-4 border-yellow-500'
                                        : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                                        }`}
                                >
                                    <i className="fas fa-newspaper w-6"></i>
                                    <span className="font-medium">Berita & Artikel</span>
                                </button>
                            )}
                        </nav>
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-blue-800">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
                            <i className="fas fa-user"></i>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{userEmail}</p>
                            <p className="text-xs text-blue-400 truncate">{userRole?.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={authService.logout}
                        className="w-full bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full mt-2 text-center text-xs text-blue-400 hover:text-white transition-colors"
                    >
                        Ke Website Utama
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm sticky top-0 z-10 md:hidden">
                    <div className="px-4 py-4 flex justify-between items-center">
                        <div className="font-bold text-blue-900">Admin Portal</div>
                        <button onClick={authService.logout} className="text-red-500">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </header>
                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
