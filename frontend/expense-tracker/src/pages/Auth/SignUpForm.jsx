import React, { useContext, useEffect, useState } from "react";
import AuthLayout from "../../components/Layouts/AuthLayout";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from "../../components/Inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import { FcGoogle } from "react-icons/fc";

const SignUpForm = () => {
  // Form state variables
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Used to read query parameters (e.g., token & user from Google OAuth redirect)
  const [searchParams] = useSearchParams();

  // Access global user context and navigation hook
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  /**
   * useEffect() — Handles Google OAuth callback.
   * When redirected back from Google login, the backend attaches a token and
   * user data to the URL. This effect extracts them, validates, stores locally,
   * and navigates the user to the dashboard.
   */
  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');
    
    if (token && user) {
      try {
        // Decode and parse user info
        const userData = JSON.parse(decodeURIComponent(user));

        // Store JWT token locally
        localStorage.setItem("token", token);

        // Update global user context
        updateUser(userData);

        // Redirect to dashboard
        navigate("/dashboard");
      } catch (error) {
        // If parsing fails, display error
        setError("Authentication failed. Please try again.");
      }
    }
  }, [searchParams, updateUser, navigate]);

  /**
   * handleGoogleSignup() — Initiates Google OAuth flow.
   * Redirects user to the backend’s Google authentication endpoint.
   * After successful login, Google redirects back to this component with credentials.
   */
  const handleGoogleSignup = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/google`;
  };

  /**
   * handleSignup() — Handles form submission for manual sign-up.
   * Validates inputs, makes API request to create a new user,
   * stores authentication data, and navigates to dashboard on success.
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!fullName || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setError(null);

      // Send signup request to backend API
      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        fullName,
        email,
        password,
      });

      if (response.data) {
        // Save token and update user context on successful signup
        localStorage.setItem("token", response.data.token);
        updateUser(response.data.user);

        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Signup error:", error);

      // Handle backend or network errors
      setError(
        error.response?.data?.message ||
        "An error occurred during signup. Please try again."
      );
    }
  };

  return (
    // Wrapper layout for authentication pages (shared design)
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        {/* Page Header */}
        <h3 className="text-xl font-semibold text-black">Create Account</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to sign up
        </p>
  
        {/* Signup Form */}
        <form onSubmit={handleSignup}>
          <Input
            value={fullName}
            onChange={({ target }) => setFullName(target.value)}
            label="Full Name"
            placeholder="John Doe"
            type="text"
          />
  
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
            SIGN UP
          </button>
        </form>
  
        {/* Divider Line with 'or' text */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
  
        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FcGoogle size={20} />
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </button>
  
        {/* Navigation Link to Login */}
        <p className="text-[13px] text-slate-700 mt-3">
          Already have an account?{" "}
          <Link className="font-medium text-primary underline" to="/login">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUpForm;
