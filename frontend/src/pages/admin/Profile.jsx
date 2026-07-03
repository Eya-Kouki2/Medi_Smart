import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaCamera, FaEnvelope, FaUser, FaMapMarkerAlt, FaIdBadge, FaEdit } from "react-icons/fa";
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
  return new Date(date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
};

const Profile = () => {
  const { user, refreshUser } = useOutletContext();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const avatarUrl = previewUrl || user?.profilePicture;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage({ type: "error", text: "Please choose a valid image file." }); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: "error", text: "Image must be smaller than 5 MB." }); return; }
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview); setMessage(null); setIsUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      await api.post("/api/auth/profile-picture", uploaded);
      await refreshUser();
      URL.revokeObjectURL(localPreview); setPreviewUrl(null);
      setMessage({ type: "success", text: "Profile picture updated." });
    } catch (error) {
      URL.revokeObjectURL(localPreview); setPreviewUrl(null);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to upload profile picture." });
    } finally { setIsUploading(false); event.target.value = ""; }
  };

  const handleDeletePicture = async () => {
    if (!user?.profilePicture) return;
    setMessage(null); setIsDeleting(true);
    try {
      await api.delete("/api/auth/profile-picture");
      setPreviewUrl(null); await refreshUser();
      setMessage({ type: "success", text: "Profile picture removed." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to delete profile picture." });
    } finally { setIsDeleting(false); }
  };

  const startEdit = () => { setEditForm({ name: user?.name || "", email: user?.email || "" }); setIsEditingDetails(true); setMessage(null); };
  const cancelEdit = () => { setIsEditingDetails(false); setMessage(null); };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) { setMessage({ type: "error", text: "Name and email are required." }); return; }
    setIsSavingDetails(true); setMessage(null);
    try {
      const response = await api.put("/api/auth/profile", editForm);
      await refreshUser(); setIsEditingDetails(false);
      setMessage({ type: "success", text: response.data.message || "Profile updated." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile." });
    } finally { setIsSavingDetails(false); }
  };

  const isBusy = isUploading || isDeleting || isSavingDetails;
  const hasProfilePicture = Boolean(user?.profilePicture || previewUrl);

  const infoCards = [
    { label: "Full Name",     value: user?.name,                              icon: FaUser,        accent: "bg-blue-50   text-health-blue" },
    { label: "Email Address", value: user?.email,                             icon: FaEnvelope,    accent: "bg-cyan-50   text-health-cyan" },
    { label: "Role",          value: roleLabels[user?.role] || user?.role,    icon: FaIdBadge,     accent: "bg-violet-50 text-violet-600" },
    { label: "Clinic Area",   value: user?.area?.name || "—",                 icon: FaMapMarkerAlt,accent: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="w-full animate-fade-in">
      <PageHeader title="My Profile" description="Manage your account details and photo" />

      {/* ── Hero card ── */}
      <div className="admin-card overflow-hidden w-full mb-5">
        {/* Banner */}
        <div className="relative h-36" style={{ background: "linear-gradient(135deg, #03045e 0%, #0077b6 50%, #00b4d8 100%)" }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 55%)" }} />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px)" }} />
        </div>

        <div className="px-6 sm:px-8 pb-6 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl bg-health-ice flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-health-blue">{getInitials(user?.name)}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-health-blue text-white shadow-lg border-2 border-white flex items-center justify-center hover:bg-health-navy transition-colors disabled:opacity-60"
                  aria-label="Change profile picture"
                >
                  <FaCamera className="text-sm" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Name / role */}
              <div className="flex-1 pb-1">
                <h2 className="text-xl font-bold text-health-navy">{user?.name}</h2>
                <p className="text-sm text-slate-500 font-medium capitalize">{roleLabels[user?.role] || user?.role}</p>
                {user?.area?.code && (
                  <span className="inline-block mt-2 text-[11px] font-mono font-bold text-health-blue bg-health-ice/70 px-2.5 py-1 rounded-lg border border-health-blue/15">
                    {user.area.code}
                  </span>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:pb-1">
              {!isEditingDetails && (
                <button type="button" onClick={startEdit} className="btn-outline">
                  <FaEdit className="text-[10px]" /> Edit profile
                </button>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isBusy} className="btn-primary">
                {isUploading ? "Uploading…" : "Upload photo"}
              </button>
              {hasProfilePicture && (
                <button type="button" onClick={handleDeletePicture} disabled={isBusy} className="btn-danger">
                  {isDeleting ? "Removing…" : "Remove photo"}
                </button>
              )}
              <p className="text-[11px] text-slate-400 w-full sm:w-auto text-center">JPG, PNG or WebP · Max 5 MB</p>
            </div>
          </div>

          {message && (
            <div className={`mt-4 px-4 py-2.5 rounded-xl text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit form ── */}
      {isEditingDetails ? (
        <form onSubmit={handleSaveDetails} className="admin-card p-5 sm:p-6 mb-5 w-full space-y-4">
          <div>
            <h3 className="text-base font-bold text-health-navy">Edit Profile Details</h3>
            <p className="text-xs text-slate-400 mt-0.5">Update your name and email below.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="auth-label" htmlFor="edit-name">Full Name</label>
              <input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="auth-input" required />
            </div>
            <div>
              <label className="auth-label" htmlFor="edit-email">Email Address</label>
              <input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className="auth-input" required />
            </div>
            <div>
              <label className="auth-label">Role</label>
              <input value={roleLabels[user?.role] || user?.role} disabled className="auth-input opacity-60 cursor-not-allowed capitalize" />
            </div>
            <div>
              <label className="auth-label">Clinic Area</label>
              <input value={user?.area?.name || "—"} disabled className="auth-input opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSavingDetails} className="btn-primary">{isSavingDetails ? "Saving…" : "Save details"}</button>
            <button type="button" onClick={cancelEdit} className="btn-outline">Cancel</button>
          </div>
        </form>
      ) : (
        /* ── Info cards ── */
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5 w-full">
          {infoCards.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="admin-card p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
                  <Icon className="text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="section-header mb-1">{label}</p>
                  <p className="text-sm font-bold text-health-navy break-words capitalize">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Activity timeline ── */}
      <div className="admin-card p-5 sm:p-6 w-full">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Account Timeline</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-header mb-1">Member since</p>
            <p className="text-sm font-bold text-health-navy">{formatDate(user?.createdAt)}</p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="text-right">
            <p className="section-header mb-1">Last login</p>
            <p className="text-sm font-bold text-health-navy">{formatDate(user?.lastLogin)}</p>
          </div>
        </div>
        {user?.area?.address && (
          <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
            <FaMapMarkerAlt className="text-health-blue shrink-0" />
            {user.area.address}
          </p>
        )}
      </div>
    </div>
  );
};

export default Profile;
