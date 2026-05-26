import { useAuth } from "./context/AuthContext";
import LoginPage from "./components/LoginPage";
import TaskList from "./components/TaskList";

const App = () => {
  const { user } = useAuth();
  return user ? <TaskList /> : <LoginPage />;
};

export default App;
