export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface Task {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}
