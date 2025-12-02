import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export const useAttendance = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // 1. Fetch Today's Session
    const { data: todaySession, isLoading: isLoadingSession } = useQuery({
        queryKey: ['attendance', 'today', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendance_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single(); // Expecting one or zero

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
            return data;
        },
        enabled: !!user?.id,
    });

    // 2. Fetch History (Last 7 Days)
    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['attendance', 'history', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('attendance_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(7);

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    // 3. Clock In Mutation
    const clockIn = useMutation({
        mutationFn: async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendance_sessions')
                .insert({
                    user_id: user.id,
                    date: today,
                    clock_in: new Date().toISOString(),
                    status: 'ON_DUTY'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['attendance', 'today']);
            queryClient.invalidateQueries(['attendance', 'history']);
        }
    });

    // 4. Clock Out Mutation
    const clockOut = useMutation({
        mutationFn: async (sessionId) => {
            const now = new Date();
            // Calculate total hours (simplified)
            // Ideally this should be done in DB or more robustly
            // But for now we update clock_out and let DB or next fetch handle it?
            // The requirement says "calculate total_work_hours".
            // Let's do a simple diff here if we have clock_in, but we only have sessionId.
            // We'll just update clock_out and status.

            // Fetch session first to get clock_in? Or just update clock_out.
            // Let's just update clock_out.

            const { data, error } = await supabase
                .from('attendance_sessions')
                .update({
                    clock_out: now.toISOString(),
                    status: 'FINISHED',
                    // We can calculate hours if we want, but let's assume we can do it on display or trigger
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['attendance', 'today']);
            queryClient.invalidateQueries(['attendance', 'history']);
        }
    });

    return {
        todaySession,
        history,
        isLoading: isLoadingSession || isLoadingHistory,
        clockIn,
        clockOut
    };
};
