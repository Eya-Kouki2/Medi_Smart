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

const Section = ({ title, children }) => (
  <div className="admin-card p-4 sm:p-5">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</h2>
    {children}
  </div>
);

const Triage = () => {
  const { user } = useOutletContext();
  const [patients, setPatients] = useState([]);
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
        const [patientsRes, classesRes] = await Promise.all([
          api.get("/api/patients"),
          api.get("/api/disease-classes"),
        ]);
        setPatients(patientsRes.data.patients);
        setDiseaseClasses(classesRes.data.diseaseClasses);
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
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-lg font-bold text-health-navy">🏥 Smart Triage</h1>
      </div>

      <Section title="Patient information">
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

      <Section title="Symptoms">
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

      <Section title="AI prediction">
        <div className="text-center py-6">
          <p className="text-xs text-gray-400 mb-3">
            {canUseTriage
              ? predictionSnapshot
                ? "Prediction ready — open results or run again."
                : "Select symptoms and run AI analysis."
              : "Complete patient information first."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={runPrediction}
              disabled={!canUseTriage || isAnalyzing}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-health-navy to-health-blue text-white disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "🤖 Run AI prediction"}
            </button>
            {predictionSnapshot && !isAnalyzing && (
              <button
                type="button"
                onClick={() => setShowPredictionModal(true)}
                className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-health-blue text-health-blue hover:bg-health-ice/30"
              >
                View results
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section title="Actions">
        {errorMessage && <p className="text-xs text-red-500 mb-3">{errorMessage}</p>}
        {message && <p className="text-xs text-emerald-600 mb-3">{message}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={completeTriage}
            disabled={!canUseTriage || !predictionSnapshot || isSaving || triageSaved}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-health-blue to-health-cyan text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : triageSaved ? "Saved" : "💾 Save triage"}
          </button>
          <button
            type="button"
            onClick={runPrediction}
            disabled={!canUseTriage || isAnalyzing}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-health-blue text-health-blue hover:bg-health-ice/30 disabled:opacity-50"
          >
            Re-run prediction
          </button>
          <button
            type="button"
            onClick={resetTriage}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Clear symptoms
          </button>
          {(selectedPatient || patientForm.cin) && (
            <button
              type="button"
              onClick={clearPatient}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 ml-auto"
            >
              <FaTimes className="inline mr-1" />
              Clear patient
            </button>
          )}
        </div>
      </Section>

      {showPredictionModal && predictionSnapshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-health-navy/50 backdrop-blur-sm"
          onClick={closePredictionModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prediction-modal-title"
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-health-navy/5 to-health-cyan/5 flex items-start justify-between gap-3">
              <div>
                <h3 id="prediction-modal-title" className="text-sm font-bold text-health-navy">
                  AI prediction results
                </h3>
                {predictionSnapshot.patientName && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{predictionSnapshot.patientName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closePredictionModal}
                className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {predictionSnapshot.prediction.map((item, index) => (
                <div
                  key={item.maladie}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    index === 0 ? "border-health-blue bg-health-ice/30" : "border-gray-100 bg-gray-50/50"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-health-navy">{item.label}</p>
                    {index === 0 && predictionSnapshot.matchedClass && (
                      <p className="text-[10px] text-health-blue mt-0.5">
                        Class: {predictionSnapshot.matchedClass.name} · #{predictionSnapshot.matchedClass.placeCode}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm font-bold ${index === 0 ? "text-health-blue" : "text-gray-500"}`}>
                    {item.confidence}%
                  </span>
                </div>
              ))}

              {predictionSnapshot.priority && (
                <span
                  className={`inline-flex text-[10px] font-semibold px-2.5 py-1 rounded border ${predictionSnapshot.priority.badge}`}
                >
                  {predictionSnapshot.priority.label}
                </span>
              )}

              {selectedSymptoms.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-medium text-gray-500 mb-1">Symptoms analyzed</p>
                  <p className="text-[11px] text-health-navy">{selectedSymptoms.join(", ")}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={closePredictionModal}
                disabled={isSaving}
                className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={completeTriage}
                disabled={isSaving || triageSaved}
                className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-health-blue to-health-cyan text-white disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "💾 Save visit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Triage;
