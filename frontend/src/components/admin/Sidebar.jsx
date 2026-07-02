import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineUserAdd,
  HiOutlineClipboardList,
  HiOutlineBeaker,
  HiOutlineChartBar,
  HiOutlineDocumentReport,
  HiOutlineDocumentText,
  HiOutlineCog,
  HiOutlineLogout,
} from "react-icons/hi";
import { FaHeartbeat, FaCopy, FaCheck } from "react-icons/fa";

const navSections = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: HiOutlineViewGrid, end: true }],
  },
  {
    label: "Clinical",
    items: [
      { to: "/admin/patients", label: "Patients", icon: HiOutlineUserAdd },
      { to: "/admin/triage", label: "Triage", icon: HiOutlineClipboardList },
      { to: "/admin/pharmacy", label: "Pharmacy", icon: HiOutlineBeaker },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: HiOutlineChartBar },
      { to: "/admin/reports", label: "Reports", icon: HiOutlineDocumentReport },
      { to: "/admin/audit-log", label: "Audit Log", icon: HiOutlineDocumentText },
    ],
  },
  {
    label: "System",
    items: [{ to: "/admin/settings", label: "Settings", icon: HiOutlineCog }],
  },
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
    <aside className="fixed left-0 top-0 z-30 w-56 h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-health-blue flex items-center justify-center shrink-0">
            <FaHeartbeat className="text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">MediSmart Hub</p>
            <p className="text-[11px] text-gray-400">Clinical platform</p>
          </div>
        </div>
      </div>

      {user?.role === "admin" && areaCode && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-health-ice/60 border border-health-ice">
          <p className="text-[10px] text-gray-500 mb-1">Area code</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs font-mono font-semibold text-health-blue truncate">{areaCode}</code>
            <button
              type="button"
              onClick={copyCode}
              className="shrink-0 flex items-center gap-1 text-[10px] text-health-blue hover:text-health-navy cursor-pointer font-medium"
            >
              {copied ? <FaCheck /> : <FaCopy />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3 last:mb-0">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      isActive
                        ? "bg-health-ice text-health-navy font-semibold"
                        : "text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <Icon className="text-lg shrink-0 stroke-[1.5]" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors"
        >
          <HiOutlineLogout className="text-lg shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
