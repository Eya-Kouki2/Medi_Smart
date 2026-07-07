import brandLogo from "../../assets/logo11.png";

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen relative flex justify-center px-4 py-6 sm:py-10 bg-gradient-to-br from-health-ice/40 via-white to-health-sky/20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-health-cyan/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-health-blue/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px] my-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-health-ice shadow-[0_8px_30px_-10px_rgba(0,119,182,0.18)] ring-1 ring-white">
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-health-navy via-health-blue to-health-cyan" />

          <div className="px-5 sm:px-6 pt-6 pb-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-3">
                <div className="absolute inset-0 rounded-full bg-health-cyan/30 blur-md scale-110" />
                <div className="relative w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md shadow-health-blue/20 ring-4 ring-health-ice/60 overflow-hidden p-1">
                  <img src={brandLogo} alt="Trackare Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-health-blue/50">
                Trackare
              </p>
              {title && <h1 className="text-xl font-bold text-health-navy mt-1">{title}</h1>}
              {subtitle && <p className="text-xs text-gray-500 mt-1.5">{subtitle}</p>}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
