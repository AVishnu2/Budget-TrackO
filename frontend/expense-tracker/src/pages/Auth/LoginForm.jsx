import React, { useContext, useEffect, useState } from "react";
import AuthLayout from "../../components/Layouts/AuthLayout";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from "../../components/Inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import { FcGoogle } from "react-icons/fc";

const LoginForm = () => {
  // State variables to store user input and errors
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // To access URL query parameters (for handling OAuth callback)
  const [searchParams] = useSearchParams();

  // Access global user context to update user data after login
  const { updateUser } = useContext(UserContext);

  // Hook for navigation between routes
  const navigate = useNavigate();

  /**
   * useEffect() — Handles Google OAuth redirect callback.
   * When the user returns from Google authentication, the backend sends
   * a token and user data via query parameters.
   * This effect extracts them, validates, and stores the session locally.
   */
  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');
    
    if (token && user) {
      try {
        // Decode and parse the user object
        const userData = JSON.parse(decodeURIComponent(user));

        // Store JWT token for subsequent API calls
        localStorage.setItem("token", token);

        // Update the global user context
        updateUser(userData);

        // Redirect user to dashboard
        navigate("/dashboard");
      } catch (error) {
        // Handle JSON parsing or decoding errors
        setError("Authentication failed. Please try again.");
      }
    }
  }, [searchParams, updateUser, navigate]);

  /**
   * Redirects the user to the backend’s Google OAuth endpoint.
   * The backend will handle authentication and redirect back to this app.
   */
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/google`;
  };

  /**
   * Handles form-based login submission.
   * Validates inputs, calls the login API, and stores authentication data.
   */
  const handleLogin = async (e) => {
    e.preventDefault();

    // Input validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");

    try {
      // API call to login endpoint with email and password
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, user } = response.data;

      // On success, store token and update user context
      if (token) {
        localStorage.setItem("token", token);
        updateUser(user);
        navigate("/dashboard");
      }
    } catch (error) {
      // Handle server or network errors gracefully
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    // AuthLayout provides consistent layout for login/signup pages
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        {/* Header Section */}
        <h3 className="text-xl font-semibold text-black">Welcome Back</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to log in
        </p>
  
        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="john@example.com"
            type="text"
          />
  
          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Min 8 Characters"
            type="password"
          />
  
          {/* Error message display */}
          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
  
          {/* Submit Button */}
          <button type="submit" className="btn-primary">
            LOGIN
          </button>
        </form>
  
        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
  
        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FcGoogle size={20} />
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </button>
  
        {/* Signup Link */}
        <p className="text-[13px] text-slate-800 mt-3">
          Don't have an account?{" "}
          <Link className="font-medium text-primary underline" to="/signup">
            SignUp
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginForm;
