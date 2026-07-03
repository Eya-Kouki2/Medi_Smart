import api from "../../api/axios";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { COMMON_SYMPTOMS, predictMaladies, getPriorityFromPrediction, buildTriageContext, buildTriageVisitPayload } from "../../utils/triagePredict";
import VisitHistoryList from "../../components/admin/VisitHistoryList";

const emptyVitals = {
  temperature: "",
  pulse: "",
  bloodPressure: "",
  weight: "",
  height: "",
};

const emptyPatientForm = {
  cin: "",
  name: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  bloodType: "",
  address: "",
};


const toInputDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};


const formatPatientForList = (patient) => ({
  _id: patient._id,
  cin: patient.cin,
  name: patient.name,
  phone: patient.phone,
  gender: patient.gender,
  bloodType: patient.bloodType,
  dateOfBirth: patient.dateOfBirth,
  address: patient.address,
});

const Section = ({ title, icon, children }) => (
  <div className="admin-card overflow-hidden">
    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5" style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)" }}>
      {icon && <span className="text-base">{icon}</span>}
      <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{title}</h2>
    </div>
    <div className="p-5 sm:p-6">
      {children}
    </div>
  </div>
);

const Triage = () => {
  const { user } = useOutletContext();
  const [patients, setPatients] = useState([]);
  const [fullPts, setFullPts] = useState([]);       // stats endpoint: full history
  const [diseaseClasses, setDiseaseClasses] = useState([]);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [vitals, setVitals] = useState(emptyVitals);
  const [symptomDuration, setSymptomDuration] = useState("");
  const [symptomNotes, setSymptomNotes] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [predictionSnapshot, setPredictionSnapshot] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCinDropdown, setShowCinDropdown] = useState(false);
  const [patientOrigin, setPatientOrigin] = useState(null);
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [triageSaved, setTriageSaved] = useState(false);

  useEffect(() => {
    if (!user?.area) return;
    const load = async () => {
      try {
        const [patientsRes, classesRes, statsRes] = await Promise.all([
          api.get("/api/patients"),
          api.get("/api/disease-classes"),
          api.get("/api/patients/stats"),
        ]);
        setPatients(patientsRes.data.patients);
        setDiseaseClasses(classesRes.data.diseaseClasses);
        setFullPts(statsRes.data.patients || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Failed to load triage data.");
      }
    };
    load();
  }, [user?.area]);

  const normalizedCin = patientForm.cin.trim().toUpperCase();

  const cinMatches = useMemo(() => {
    if (!normalizedCin) return [];
    return patients.filter((p) => p.cin.includes(normalizedCin)).slice(0, 5);
  }, [patients, normalizedCin]);

  const exactCinMatch = useMemo(
    () => patients.find((p) => p.cin === normalizedCin) || null,
    [patients, normalizedCin]
  );

  const matchedClass = useMemo(() => {
    const maladie = predictionSnapshot?.prediction?.[0]?.maladie || prediction?.[0]?.maladie;
    if (!maladie) return null;
    return diseaseClasses.find((c) => c.maladie === maladie);
  }, [diseaseClasses, prediction, predictionSnapshot]);

  // ── Disease grouping statistics ────────────────────────────────
  // Counts how many existing patients (last triage prediction) map to each disease class.
  // Used to recommend grouping: patients with same disease → same class.
  const diseaseGroupStats = useMemo(() => {
    const map = {}; // maladie → { count, lastSeen }
    fullPts.forEach((p) => {
      const triageVisits = (p.history || []).filter(
        (h) => h.triage?.predictions?.length > 0
      );
      if (!triageVisits.length) return;
      // Take the most recent triage visit's top prediction
      const latest = triageVisits.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];
      const topMaladie = latest.triage.predictions[0]?.maladie;
      if (!topMaladie) return;
      if (!map[topMaladie]) map[topMaladie] = { count: 0, lastSeen: null };
      map[topMaladie].count += 1;
      const d = new Date(latest.date);
      if (!map[topMaladie].lastSeen || d > map[topMaladie].lastSeen) {
        map[topMaladie].lastSeen = d;
      }
    });
    return map;
  }, [fullPts]);

  const isNewPatientDraft = !isExistingPatient && !selectedPatient && Boolean(normalizedCin) && !exactCinMatch;

  const isPatientFormComplete = Boolean(
    normalizedCin &&
    patientForm.name.trim() &&
    patientForm.gender &&
    patientForm.dateOfBirth
  );

  const canUseTriage = Boolean(selectedPatient) || (isNewPatientDraft && isPatientFormComplete);

  const fillFormFromPatient = (patient) => ({
    cin: patient.cin || "",
    name: patient.name || "",
    dateOfBirth: toInputDate(patient.dateOfBirth),
    gender: patient.gender || "",
    phone: patient.phone || "",
    bloodType: patient.bloodType || "",
    address: patient.address || "",
  });

  const loadExistingPatient = async (patientId) => {
    try {
      const response = await api.get(`/api/patients/${patientId}`);
      const patient = response.data.patient;
      setSelectedPatient(patient);
      setPatientForm(fillFormFromPatient(patient));
      setIsExistingPatient(true);
      setShowCinDropdown(false);
      setPatientOrigin("search");
      clearSymptomsForm();
      setMessage(null);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Failed to load patient.");
    }
  };

  const handleCinChange = (value) => {
    const cin = value.toUpperCase();
    setPatientForm((prev) => ({ ...prev, cin }));
    setIsExistingPatient(false);
    setSelectedPatient(null);
    setMessage(null);
    invalidatePrediction();
    setShowCinDropdown(true);
    setPatientOrigin(null);
    setTriageSaved(false);
  };

  const handlePatientFieldChange = (field, value) => {
    if (patientOrigin === "search" && selectedPatient) return;
    setPatientForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearSymptomsForm = () => {
    setSelectedSymptoms([]);
    setVitals(emptyVitals);
    setSymptomDuration("");
    setSymptomNotes("");
    setPrediction(null);
    setShowPredictionModal(false);
    setPredictionSnapshot(null);
    setTriageSaved(false);
  };

  const invalidatePrediction = () => {
    setPrediction(null);
    setShowPredictionModal(false);
    setPredictionSnapshot(null);
    setTriageSaved(false);
  };

  const handleVitalChange = (field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
    invalidatePrediction();
  };

  const handleSymptomFormChange = () => {
    invalidatePrediction();
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
    invalidatePrediction();
  };

  const getTriageContext = () => buildTriageContext(vitals, symptomDuration, symptomNotes);

  const runPrediction = () => {
    if (!canUseTriage) {
      setErrorMessage(
        exactCinMatch && !selectedPatient
          ? "This CIN already exists — select the patient from the dropdown."
          : "Complete patient information (name, gender, birth date) first."
      );
      return;
    }
    if (selectedSymptoms.length === 0 && !symptomNotes.trim()) {
      setErrorMessage("Select symptoms or add notes before running AI prediction.");
      return;
    }
    setErrorMessage(null);
    setIsAnalyzing(true);
    setShowPredictionModal(false);
    setTimeout(() => {
      const results = predictMaladies(selectedSymptoms, getTriageContext());
      const top = results[0];
      const priority = getPriorityFromPrediction(top.confidence);
      const matched = diseaseClasses.find((c) => c.maladie === top?.maladie) || null;

      setPrediction(results);
      setPredictionSnapshot({
        prediction: results,
        priority,
        matchedClass: matched,
        patientName: selectedPatient?.name || patientForm.name.trim() || null,
        // pass grouping stats so the modal can show containment info
        groupStats: diseaseGroupStats,
        allClasses: diseaseClasses,
      });
      setShowPredictionModal(true);
      setTriageSaved(false);
      setIsAnalyzing(false);
    }, 600);
  };

  const closePredictionModal = () => {
    setShowPredictionModal(false);
  };

  const completeTriage = async () => {
    const activePrediction = predictionSnapshot?.prediction || prediction;
    if (!activePrediction?.length || triageSaved) return;
    if (!canUseTriage && !selectedPatient) return;

    const top = activePrediction[0];
    const priority = predictionSnapshot?.priority || getPriorityFromPrediction(top.confidence);
    const activeMatchedClass = predictionSnapshot?.matchedClass ?? matchedClass;
    const historyPayload = buildTriageVisitPayload({
      vitals,
      symptomDuration,
      selectedSymptoms,
      symptomNotes,
      prediction: activePrediction,
      priority,
      matchedClass: activeMatchedClass,
    });

    try {
      setIsSaving(true);
      setErrorMessage(null);

      let patient = selectedPatient;
      const wasNewPatient = !patient && isNewPatientDraft;

      if (wasNewPatient) {
        if (!isPatientFormComplete) {
          setErrorMessage("Complete patient information before saving.");
          return;
        }
        const response = await api.post("/api/patients", patientForm);
        patient = response.data.patient;
        setPatients((prev) => [...prev, formatPatientForList(patient)]);
        setSelectedPatient(patient);
        setPatientForm(fillFormFromPatient(patient));
        setIsExistingPatient(true);
        setPatientOrigin("created");
      }

      if (!patient?._id) return;

      const historyRes = await api.post(`/api/patients/${patient._id}/history`, historyPayload);
      if (historyRes.data.patient) {
        setSelectedPatient(historyRes.data.patient);
      }
      setShowPredictionModal(false);
      setPredictionSnapshot(null);
      setTriageSaved(true);
      clearSymptomsForm();
      setMessage(
        wasNewPatient
          ? "Patient added to your list and visit saved."
          : "Visit saved — add new symptoms below for another visit."
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to save triage.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetTriage = () => {
    clearSymptomsForm();
    setShowPredictionModal(false);
    setPredictionSnapshot(null);
    setMessage(null);
    setErrorMessage(null);
  };

  const clearPatient = () => {
    setPatientForm(emptyPatientForm);
    setSelectedPatient(null);
    setIsExistingPatient(false);
    setShowCinDropdown(false);
    setPatientOrigin(null);
    setTriageSaved(false);
    setShowPredictionModal(false);
    setPredictionSnapshot(null);
    resetTriage();
  };

  const cinSearchOpen = showCinDropdown && normalizedCin && cinMatches.length > 0 && !isExistingPatient;
  const fieldsLocked = patientOrigin === "search" && !!selectedPatient;

  if (!user?.area) {
    return (
      <div className="w-full">
        <div className="admin-card p-6 text-center">
          <p className="text-xs text-gray-500">Complete clinic setup to use Smart Triage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div className="admin-card p-5 sm:p-6 mb-2" style={{ background: "linear-gradient(135deg,#03045e,#0077b6)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <span className="text-2xl">🩺</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Smart Triage</h1>
            <p className="text-xs text-blue-200/80 mt-0.5">AI-assisted patient assessment &amp; clinical prediction</p>
          </div>
        </div>
      </div>

      <Section title="Patient Information" icon="👤">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="auth-label" htmlFor="cin">CIN</label>
              <input
                id="cin"
                value={patientForm.cin}
                onChange={(e) => handleCinChange(e.target.value)}
                onFocus={() => setShowCinDropdown(true)}
                onBlur={() => setTimeout(() => setShowCinDropdown(false), 150)}
                placeholder="Search by CIN..."
                className="auth-input uppercase font-mono"
                autoComplete="off"
              />
              {cinSearchOpen && (
                <ul className="absolute z-20 left-0 right-0 mt-1 border border-health-ice rounded-xl overflow-hidden bg-white shadow-lg">
                  {cinMatches.map((p) => (
                    <li key={p._id}>
                      <button
                        type="button"
                        onMouseDown={() => loadExistingPatient(p._id)}
                        className="w-full text-left px-3 py-2.5 hover:bg-health-ice/60 text-xs border-b border-health-ice/50 last:border-0"
                      >
                        <span className="font-mono font-semibold text-health-blue">{p.cin}</span>
                        <span className="text-health-navy font-semibold ml-2">{p.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="auth-label" htmlFor="name">Full name</label>
              <input
                id="name"
                value={patientForm.name}
                onChange={(e) => handlePatientFieldChange("name", e.target.value)}
                disabled={fieldsLocked}
                className="auth-input disabled:opacity-60 disabled:bg-gray-50"
                placeholder="Patient name"
              />
            </div>
            <div>
              <label className="auth-label" htmlFor="phone">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                value={patientForm.phone}
                onChange={(e) => handlePatientFieldChange("phone", e.target.value)}
                disabled={fieldsLocked}
                className="auth-input disabled:opacity-60 disabled:bg-gray-50"
                placeholder="+216 ..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="auth-label" htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={patientForm.gender}
                onChange={(e) => handlePatientFieldChange("gender", e.target.value)}
                disabled={fieldsLocked}
                className="auth-input disabled:opacity-60 disabled:bg-gray-50"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="auth-label" htmlFor="bloodType">
                Blood type <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="bloodType"
                value={patientForm.bloodType}
                onChange={(e) => handlePatientFieldChange("bloodType", e.target.value)}
                disabled={fieldsLocked}
                className="auth-input disabled:opacity-60 disabled:bg-gray-50"
                placeholder="e.g. O+"
              />
            </div>
            <div>
              <label className="auth-label" htmlFor="dateOfBirth">Birth date</label>
              <input
                id="dateOfBirth"
                type="date"
                value={patientForm.dateOfBirth}
                onChange={(e) => handlePatientFieldChange("dateOfBirth", e.target.value)}
                disabled={fieldsLocked}
                className="auth-input disabled:opacity-60 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="auth-label" htmlFor="address">
                Address <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="address"
                value={patientForm.address}
                onChange={(e) => handlePatientFieldChange("address", e.target.value)}
                disabled={fieldsLocked}
                className="auth-input disabled:opacity-60 disabled:bg-gray-50"
                placeholder="Street, city..."
              />
            </div>
          </div>

          {selectedPatient && (
            <div className="border-t border-gray-100 pt-3 mt-1">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Visit history</h3>
              <VisitHistoryList
                history={selectedPatient.history}
                emptyMessage="No visits yet — complete triage to record the first visit."
              />
            </div>
          )}

          {isSaving && (
            <p className="text-[11px] text-health-blue font-medium">Saving patient and triage...</p>
          )}
          {patientOrigin === "search" && selectedPatient && !isSaving && (
            <p className="text-[11px] text-emerald-600 font-medium">
              Existing patient loaded — continue with symptoms below.
            </p>
          )}
          {isNewPatientDraft && !isSaving && (
            <p className="text-[11px] text-gray-500">
              New patient — fill all details, add symptoms, then run AI and save the visit from the results popup.
            </p>
          )}
          {exactCinMatch && !selectedPatient && (
            <p className="text-[11px] text-amber-700">
              This CIN is already registered — click the match above to load the patient.
            </p>
          )}
        </div>
      </Section>

      <Section title="Symptoms &amp; Vitals" icon="🌡️">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runPrediction();
          }}
          className="space-y-3"
        >
          <fieldset disabled={!canUseTriage} className="space-y-3 border-0 p-0 m-0 min-w-0 disabled:opacity-60">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="auth-label" htmlFor="temperature">Temperature</label>
                <input
                  id="temperature"
                  type="text"
                  value={vitals.temperature}
                  onChange={(e) => handleVitalChange("temperature", e.target.value)}
                  placeholder="e.g. 38.5°C"
                  className="auth-input"
                />
              </div>
              <div>
                <label className="auth-label" htmlFor="pulse">Pulse</label>
                <input
                  id="pulse"
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => handleVitalChange("pulse", e.target.value)}
                  placeholder="e.g. 72 bpm"
                  className="auth-input"
                />
              </div>
              <div>
                <label className="auth-label" htmlFor="bloodPressure">Blood Pressure</label>
                <input
                  id="bloodPressure"
                  type="text"
                  value={vitals.bloodPressure}
                  onChange={(e) => handleVitalChange("bloodPressure", e.target.value)}
                  placeholder="e.g. 120/80"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="auth-label" htmlFor="weight">Weight</label>
                <input
                  id="weight"
                  type="text"
                  value={vitals.weight}
                  onChange={(e) => handleVitalChange("weight", e.target.value)}
                  placeholder="e.g. 70 kg"
                  className="auth-input"
                />
              </div>
              <div>
                <label className="auth-label" htmlFor="height">Height</label>
                <input
                  id="height"
                  type="text"
                  value={vitals.height}
                  onChange={(e) => handleVitalChange("height", e.target.value)}
                  placeholder="e.g. 175 cm"
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <p className="auth-label mb-2">Symptoms</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_SYMPTOMS.map((symptom) => {
                  const symptomId = `symptom-${symptom.toLowerCase().replace(/\s+/g, "-")}`;
                  const checked = selectedSymptoms.includes(symptom);
                  return (
                    <label
                      key={symptom}
                      htmlFor={symptomId}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        checked
                          ? "border-health-blue bg-health-ice/40 text-health-navy"
                          : "border-gray-100 bg-gray-50/50 text-gray-600 hover:border-health-cyan/50 hover:bg-health-ice/20"
                      }`}
                    >
                      <input
                        id={symptomId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSymptom(symptom)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-health-blue focus:ring-health-blue"
                      />
                      <span className="font-medium">{symptom}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="auth-label" htmlFor="symptomDuration">Duration</label>
                <input
                  id="symptomDuration"
                  type="text"
                  value={symptomDuration}
                  onChange={(e) => {
                    setSymptomDuration(e.target.value);
                    handleSymptomFormChange();
                  }}
                  placeholder="e.g. 3 days"
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="symptomNotes">
                Additional notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="symptomNotes"
                value={symptomNotes}
                onChange={(e) => {
                  setSymptomNotes(e.target.value);
                  handleSymptomFormChange();
                }}
                rows={3}
                placeholder="Any other details..."
                className="auth-input resize-none"
              />
            </div>

            {!canUseTriage && (
              <p className="text-[11px] text-gray-500">Complete patient information first.</p>
            )}
          </fieldset>
        </form>
      </Section>

      <Section title="AI Prediction Engine" icon="🤖">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-health-navy to-health-blue flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🧬</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-medium">
            {canUseTriage
              ? predictionSnapshot
                ? "Prediction ready — open results or run again."
                : "Select symptoms above and run the AI analysis."
              : "Complete patient information first."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={runPrediction}
              disabled={!canUseTriage || isAnalyzing}
              className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl bg-gradient-to-r from-health-navy to-health-blue text-white shadow-lg shadow-health-navy/25 hover:from-health-navy hover:to-health-cyan transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isAnalyzing ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing&hellip;</>
              ) : (
                <>🤖 Run AI Prediction</>
              )}
            </button>
            {predictionSnapshot && !isAnalyzing && (
              <button
                type="button"
                onClick={() => setShowPredictionModal(true)}
                className="btn-outline text-sm px-5 py-3"
              >
                View results
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section title="Actions" icon="💾">
        {errorMessage && <p className="text-xs text-red-500 mb-3">{errorMessage}</p>}
        {message && <p className="text-xs text-emerald-600 mb-3">{message}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={completeTriage}
            disabled={!canUseTriage || !predictionSnapshot || isSaving || triageSaved}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? "Saving…" : triageSaved ? "✓ Saved" : "💾 Save Triage"}
          </button>
          <button type="button" onClick={runPrediction} disabled={!canUseTriage || isAnalyzing} className="btn-outline disabled:opacity-50">Re-run prediction</button>
          <button type="button" onClick={resetTriage} className="btn-outline">Clear symptoms</button>
          {(selectedPatient || patientForm.cin) && (
            <button type="button" onClick={clearPatient} className="btn-outline ml-auto">
              <FaTimes className="text-[10px]" /> Clear patient
            </button>
          )}
        </div>
      </Section>

      {showPredictionModal && predictionSnapshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-health-navy/60 backdrop-blur-sm"
          onClick={closePredictionModal}
        >
          <div
            className="glass-card w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prediction-modal-title"
          >
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0" style={{ background: "linear-gradient(135deg,#03045e,#0077b6)" }}>
              <div>
                <h3 id="prediction-modal-title" className="text-base font-bold text-white">AI Prediction Results</h3>
                {predictionSnapshot.patientName && (
                  <p className="text-[11px] text-blue-200/80 mt-0.5">Patient: {predictionSnapshot.patientName}</p>
                )}
              </div>
              <button type="button" onClick={closePredictionModal} className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-200/80 hover:text-white hover:bg-white/15 transition-colors shrink-0" aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: AI Predictions & Current Symptoms */}
                <div className="space-y-4">
                  {/* AI Predictions Section */}
                  <div>
                    <h4 className="text-xs font-semibold text-health-navy uppercase tracking-wider mb-2">
                      AI Predictions & Priority
                    </h4>
                    <div className="space-y-2">
                      {predictionSnapshot.prediction.map((item, index) => (
                        <div
                          key={item.maladie}
                          className={`flex items-center justify-between p-2.5 rounded-xl border ${
                            index === 0 ? "border-health-blue bg-health-ice/30" : "border-gray-100 bg-gray-50/50"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-health-navy">{item.label}</p>
                          </div>
                          <span className={`text-xs font-bold ${index === 0 ? "text-health-blue" : "text-gray-500"}`}>
                            {item.confidence}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {predictionSnapshot.priority && (
                      <div className="mt-2.5">
                        <span
                          className={`inline-flex text-[10px] font-semibold px-2.5 py-1 rounded border ${predictionSnapshot.priority.badge}`}
                        >
                          Priority: {predictionSnapshot.priority.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ─── GROUPING & CONTAINMENT CARD ─── */}
                  {(() => {
                    const topMaladie = predictionSnapshot.prediction[0]?.maladie;
                    const topLabel   = predictionSnapshot.prediction[0]?.label;
                    const cls        = predictionSnapshot.matchedClass;
                    const stats      = predictionSnapshot.groupStats?.[topMaladie];
                    const existing   = stats?.count ?? 0;
                    const allClasses = predictionSnapshot.allClasses || [];

                    // Severity colors
                    const sevColors = {
                      critical: { bg: "bg-red-50",     border: "border-red-300",    icon: "🔴", text: "text-red-700",     label: "CRITICAL — Strict Isolation",  strip: "#ef4444" },
                      high:     { bg: "bg-orange-50",  border: "border-orange-300", icon: "🟠", text: "text-orange-700",  label: "HIGH — Cohort Isolation",       strip: "#f97316" },
                      moderate: { bg: "bg-amber-50",   border: "border-amber-300",  icon: "🟡", text: "text-amber-700",   label: "MODERATE — Grouped Ward",       strip: "#f59e0b" },
                      low:      { bg: "bg-emerald-50", border: "border-emerald-200",icon: "🟢", text: "text-emerald-700", label: "LOW — Standard Room",            strip: "#10b981" },
                    };
                    const sev = sevColors[cls?.severity] || sevColors.moderate;

                    // Other diseases' classes for the reference table
                    const otherClassRows = allClasses.filter((c) => c.maladie !== topMaladie).slice(0, 5);

                    return (
                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        <h4 className="text-xs font-semibold text-health-navy uppercase tracking-wider">
                          🏥 Patient Grouping &amp; Containment
                        </h4>

                        {cls ? (
                          <div className={`rounded-xl border-2 ${sev.border} ${sev.bg} overflow-hidden`}>
                            {/* colored top strip */}
                            <div className="h-1.5 w-full" style={{ background: sev.strip }} />

                            <div className="p-3.5 space-y-2.5">
                              {/* Room assignment */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 rounded-xl p-3 border border-white/60">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Direct Patient To:</p>
                                  <p className={`text-base font-bold ${sev.text}`}>{cls.name}</p>
                                </div>
                                <div className="text-center sm:text-right shrink-0">
                                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Room / Zone</span>
                                  <span
                                    className="inline-block text-4xl font-black px-6 py-2 rounded-xl text-white shadow-md shadow-black/10"
                                    style={{ background: sev.strip }}
                                  >
                                    #{cls.placeCode}
                                  </span>
                                </div>
                              </div>

                              {/* Isolation level */}
                              <div className={`flex items-center gap-2 text-[11px] font-semibold ${sev.text}`}>
                                <span>{sev.icon}</span>
                                <span>{sev.label}</span>
                              </div>

                              {/* Grouping rationale */}
                              <div className="rounded-lg bg-white/60 border border-white/80 p-2.5">
                                <p className="text-[11px] text-slate-700 leading-relaxed">
                                  {existing > 0 ? (
                                    <>
                                      <strong>{existing} patient{existing !== 1 ? "s" : ""}</strong> with <strong>{topLabel}</strong> are
                                      {" "} already assigned to <strong>Class #{cls.placeCode}</strong>.
                                      {" "} Route this patient to the same class to <span className={`font-bold ${sev.text}`}>contain spread</span> and
                                      {" "} prevent cross-contamination.
                                    </>
                                  ) : (
                                    <>
                                      No other patients currently diagnosed with <strong>{topLabel}</strong>.
                                      {" "} Assign to <strong>Class #{cls.placeCode}</strong> to establish an
                                      {" "} <span className={`font-bold ${sev.text}`}>isolation cohort</span> for this condition.
                                    </>
                                  )}
                                </p>
                              </div>

                              {/* Epidemiology badge */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="stat-pill-slate">🦠 Cohort grouping</span>
                                <span className="stat-pill-blue">🧫 Infection control</span>
                                {existing > 0 && (
                                  <span className="stat-pill-amber">{existing} existing in class</span>
                                )}
                                {stats?.lastSeen && (
                                  <span className="stat-pill-slate">
                                    Last case: {new Date(stats.lastSeen).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3.5">
                            <p className="text-xs font-semibold text-amber-700">⚠️ No class configured for <strong>{topLabel}</strong></p>
                            <p className="text-[10px] text-amber-600 mt-1">
                              Go to Disease Classes to create a class for this condition and enable automatic room assignment.
                            </p>
                          </div>
                        )}

                        {/* Reference: other available classes */}
                        {otherClassRows.length > 0 && (
                          <details className="group">
                            <summary className="text-[10px] font-semibold text-health-blue cursor-pointer hover:text-health-navy transition-colors select-none">
                              ▶ View other available classes ({otherClassRows.length}+)
                            </summary>
                            <div className="mt-2 rounded-xl border border-slate-100 overflow-hidden">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)" }}>
                                    <th className="px-3 py-2 text-left section-header">Class</th>
                                    <th className="px-3 py-2 text-left section-header">Room</th>
                                    <th className="px-3 py-2 text-left section-header">Severity</th>
                                    <th className="px-3 py-2 text-right section-header">Patients</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {otherClassRows.map((c) => {
                                    const cnt = predictionSnapshot.groupStats?.[c.maladie]?.count ?? 0;
                                    const s = sevColors[c.severity] || sevColors.moderate;
                                    return (
                                      <tr key={c._id} className="hover:bg-slate-50/60">
                                        <td className="px-3 py-1.5 font-medium text-health-navy">{c.name}</td>
                                        <td className="px-3 py-1.5 font-mono font-bold text-health-blue">#{c.placeCode}</td>
                                        <td className="px-3 py-1.5">
                                          <span className={`text-[9px] font-semibold ${s.text}`}>{s.icon} {c.severity}</span>
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                          {cnt > 0 ? <span className="stat-pill-amber">{cnt}</span> : <span className="text-slate-300">—</span>}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}

                  {/* Current Symptoms Section */}
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-semibold text-health-navy uppercase tracking-wider mb-2">
                      Current Symptoms & Vitals
                    </h4>
                    <div className="space-y-2.5">
                      {/* Vitals Grid */}
                      {[
                        vitals.temperature?.trim(),
                        vitals.pulse?.trim(),
                        vitals.bloodPressure?.trim(),
                        vitals.weight?.trim(),
                        vitals.height?.trim()
                      ].some(Boolean) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {vitals.temperature?.trim() && (
                            <div className="bg-gray-50/60 border border-gray-100 rounded-lg p-1.5 text-center">
                              <span className="text-[9px] text-gray-400 block font-medium">Temp</span>
                              <span className="text-[11px] font-semibold text-health-navy">{vitals.temperature}</span>
                            </div>
                          )}
                          {vitals.pulse?.trim() && (
                            <div className="bg-gray-50/60 border border-gray-100 rounded-lg p-1.5 text-center">
                              <span className="text-[9px] text-gray-400 block font-medium">Pulse</span>
                              <span className="text-[11px] font-semibold text-health-navy">{vitals.pulse}</span>
                            </div>
                          )}
                          {vitals.bloodPressure?.trim() && (
                            <div className="bg-gray-50/60 border border-gray-100 rounded-lg p-1.5 text-center">
                              <span className="text-[9px] text-gray-400 block font-medium">BP</span>
                              <span className="text-[11px] font-semibold text-health-navy">{vitals.bloodPressure}</span>
                            </div>
                          )}
                          {vitals.weight?.trim() && (
                            <div className="bg-gray-50/60 border border-gray-100 rounded-lg p-1.5 text-center">
                              <span className="text-[9px] text-gray-400 block font-medium">Weight</span>
                              <span className="text-[11px] font-semibold text-health-navy">{vitals.weight}</span>
                            </div>
                          )}
                          {vitals.height?.trim() && (
                            <div className="bg-gray-50/60 border border-gray-100 rounded-lg p-1.5 text-center">
                              <span className="text-[9px] text-gray-400 block font-medium">Height</span>
                              <span className="text-[11px] font-semibold text-health-navy">{vitals.height}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selected Symptoms */}
                      {selectedSymptoms.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 mb-1">Symptoms Analyzed</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedSymptoms.map((symptom) => (
                              <span
                                key={symptom}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-health-ice/40 border border-health-blue/10 text-health-navy"
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">No specific symptoms selected</p>
                      )}

                      {/* Duration */}
                      {symptomDuration?.trim() && (
                        <p className="text-[11px] text-gray-600">
                          <span className="font-semibold text-health-navy">Duration:</span> {symptomDuration}
                        </p>
                      )}

                      {/* Additional Notes */}
                      {symptomNotes?.trim() && (
                        <div>
                          <p className="text-[10px] font-medium text-gray-400 mb-1">Triage Notes</p>
                          <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-[11px] text-gray-600 italic whitespace-pre-wrap">
                            {symptomNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Visit History */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5 flex flex-col">
                  <h4 className="text-xs font-semibold text-health-navy uppercase tracking-wider mb-2 shrink-0">
                    Patient History
                  </h4>
                  <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[40vh] md:max-h-[50vh]">
                    {selectedPatient ? (
                      <VisitHistoryList
                        history={selectedPatient.history}
                        emptyMessage="No past visits recorded for this patient."
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <p className="text-xs text-gray-400 italic">
                          New patient draft. History will be generated upon saving.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={closePredictionModal}
                disabled={isSaving}
                className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 bg-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={completeTriage}
                disabled={isSaving || triageSaved}
                className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-health-blue to-health-cyan text-white disabled:opacity-50"
              >
                {isSaving ? "Saving..." : triageSaved ? "Saved" : "💾 Save visit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Triage;
