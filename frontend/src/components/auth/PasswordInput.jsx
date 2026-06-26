import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Password",
  className = "",
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-health-blue/40 text-sm pointer-events-none" />
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        className={`auth-input pl-9 pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-health-blue transition-colors cursor-pointer text-sm"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};

export default PasswordInput;
