import { useOutletContext } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import { getInitials } from "../../utils/getInitials";

const Profile = () => {
  const { user } = useOutletContext();

  const rows = [
    { label: "Name", value: user?.name },
    { label: "Email", value: user?.email },
    { label: "Role", value: user?.role },
    { label: "Area", value: user?.area?.name || "—" },
  ];

  return (
    <div className="max-w-md">
      <PageHeader title="My Profile" />

      <div className="admin-card p-4">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-health-blue flex items-center justify-center text-white text-xs font-semibold">
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-health-navy">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        <dl className="space-y-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs py-1">
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-gray-800 font-medium capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default Profile;
