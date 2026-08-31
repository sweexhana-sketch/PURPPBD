import { supabase } from './supabaseService';
import { AduanReport } from '../types';

export const aduanService = {
    getAduan: async (kategori?: string): Promise<AduanReport[]> => {
        let query = supabase.from('aduan_masyarakat').select('*').order('created_at', { ascending: false });
        
        if (kategori && kategori !== 'Semua') {
            query = query.eq('kategori', kategori);
        }

        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching aduan:', error);
            throw error;
        }
        return data || [];
    },

    tambahAduan: async (laporan: Omit<AduanReport, 'id' | 'created_at'>): Promise<AduanReport | null> => {
        const { data, error } = await supabase
            .from('aduan_masyarakat')
            .insert([laporan])
            .select()
            .single();

        if (error) {
            console.error('Error insert aduan:', error);
            throw error;
        }
        
        return data;
    },

    updateStatus: async (id: string, status: AduanReport['status']): Promise<void> => {
        const { error } = await supabase
            .from('aduan_masyarakat')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    }
};
