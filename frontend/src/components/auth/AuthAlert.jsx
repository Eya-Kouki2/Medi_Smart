const AuthAlert = ({ type = "error", children }) => {
  const styles = {
    error: "bg-red-50 text-red-600 border-red-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs border ${styles[type]}`}>
      {children}
    </div>
  );
};

export default AuthAlert;
