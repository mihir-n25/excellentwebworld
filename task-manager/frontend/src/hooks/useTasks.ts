import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { Task } from "../types";

// Fetch tasks with optional status filter
export const useTasks = (status?: string) => {
  return useQuery({
    queryKey: ["tasks", status || "all"],
    queryFn: async () => {
      const params = status && status !== "all" ? { status } : {};
      const res = await api.get<Task[]>("/tasks", { params });
      return res.data;
    },
    staleTime: 1000 * 60, // 1 minute cache
  });
};

// Update task status mutation
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const res = await api.patch(`/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onMutate: async ({ taskId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: ["tasks"] });

      // Optimistically update all task queries
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task._id === taskId ? { ...task, status: status as Task["status"] } : task
        );
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Create task mutation
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: { title: string; assignedTo: string }) => {
      const res = await api.post("/tasks", taskData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch all task queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
