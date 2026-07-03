import api from "../../api/axios";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaEdit, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { MALADIES, getMaladieLabel } from "../../constants/maladies";
import PageHeader from "../../components/admin/PageHeader";

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { value: "moderate", label: "Moderate", badge: "bg-amber-50 text-amber-700 border-amber-100" },
  { value: "high", label: "High", badge: "bg-orange-50 text-orange-700 border-orange-100" },
  { value: "critical", label: "Critical", badge: "bg-red-50 text-red-700 border-red-100" },
];

const emptyForm = {
  name: "",
  placeCode: "",
  description: "",
  severity: "moderate",
  maladie: "",
};

const getSeverityMeta = (severity) =>
  SEVERITY_OPTIONS.find((option) => option.value === severity) || SEVERITY_OPTIONS[1];

const DiseaseClasses = () => {
  const { user } = useOutletContext();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadClasses = async () => {
    try {
      const response = await api.get("/api/disease-classes");
      setClasses(response.data.diseaseClasses);
    } catch (error) {
      console.error("Failed to load disease classes", error);
      if (error.response?.status === 503) {
        setErrorMessage(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.area) {
      loadClasses();
    } else {
      setIsLoading(false);
    }
  }, [user?.area]);

  const stats = useMemo(() => {
    const counts = { low: 0, moderate: 0, high: 0, critical: 0 };
    classes.forEach((item) => {
      counts[item.severity] = (counts[item.severity] || 0) + 1;
    });
    return counts;
  }, [classes]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setErrorMessage(null);
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setErrorMessage(null);
  };

  const openEditForm = (item) => {
    setForm({
      name: item.name,
      placeCode: item.placeCode ?? "",
      description: item.description || "",
      severity: item.severity,
      maladie: item.maladie || "",
    });
    setEditingId(item._id);
    setShowForm(true);
    setErrorMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!form.maladie) {
      setErrorMessage("Please choose a maladie.");
      return;
    }

    if (form.placeCode !== "" && (Number(form.placeCode) < 1 || Number(form.placeCode) > 200)) {
      setErrorMessage("Place code must be between 1 and 200.");
      return;
    }

    if (form.placeCode !== "") {
      const placeCode = Number(form.placeCode);
      const isTaken = classes.some(
        (item) => Number(item.placeCode) === placeCode && item._id !== editingId
      );
      if (isTaken) {
        setErrorMessage(`Place code ${placeCode} is already in use.`);
        return;
      }
    }

    try {
      setIsSaving(true);

      if (editingId) {
        await api.put(`/api/disease-classes/${editingId}`, {
          ...form,
          placeCode: form.placeCode === "" ? undefined : Number(form.placeCode),
        });
      } else {
        await api.post("/api/disease-classes", {
          ...form,
          placeCode: form.placeCode === "" ? undefined : Number(form.placeCode),
        });
      }

      await loadClasses();
      resetForm();
    } catch (error) {
      setErrorMessage(
        error.response?.status === 503
          ? error.response.data.message
          : error.response?.data?.message || "Failed to save disease class."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this disease class?")) return;

    try {
      await api.delete(`/api/disease-classes/${id}`);
      setClasses((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to delete disease class.");
    }
  };

  if (!user?.area) {
    return (
      <div className="w-full">
        <PageHeader title="Disease Classes" description="Monitor and manage disease classifications" />
        <div className="admin-card p-6 text-center">
          <p className="text-xs text-gray-500">Complete clinic setup to manage disease classes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <PageHeader
          title="Disease Classes"
          description={`Classifications for ${user.area.name}`}
        />
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 self-start text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-health-blue to-health-cyan text-white hover:from-health-navy hover:to-health-blue transition-all"
        >
          <FaPlus className="text-[10px]" />
          Add class
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="admin-card px-3 py-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-lg font-semibold text-health-navy">{classes.length}</p>
        </div>
        {SEVERITY_OPTIONS.map(({ value, label, badge }) => (
          <div key={value} className="admin-card px-3 py-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`inline-flex mt-1 text-sm font-semibold px-2 py-0.5 rounded border ${badge}`}>
              {stats[value] || 0}
            </p>
          </div>
        ))}
      </div>

      {errorMessage && !showForm && (
        <p className="text-xs text-red-500 mb-4">{errorMessage}</p>
      )}

      {showForm && (
        <div className="admin-card p-4 sm:p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-health-navy">
              {editingId ? "Edit disease class" : "New disease class"}
            </h2>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="auth-label" htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Respiratory infection"
                className="auth-input"
              />
            </div>

            <div>
              <label className="auth-label" htmlFor="placeCode">
                Place code <span className="text-gray-400 font-normal">(optional, 1–200)</span>
              </label>
              <input
                id="placeCode"
                type="number"
                min={1}
                max={200}
                value={form.placeCode}
                onChange={(e) => setForm((prev) => ({ ...prev, placeCode: e.target.value }))}
                placeholder="Random code assigned if empty"
                className="auth-input"
              />
            </div>

            <div>
              <label className="auth-label" htmlFor="severity">Severity</label>
              <select
                id="severity"
                value={form.severity}
                onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
                className="auth-input"
              >
                {SEVERITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="auth-label" htmlFor="maladie">Sickness</label>
              <select
                id="maladie"
                value={form.maladie}
                onChange={(e) => setForm((prev) => ({ ...prev, maladie: e.target.value }))}
                className="auth-input"
              >
                <option value="">Choose a maladie</option>
                {MALADIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="auth-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief notes about this classification..."
                rows={3}
                className="auth-input resize-none"
              />
            </div>

            {errorMessage && <p className="sm:col-span-2 text-xs text-red-500">{errorMessage}</p>}

            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={isSaving} className="auth-btn-primary !w-auto px-5">
                {isSaving ? "Saving..." : editingId ? "Update class" : "Create class"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-gray-400">Loading disease classes...</p>
      ) : classes.length === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="text-3xl mb-2">🦠</p>
          <p className="text-sm font-semibold text-health-navy">No disease classes yet</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Create classifications to organize triage and monitoring workflows.
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-health-blue text-white hover:bg-health-navy"
          >
            Add your first class
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {classes.map((item) => {
            const severity = getSeverityMeta(item.severity);

            return (
              <div key={item._id} className="admin-card p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-health-navy">{item.name}</h3>
                      <span className="text-[10px] font-mono font-semibold text-health-blue bg-health-ice/70 px-2 py-0.5 rounded">
                        #{item.placeCode}
                      </span>
                    </div>
                    <span className={`inline-flex mt-2 text-[10px] font-semibold px-2 py-0.5 rounded border ${severity.badge}`}>
                      {severity.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="w-7 h-7 rounded-md text-gray-400 hover:text-health-blue hover:bg-health-ice/50 flex items-center justify-center"
                      aria-label={`Edit ${item.name}`}
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="w-7 h-7 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
                      aria-label={`Delete ${item.name}`}
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>

                {item.maladie && (
                  <p className="text-xs text-gray-600 mb-2">
                    <span className="font-medium text-gray-500">Maladie:</span> {getMaladieLabel(item.maladie)}
                  </p>
                )}

                {item.description && (
                  <p className="text-xs text-gray-500 flex-1">{item.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiseaseClasses;
