import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket/socket";
import { Task } from "../types";
import CreateTaskModal from "./CreateTaskModal";
import Notification from "./Notification";

const STATUS_OPTIONS = ["todo", "in-progress", "done"] as const;

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  "in-progress": "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};

const TaskList = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get<Task[]>("/tasks");
      setTasks(res.data);
    } catch {
      console.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAssigned = (task: Task) => {
      setNotification(`New task assigned: "${task.title}"`);
      fetchTasks();
    };

    socket.on("task:assigned", handleAssigned);

    return () => {
      socket.off("task:assigned", handleAssigned);
    };
  }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, status: newStatus as Task["status"] }
            : t
        )
      );
    } catch {
      console.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {user?.name} &middot;{" "}
            <span className="capitalize font-medium text-blue-600">
              {user?.role}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + New Task
            </button>
          )}
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No tasks found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Assigned to:{" "}
                    <span className="text-gray-600">
                      {task.assignedTo?.name}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[task.status]}`}
                  >
                    {task.status}
                  </span>

                  {user?.role === "user" &&
                    task.assignedTo?._id === user.id && (
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
};

export default TaskList;
