import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket/socket";
import { Task } from "../types";
import CreateTaskModal from "./CreateTaskModal";
import Notification from "./Notification";
import { useTasks, useUpdateTaskStatus } from "../hooks/useTasks";

const STATUS_OPTIONS = ["todo", "in-progress", "done"] as const;

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  todo: { 
    bg: "bg-neutral-100", 
    text: "text-neutral-700",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  },
  "in-progress": { 
    bg: "bg-warning-100", 
    text: "text-warning-700",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
  },
  done: { 
    bg: "bg-success-100", 
    text: "text-success-700",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
  },
};

const TaskList = () => {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // React Query hooks
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading: loading } = useTasks(filter);
  const updateTaskStatusMutation = useUpdateTaskStatus();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAssigned = (task: Task) => {
      setNotification(`New task assigned: "${task.title}"`);
      // Invalidate queries to refetch and show new task
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    };

    socket.on("task:assigned", handleAssigned);

    return () => {
      socket.off("task:assigned", handleAssigned);
    };
  }, [queryClient]);

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  };

  // Optimized: Single pass to calculate stats instead of multiple filter calls
  const taskStats = useMemo(() => {
    let todo = 0, inProgress = 0, done = 0;
    
    for (const t of tasks) {
      if (t.status === "todo") todo++;
      else if (t.status === "in-progress") inProgress++;
      else if (t.status === "done") done++;
    }
    
    return {
      total: tasks.length,
      todo,
      inProgress,
      done,
    };
  }, [tasks]);

  // When using server-side filtering, no need to filter again client-side
  const filteredTasks = tasks;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-soft sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-medium">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900">Task Manager</h1>
                <p className="text-xs text-neutral-500">
                  {user?.name} <span className="text-neutral-300">•</span>{" "}
                  <span className={`capitalize font-medium ${user?.role === 'admin' ? 'text-primary-600' : 'text-secondary-600'}`}>
                    {user?.role}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {user?.role === "admin" && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">New Task</span>
                </button>
              )}
              <button
                onClick={logout}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 hover:shadow-medium transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-1">Total Tasks</p>
                <p className="text-2xl font-bold text-neutral-900">{taskStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-5 hover:shadow-medium transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-1">To Do</p>
                <p className="text-2xl font-bold text-neutral-900">{taskStats.todo}</p>
              </div>
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-5 hover:shadow-medium transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-neutral-900">{taskStats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-5 hover:shadow-medium transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-neutral-900">{taskStats.done}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card p-2 mb-6 inline-flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary-600 text-white shadow-soft"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilter("todo")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "todo"
                ? "bg-primary-600 text-white shadow-soft"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            To Do
          </button>
          <button
            onClick={() => setFilter("in-progress")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "in-progress"
                ? "bg-primary-600 text-white shadow-soft"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter("done")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "done"
                ? "bg-primary-600 text-white shadow-soft"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Done
          </button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-primary-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-neutral-600 font-medium">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No tasks found</h3>
            <p className="text-neutral-600">
              {filter === "all" 
                ? "Get started by creating your first task" 
                : `No tasks with status "${filter}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const config = statusConfig[task.status];
              return (
                <div
                  key={task._id}
                  className="card p-5 hover:shadow-medium transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <svg className={`w-5 h-5 ${config.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                      </svg>
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{task.assignedTo?.name}</span>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`badge ${config.bg} ${config.text} capitalize`}>
                        {task.status}
                      </span>

                      {user?.role === "user" && task.assignedTo?._id === user.id && (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          className="input-field text-sm py-2 px-3 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
};

export default TaskList;
