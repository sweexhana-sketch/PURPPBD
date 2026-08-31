import { supabase } from './supabaseService';

export const authService = {
    login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data.user;
    },

    logout: async () => {
        await supabase.auth.signOut();
        window.location.href = '/admin/login';
    },

    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    isAuthenticated: async (): Promise<boolean> => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    // Get user role from user_metadata
    getUserRole: async (): Promise<string | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.user_metadata?.role ?? null;
    }
};
