const AuthInput = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-health-blue/40 text-sm pointer-events-none" />
    )}
    <input className={`auth-input ${Icon ? "pl-9" : ""} ${className}`} {...props} />
  </div>
);

export default AuthInput;
