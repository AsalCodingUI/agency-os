import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export const useLeave = () => {
    const { user, isStakeholder } = useAuthStore();
    const queryClient = useQueryClient();

    // 1. Fetch Leave Requests
    const { data: requests, isLoading: isLoadingRequests } = useQuery({
        queryKey: ['leave_requests', user?.id, isStakeholder],
        queryFn: async () => {
            if (!user?.id) return [];

            let query = supabase
                .from('leave_requests')
                .select(`
                    *,
                    employees (
                        name,
                        avatar_url,
                        role,
                        job_title
                    )
                `)
                .order('created_at', { ascending: false });

            // If NOT stakeholder, only show own requests
            if (!isStakeholder) {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    // 2. Fetch Leave Quota (Mocked for now as it's not in DB explicitly, or we can use profile)
    // Assuming a static quota of 12 for now, or we could add it to employees table.
    // Let's assume 12 days per year.
    const totalQuota = 12;

    // Calculate used quota (Only for the current user, even if admin sees all)
    // We need to filter requests by user.id for quota calculation if we are admin
    const myRequests = requests?.filter(r => r.user_id === user?.id) || [];

    const usedQuota = myRequests.filter(r => r.status === 'APPROVED').reduce((acc, curr) => {
        const start = new Date(curr.start_date);
        const end = new Date(curr.end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return acc + diffDays;
    }, 0) || 0;

    const remainingQuota = totalQuota - usedQuota;

    // 3. Create Request Mutation
    const createRequest = useMutation({
        mutationFn: async (newRequest) => {
            const { data, error } = await supabase
                .from('leave_requests')
                .insert({
                    user_id: user.id,
                    ...newRequest,
                    status: 'PENDING'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['leave_requests']);
        }
    });

    // 4. Update Request Status Mutation (Admin)
    const updateRequestStatus = useMutation({
        mutationFn: async ({ id, status }) => {
            const { data, error } = await supabase
                .from('leave_requests')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['leave_requests']);
        }
    });

    return {
        requests,
        stats: {
            total: totalQuota,
            used: usedQuota,
            remaining: remainingQuota
        },
        isLoading: isLoadingRequests,
        createRequest,
        updateRequestStatus
    };
};
