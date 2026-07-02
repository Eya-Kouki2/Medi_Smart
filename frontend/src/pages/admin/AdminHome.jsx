import api from "../../api/axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import { getInitials } from "../../utils/getInitials";

const AdminHome = () => {
  const { user } = useOutletContext();
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staffRes = await api.get("/api/areas/staff");
        setStaff(staffRes.data.staff);
      } catch (error) {
        console.error("Failed to load staff", error);
      }
    };

    if (user?.area) {
      loadStaff();
    }
  }, [user]);

  const area = user?.area;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Dashboard" description="Manage your clinic area and team" />

      {area && (
        <div className="flex gap-3 mb-4 text-xs">
          <div className="admin-card px-3 py-2 flex-1">
            <span className="text-gray-500">Nurses</span>
            <p className="font-semibold text-health-navy">
              {staff.filter((s) => s.role === "nurses" || s.role === "triage" || s.role === "pharmacy").length}
            </p>
          </div>
        </div>
      )}

      <div className="admin-card p-4">
        {area && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-sm font-semibold text-health-navy">{area.name}</h2>
              {area.address && <p className="text-xs text-gray-500 mt-0.5">{area.address}</p>}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Staff</h3>
              {staff.length === 0 ? (
                <p className="text-xs text-gray-400">No staff yet. Share your area code to invite nurses.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {staff.map((member) => (
                    <li key={member._id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-health-blue flex items-center justify-center text-white text-[9px] font-semibold">
                          {getInitials(member.name)}
                        </div>
                        <span className="text-xs text-gray-800">{member.name}</span>
                      </div>
                      <span className="text-[10px] capitalize text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {member.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
