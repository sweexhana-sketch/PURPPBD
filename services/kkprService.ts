import { supabase } from './supabaseService';

export interface PermohonanKKPR {
    id?: string;
    created_at?: string;
    nama_pemohon: string;
    jenis_pemohon: string;
    nib?: string;
    ktp: string;
    npwp?: string;
    telepon: string;
    email?: string;
    kabupaten: string;
    distrik?: string;
    kampung?: string;
    alamat_lokasi: string;
    latitude?: string;
    longitude?: string;
    luas_lahan: string;
    jenis_kegiatan: string;
    nama_kegiatan: string;
    kbli?: string;
    deskripsi_kegiatan: string;
    status?: string;
    catatan_admin?: string;
    source?: string;
}

export const kkprService = {
    getPermohonan: async (): Promise<PermohonanKKPR[]> => {
        const { data, error } = await supabase
            .from('permohonan_kkpr')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    tambahPermohonan: async (permohonan: Omit<PermohonanKKPR, 'id' | 'created_at'>): Promise<PermohonanKKPR | null> => {
        const { data, error } = await supabase
            .from('permohonan_kkpr')
            .insert([{ ...permohonan, status: 'Baru', source: 'Web - Tata Ruang' }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    updateStatus: async (id: string, status: string, catatan?: string): Promise<void> => {
        const { error } = await supabase
            .from('permohonan_kkpr')
            .update({ status, ...(catatan ? { catatan_admin: catatan } : {}) })
            .eq('id', id);
        if (error) throw error;
    }
};
