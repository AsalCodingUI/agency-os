import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export const usePayroll = () => {
    const { user } = useAuthStore();

    const { data: payrolls, isLoading } = useQuery({
        queryKey: ['payroll', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('payroll')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    return {
        payrolls,
        isLoading
    };
};
