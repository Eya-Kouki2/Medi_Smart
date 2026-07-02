import api from "../../api/axios";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import { getInitials } from "../../utils/getInitials";

const formatLastLogin = (date) => {
  if (!date) return "Never";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isWithinDays = (date, days) => {
  if (!date) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= days * 24 * 60 * 60 * 1000;
};

const Analytics = () => {
  const { user } = useOutletContext();
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      if (!user?.area) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get("/api/areas/staff");
        setStaff(response.data.staff);
      } catch (error) {
        console.error("Failed to load analytics data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStaff();
  }, [user?.area]);

  const stats = useMemo(() => {
    const verified = staff.filter((s) => s.isVerified).length;
    const pending = staff.length - verified;
    const activeWeek = staff.filter((s) => isWithinDays(s.lastLogin, 7)).length;
    const activeToday = staff.filter((s) => isWithinDays(s.lastLogin, 1)).length;

    const byRole = staff.reduce((acc, member) => {
      const role = member.role || "unknown";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const maxRoleCount = Math.max(...Object.values(byRole), 1);

    return { verified, pending, activeWeek, activeToday, byRole, maxRoleCount };
  }, [staff]);

  if (!user?.area) {
    return (
      <div>
        <PageHeader title="Analytics" description="Insights for your clinic area" />
        <div className="admin-card p-6 text-center">
          <p className="text-xs text-gray-500">Complete clinic setup to view analytics.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" description="Insights for your clinic area" />
        <p className="text-xs text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total staff", value: staff.length, hint: "Nurses in your area" },
    { label: "Verified", value: stats.verified, hint: "Email confirmed" },
    { label: "Pending", value: stats.pending, hint: "Awaiting verification" },
    { label: "Active (7d)", value: stats.activeWeek, hint: `${stats.activeToday} today` },
  ];

  return (
    <div className="max-w-4xl">
      <PageHeader title="Analytics" description={`Overview for ${user.area.name}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {statCards.map((card) => (
          <div key={card.label} className="admin-card px-3 py-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className="text-xl font-semibold text-health-navy mt-1">{card.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="admin-card p-4">
          <h2 className="text-xs font-semibold text-gray-700 mb-3">Staff by role</h2>
          {staff.length === 0 ? (
            <p className="text-xs text-gray-400">No staff data yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {Object.entries(stats.byRole).map(([role, count]) => (
                <li key={role}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="capitalize text-gray-600">{role}</span>
                    <span className="font-medium text-health-navy">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-health-blue to-health-cyan rounded-full transition-all"
                      style={{ width: `${(count / stats.maxRoleCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-card p-4">
          <h2 className="text-xs font-semibold text-gray-700 mb-3">Verification status</h2>
          <div className="flex items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-full shrink-0"
              style={{
                background: `conic-gradient(#00b4d8 ${(stats.verified / Math.max(staff.length, 1)) * 360}deg, #e5e7eb 0deg)`,
              }}
            >
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-health-navy">
                  {staff.length ? Math.round((stats.verified / staff.length) * 100) : 0}%
                </span>
              </div>
            </div>
            <ul className="text-xs space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-health-blue" />
                <span className="text-gray-600">Verified — {stats.verified}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-600">Pending — {stats.pending}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="admin-card p-4 mt-4">
        <h2 className="text-xs font-semibold text-gray-700 mb-3">Staff activity</h2>
        {staff.length === 0 ? (
          <p className="text-xs text-gray-400">Share your area code to onboard nurses.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {staff.map((member) => (
              <li key={member._id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-health-blue flex items-center justify-center text-white text-[9px] font-semibold shrink-0">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-800 truncate">{member.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{member.role}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      member.isVerified ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {member.isVerified ? "Verified" : "Pending"}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">{formatLastLogin(member.lastLogin)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Analytics;
