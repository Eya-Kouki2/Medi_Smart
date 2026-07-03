import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaCamera, FaEnvelope, FaUser, FaMapMarkerAlt, FaIdBadge } from "react-icons/fa";
import api from "../../api/axios";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import PageHeader from "../../components/admin/PageHeader";
import { getInitials } from "../../utils/getInitials";

const roleLabels = {
  admin: "Administrator",
  nurses: "Nurse",
  triage: "Triage",
  pharmacy: "Pharmacy",
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Profile = () => {
  const { user, refreshUser } = useOutletContext();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const avatarUrl = previewUrl || user?.profilePicture;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose a valid image file." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be smaller than 5 MB." });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setMessage(null);
    setIsUploading(true);

    try {
      const uploaded = await uploadToCloudinary(file);

      await api.post("/api/auth/profile-picture", uploaded);

      await refreshUser();
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      setMessage({ type: "success", text: "Profile picture updated." });
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload profile picture.",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDeletePicture = async () => {
    if (!user?.profilePicture) return;

    setMessage(null);
    setIsDeleting(true);

    try {
      await api.delete("/api/auth/profile-picture");
      setPreviewUrl(null);
      await refreshUser();
      setMessage({ type: "success", text: "Profile picture removed from your account." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete profile picture.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isUploading || isDeleting;
  const hasProfilePicture = Boolean(user?.profilePicture || previewUrl);

  const infoCards = [
    {
      label: "Full name",
      value: user?.name,
      icon: FaUser,
    },
    {
      label: "Email address",
      value: user?.email,
      icon: FaEnvelope,
    },
    {
      label: "Role",
      value: roleLabels[user?.role] || user?.role,
      icon: FaIdBadge,
    },
    {
      label: "Clinic area",
      value: user?.area?.name || "—",
      icon: FaMapMarkerAlt,
    },
  ];

  return (
    <div className="w-full">
      <PageHeader title="My Profile" description="Manage your account details and photo" />

      <div className="admin-card overflow-hidden w-full">
        <div className="relative h-32 bg-gradient-to-r from-health-navy via-health-blue to-health-cyan">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_55%)]" />
        </div>

        <div className="px-6 sm:px-8 pb-6 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg bg-health-ice flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-health-blue">{getInitials(user?.name)}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-health-blue text-white shadow-md flex items-center justify-center hover:bg-health-navy transition-colors disabled:opacity-60"
                aria-label="Change profile picture"
              >
                <FaCamera className="text-sm" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 pb-1">
              <h2 className="text-lg font-semibold text-health-navy">{user?.name}</h2>
              <p className="text-sm text-gray-500 capitalize">{roleLabels[user?.role] || user?.role}</p>
              {user?.area?.code && (
                <span className="inline-block mt-2 text-[11px] font-mono font-semibold text-health-blue bg-health-ice/70 px-2.5 py-1 rounded-md">
                  {user.area.code}
                </span>
              )}
            </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:pb-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-health-blue to-health-cyan text-white hover:from-health-navy hover:to-health-blue transition-all disabled:opacity-60"
              >
                {isUploading ? "Uploading..." : "Upload photo"}
              </button>
              {hasProfilePicture && (
                <button
                  type="button"
                  onClick={handleDeletePicture}
                  disabled={isBusy}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {isDeleting ? "Removing..." : "Remove photo"}
                </button>
              )}
              <p className="text-[11px] text-gray-400">JPG, PNG or WebP · Max 5 MB</p>
            </div>
          </div>

          {message && (
            <p
              className={`mt-3 text-xs font-medium ${
                message.type === "success" ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4 w-full">
        {infoCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-health-ice/80 flex items-center justify-center shrink-0">
                <Icon className="text-health-blue text-sm" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-health-navy mt-1 break-words capitalize">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card p-4 sm:p-6 mt-4 w-full">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Member since</p>
            <p className="text-sm font-semibold text-health-navy mt-1">{formatDate(user?.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Last login</p>
            <p className="text-sm font-semibold text-health-navy mt-1">{formatDate(user?.lastLogin)}</p>
          </div>
        </div>
        {user?.area?.address && (
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
            {user.area.address}
          </p>
        )}
      </div>
    </div>
  );
};

export default Profile;
