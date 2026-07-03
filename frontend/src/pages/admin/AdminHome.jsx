import api from "../../api/axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaCopy, FaCheck } from "react-icons/fa";
import PageHeader from "../../components/admin/PageHeader";
import { getMaladieLabel } from "../../constants/maladies";
import { getInitials } from "../../utils/getInitials";

const SEVERITY_BADGES = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-100",
  moderate: "bg-amber-50 text-amber-700 border-amber-100",
  high: "bg-orange-50 text-orange-700 border-orange-100",
  critical: "bg-red-50 text-red-700 border-red-100",
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const AdminHome = () => {
  const { user } = useOutletContext();
  const [staff, setStaff] = useState([]);
  const [diseaseClasses, setDiseaseClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const area = user?.area;

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.area) {
        setIsLoading(false);
        return;
      }

      try {
        const [staffRes, classesRes] = await Promise.all([
          api.get("/api/areas/staff"),
          api.get("/api/disease-classes"),
        ]);
        setStaff(staffRes.data.staff);
        setDiseaseClasses(classesRes.data.diseaseClasses);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [user?.area]);

  const copyAreaCode = () => {
    if (!area?.code) return;
    navigator.clipboard.writeText(area.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!area) {
    return (
      <div className="w-full">
        <PageHeader title="Dashboard" description="Manage your clinic area and team" />
        <div className="admin-card p-6 text-center">
          <p className="text-xs text-gray-500">Complete clinic setup to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader title="Dashboard" description={`Overview for ${area.name}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="admin-card px-3 py-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Disease classes</p>
          <p className="text-lg font-semibold text-health-navy">{diseaseClasses.length}</p>
        </div>
        <div className="admin-card px-3 py-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Team members</p>
          <p className="text-lg font-semibold text-health-navy">{staff.length}</p>
        </div>
        <div className="admin-card px-3 py-3 col-span-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Area code to share</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm font-mono font-semibold text-health-blue">{area.code}</code>
            <button
              type="button"
              onClick={copyAreaCode}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-health-blue hover:text-health-navy"
            >
              {copied ? <FaCheck /> : <FaCopy />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs text-gray-400">Loading dashboard...</p>
      ) : (
        <div className="space-y-4">
          <div className="admin-card p-4">
            <h2 className="text-sm font-semibold text-health-navy mb-1">Disease classes</h2>
            <p className="text-[11px] text-gray-500 mb-4">Each class and its maladie</p>

            {diseaseClasses.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No disease classes yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {diseaseClasses.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-stretch gap-0 rounded-lg border border-health-ice bg-health-ice/20 overflow-hidden"
                  >
                    <div className="flex-1 px-3 py-3 border-r border-health-ice/80 min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Class</p>
                      <p className="text-xs font-semibold text-health-navy truncate">{item.name}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-mono font-semibold text-health-blue bg-white/80 px-1.5 py-0.5 rounded">
                        #{item.placeCode}
                      </span>
                      <span
                        className={`inline-block mt-1.5 ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border capitalize ${
                          SEVERITY_BADGES[item.severity] || SEVERITY_BADGES.moderate
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <div className="flex-1 px-3 py-3 bg-white/60 min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Maladie</p>
                      <p className="text-xs font-semibold text-health-navy leading-snug">
                        {getMaladieLabel(item.maladie)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card p-4">
            <h2 className="text-sm font-semibold text-health-navy mb-1">Team members</h2>
            <p className="text-[11px] text-gray-500 mb-4">
              People who joined using your area code
            </p>

            {staff.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No one has joined yet. Share code <strong className="text-health-blue">{area.code}</strong> with nurses.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {staff.map((member) => (
                  <li key={member._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-health-blue flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{member.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{member.email}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Joined {formatDate(member.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] capitalize text-gray-500 bg-gray-100 px-2 py-0.5 rounded block mb-1">
                        {member.role}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          member.isVerified ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {member.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;
