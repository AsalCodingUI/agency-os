import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"

export function useEmployees() {
    const queryClient = useQueryClient()

    // 1. FETCH: Ambil semua data karyawan
    const { data: employees = [], isLoading, error } = useQuery({
        queryKey: ["employees"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("employees")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            return data
        },
    })

    // 2. ADD: Tambah karyawan baru
    const addEmployee = useMutation({
        mutationFn: async (newEmployee) => {
            const { data, error } = await supabase.from("employees").insert([newEmployee]).select()
            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["employees"]) // Refresh data otomatis
        },
    })

    // 3. UPDATE: Edit data karyawan
    const updateEmployee = useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase
                .from("employees")
                .update(updates)
                .eq("id", id)
                .select()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["employees"])
        },
    })

    // 4. DELETE: Hapus karyawan
    const deleteEmployee = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from("employees").delete().eq("id", id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["employees"])
        },
    })

    return {
        employees,
        isLoading,
        error,
        addEmployee,
        updateEmployee,
        deleteEmployee,
    }
}