import React, { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../../context/UserContext";

const AuthCallback = () => {
  // Hook to access URL query parameters (e.g., token, user, error)
  const [searchParams] = useSearchParams();

  // Extract updateUser function from UserContext to update global user state
  const { updateUser } = useContext(UserContext);

  // React Router hook to programmatically navigate between routes
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve query parameters from the callback URL
    const token = searchParams.get('token');
    const user = searchParams.get('user');
    const error = searchParams.get('error');

    // If authentication failed, redirect to login with an error message
    if (error) {
      navigate('/login?error=authentication_failed');
      return;
    }

    // If both token and user data exist, attempt to parse and store them
    if (token && user) {
      try {
        // Decode and parse the user data from URL
        const userData = JSON.parse(decodeURIComponent(user));

        // Store authentication token locally for API requests
        localStorage.setItem("token", token);

        // Update global user context
        updateUser(userData);

        // Redirect to dashboard after successful authentication
        navigate("/dashboard");
      } catch (error) {
        // Handle JSON parsing or decoding errors
        console.error('Error parsing user data:', error);
        navigate('/login?error=parsing_failed');
      }
    } else {
      // Missing token or user information — redirect to login
      navigate('/login?error=missing_data');
    }
  }, [searchParams, updateUser, navigate]);

  return (
    // Display a simple loading indicator while processing authentication
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
