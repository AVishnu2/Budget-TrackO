import React, { useState } from "react"; // Import React and useState hook
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6"; // Import eye icons for password visibility toggle

// Reusable Input component
// Props:
// - label: label text above the input
// - value: current input value
// - onChange: function to handle value change
// - placeholder: placeholder text
// - type: input type (e.g., text, password)
const Input = ({ label, value, onChange, placeholder, type }) => {
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  // Function to toggle show/hide password
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      {/* Label for input */}
      <label className="text-[13px] text-slate-800">{label}</label>

      <div className="input-box">
        {/* Input field */}
        <input
          // Change input type if it's password and toggle show/hide
          type={type == 'password' ? showPassword ? 'text' : 'password' : type}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
          value={value}
          onChange={(e) => onChange(e)} // Pass event to parent handler
        />

        {/* Show eye icon only for password fields */}
        {type === "password" && (
          <>
            {showPassword ? (
              // Show "eye" icon when password is visible
              <FaRegEye
                size={22}
                className="text-primary cursor-pointer"
                onClick={() => toggleShowPassword()}
              />
            ) : (
              // Show "eye slash" icon when password is hidden
              <FaRegEyeSlash
                size={22}
                className="text-slate-400 cursor-pointer"
                onClick={() => toggleShowPassword()}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Input; // Export component for use in forms
