import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import UserProvider from "./context/UserContext";
import LandingPage from './components/Landing/LandingPage';
import { Toaster } from "react-hot-toast";
import Home from "./pages/Dashboard/Home";
import Income from "./pages/Dashboard/Income";
import Expense from "./pages/Dashboard/Expense";
import SmartBudget from "./pages/Dashboard/SmartBudget";
import VoiceAssistant from "./pages/Dashboard/VoiceAssistant";
import LoginForm from "./pages/Auth/LoginForm";
import SignUpForm from "./pages/Auth/SignUpForm";
// Add this import and route
import AuthCallback from "./pages/Auth/AuthCallback";


const App = () => {
  return (
    <div>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<Root />} />
            <Route path="/login" exact element={<LoginForm />} />
            <Route path="/signUp" exact element={<SignUpForm />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" exact element={<Home />} />
            <Route path="/income" exact element={<Income />} />
            <Route path="/expense" exact element={<Expense />} />
            <Route path="/smartbudget" exact element={<SmartBudget />} />
            <Route path="/voice-assistant" exact element={<VoiceAssistant />} />
          </Routes>
        </Router>

        <Toaster
          toastOptions={{
            className: "",
            style: {
              fontSize:'13px'
            },
          }}
        />
        
      </UserProvider>
    </div>
  );
};

// Define the Root component to handle the initial redirect
const Root = () => {
  // Check if token exists in localStorage
  const isAuthenticated = !!localStorage.getItem("token");

  // Redirect to dashboard if authenticated, otherwise to login
  return isAuthenticated ? (
    <Navigate to="/dashboard" />
  ) : (
    <Navigate to="/login" />
  );
};

export default App;
