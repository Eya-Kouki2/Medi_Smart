import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaHeartbeat, FaCopy, FaCheck, FaSignOutAlt } from "react-icons/fa";

const navItems = [
  { to: "/admin",                label: "Dashboard",        icon: "📊", end: true  },
  { to: "/admin/patients",       label: "Patients",         icon: "👥"             },
  { to: "/admin/triage",         label: "Smart Triage",     icon: "🩺"             },
  { to: "/admin/pharmacy",       label: "Pharmacy Monitor", icon: "💊"             },
  { to: "/admin/disease-classes",label: "Disease Classes",  icon: "🦠"             },
  { to: "/admin/reports",        label: "Reports",          icon: "📜"             },
  { to: "/admin/profile",        label: "Profile",          icon: "👤"             },
];

const Sidebar = ({ user, onLogout }) => {
  const [copied, setCopied] = useState(false);
  const areaCode = user?.area?.code;

  const copyCode = () => {
    if (!areaCode) return;
    navigator.clipboard.writeText(areaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-30 w-56 h-screen flex flex-col shadow-sidebar"
      style={{ background: "linear-gradient(180deg, #03045e 0%, #023e8a 60%, #0353a4 100%)" }}
    >
      {/* ── Brand ─────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-md">
            <FaHeartbeat className="text-health-cyan text-sm" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">MediSmart Hub</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot shrink-0" />
              <p className="text-[10px] text-blue-200/80 font-medium">Clinical Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Area code badge ────────────────────── */}
      {user?.role === "admin" && areaCode && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-white/10 border border-white/15">
          <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200/70 mb-1">Area Code</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs font-mono font-bold text-health-cyan truncate">{areaCode}</code>
            <button
              type="button"
              onClick={copyCode}
              className="shrink-0 flex items-center gap-1 text-[10px] text-blue-200/80 hover:text-white transition-colors cursor-pointer font-semibold"
            >
              {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* ── Nav group label ────────────────────── */}
      <p className="px-4 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-blue-300/50">Navigation</p>

      {/* ── Nav items ─────────────────────────── */}
      <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/18 text-white shadow-sm border border-white/20"
                  : "text-blue-100/75 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span className="text-[15px] shrink-0 leading-none w-5 text-center" aria-hidden="true">
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Logout ────────────────────────────── */}
      <div className="px-2 py-3 border-t border-white/10">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-blue-100/70 hover:bg-red-500/20 hover:text-red-300 cursor-pointer transition-all duration-150"
        >
          <FaSignOutAlt className="text-[13px] shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
