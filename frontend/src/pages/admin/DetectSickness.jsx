import api from "../../api/axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { predictMaladies, getPriorityFromPrediction } from "../../utils/triagePredict";
import {
  FaExpand, FaCompress, FaPlus, FaMinus,
  FaShieldAlt, FaRedo, FaCheckCircle, FaTimesCircle,
} from "react-icons/fa";

/* ─── 25 diagnostic questions ───────────────────────────────────
   Each question carries:
     • key    – internal ID
     • label  – sentence shown to the patient/nurse
     • keywords – strings fed into predictMaladies / notes
   Note: predictMaladies does keyword matching on free text,
   so the keywords arrays here mirror the SYMPTOM_RULES in
   triagePredict.js (fever, cough, chills, sweating, …).
───────────────────────────────────────────────────────────────── */
const QUESTIONS = [
  { key: "chills",                label: "Are you experiencing chills?",                        keywords: ["chills"] },
  { key: "joint_pain",            label: "Do you have joint pain?",                             keywords: ["joint pain", "rash"] },
  { key: "muscle_wasting",        label: "Have you noticed muscle wasting or loss?",            keywords: ["fatigue"] },
  { key: "vomiting",              label: "Have you been vomiting?",                             keywords: ["vomiting"] },
  { key: "fatigue",               label: "Are you feeling unusual fatigue?",                    keywords: ["fatigue"] },
  { key: "weight_loss",           label: "Have you had unexplained weight loss?",               keywords: ["weight loss"] },
  { key: "patches_in_throat",     label: "Do you have patches or soreness in your throat?",    keywords: ["sore throat"] },
  { key: "cough",                 label: "Do you have a cough?",                                keywords: ["cough"] },
  { key: "high_fever",            label: "Do you have a high fever (≥ 38.5 °C)?",              keywords: ["fever"] },
  { key: "breathlessness",        label: "Are you experiencing breathlessness?",                keywords: ["breathing difficulty", "shortness of breath"] },
  { key: "sweating",              label: "Are you sweating excessively?",                       keywords: ["sweating", "night sweats"] },
  { key: "headache",              label: "Do you have a headache?",                             keywords: ["headache"] },
  { key: "nausea",                label: "Are you feeling nauseous?",                           keywords: ["nausea"] },
  { key: "loss_of_appetite",      label: "Have you lost your appetite?",                       keywords: ["fatigue"] },
  { key: "diarrhoea",             label: "Do you have diarrhoea?",                              keywords: ["diarrhea", "severe diarrhea"] },
  { key: "mild_fever",            label: "Do you have a mild fever (37–38.5 °C)?",             keywords: ["fever"] },
  { key: "yellowing_of_eyes",     label: "Have you noticed yellowing of the eyes (jaundice)?", keywords: ["jaundice", "yellow eyes"] },
  { key: "swelled_lymph_nodes",   label: "Do you have swollen lymph nodes?",                   keywords: ["swollen lymph nodes"] },
  { key: "malaise",               label: "Do you feel a general sense of malaise or unwell?",  keywords: ["fatigue"] },
  { key: "phlegm",                label: "Are you producing phlegm or mucus?",                 keywords: ["cough"] },
  { key: "chest_pain",            label: "Do you have chest pain or tightness?",               keywords: ["chest tightness"] },
  { key: "dizziness",             label: "Are you experiencing dizziness?",                    keywords: ["dizziness"] },
  { key: "extra_marital_contacts",label: "Have you had unprotected sexual contacts recently?", keywords: ["rash", "blisters", "lesions"] },
  { key: "muscle_pain",           label: "Do you have muscle pain or body aches?",             keywords: ["body ache"] },
  { key: "blood_in_sputum",       label: "Have you noticed blood in your sputum?",             keywords: ["blood", "blood in sputum"] },
];

/* Pretty label from key */
const fmt = (key) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ─── Build note string for predictMaladies from yes-answers ── */
const buildNotes = (answers) =>
  QUESTIONS.filter((q) => answers[q.key])
    .flatMap((q) => q.keywords)
    .join(" ");

/* ══════════════════════════════════════════════════════════════ */

const DetectSickness = () => {
  const { user } = useOutletContext();
  const [diseaseClasses, setDiseaseClasses] = useState([]);

  /* view: "welcome" | "quiz" | "results" */
  const [view,    setView]    = useState("welcome");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [sliding, setSliding] = useState(false);   // animation flag

  /* fullscreen / zoom */
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom,         setZoom]         = useState(110);

  useEffect(() => {
    if (!user?.area) return;
    api.get("/api/disease-classes")
      .then((r) => setDiseaseClasses(r.data.diseaseClasses || []))
      .catch(() => {});
  }, [user?.area]);

  /* Esc key exits fullscreen */
  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  /* ── Answer a question (yes = true, no = false) ─────────────── */
  const answer = (value) => {
    if (sliding) return;
    const key     = QUESTIONS[current].key;
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    if (current < QUESTIONS.length - 1) {
      setSliding(true);
      setTimeout(() => {
        setCurrent((c) => c + 1);
        setSliding(false);
      }, 220);
    } else {
      /* All done → compute */
      const notes    = buildNotes(updated);
      const preds    = predictMaladies([], notes);
      const priority = getPriorityFromPrediction(preds[0]?.confidence ?? 0);
      const matched  = diseaseClasses.find((c) => c.maladie === preds[0]?.maladie);
      const yesKeys  = Object.keys(updated).filter((k) => updated[k]);
      setResults({ predictions: preds, priority, matchedClass: matched, yesKeys });
      setView("results");
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrent(0);
    setResults(null);
    setView("welcome");
  };

  /* ── Progress ────────────────────────────────────────────────── */
  const progress = Math.round((current / QUESTIONS.length) * 100);

  /* ── Layout ─────────────────────────────────────────────────── */
  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-50 bg-slate-50 overflow-y-auto"
    : "w-full";
  const innerClass = isFullscreen
    ? "w-full px-6 py-6 space-y-4 min-h-screen"
    : "max-w-5xl mx-auto space-y-4 animate-fade-in";

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className={wrapperClass}>
      <div className={innerClass} style={{ fontSize: `${zoom}%` }}>

        {/* ── Shared Header ─────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 sm:p-6 shadow-sm"
          style={{ background: "linear-gradient(135deg,#03045e,#0077b6)" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <span className="text-2xl">🧬</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Detect Sickness</h1>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Symptom evaluation · {QUESTIONS.length} questions · instant results
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden">
                <button onClick={() => setZoom((z) => Math.max(z - 10, 70))} disabled={zoom <= 70}
                  className="px-2.5 py-1.5 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-40 text-xs">
                  <FaMinus />
                </button>
                <span className="px-2.5 text-[11px] font-bold text-white/90 select-none">{zoom}%</span>
                <button onClick={() => setZoom((z) => Math.min(z + 10, 150))} disabled={zoom >= 150}
                  className="px-2.5 py-1.5 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-40 text-xs">
                  <FaPlus />
                </button>
              </div>
              <button onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 transition-colors text-[11px] font-semibold">
                {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </button>
            </div>
          </div>
        </div>

        {/* ══ WELCOME ══════════════════════════════════════════ */}
        {view === "welcome" && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* top strip */}
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#03045e,#0096c7)" }} />

              <div className="px-10 py-12 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#03045e] to-[#0096c7] flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-4xl">🩺</span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-[#03045e] mb-2">Welcome</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    This tool walks you through <strong className="text-slate-700">{QUESTIONS.length} clinical questions</strong>.
                    Answer <strong className="text-emerald-600">Yes</strong> or <strong className="text-red-500">No</strong> for each symptom —
                    at the end you'll receive a diagnostic assessment and a suggested room if applicable.
                  </p>
                </div>

                {/* Quick preview of symptoms */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUESTIONS.slice(0, 8).map((q) => (
                    <span key={q.key} className="text-[10px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 font-medium">
                      {fmt(q.key)}
                    </span>
                  ))}
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-50 border border-dashed border-slate-300 text-slate-400">
                    +{QUESTIONS.length - 8} more…
                  </span>
                </div>

                <button
                  onClick={() => setView("quiz")}
                  className="btn-primary w-full py-3.5 text-sm font-bold rounded-xl"
                >
                  Start Assessment →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ QUIZ ═════════════════════════════════════════════ */}
        {view === "quiz" && (
          <div className="flex flex-col gap-4 mt-6" style={{ minHeight: "calc(100vh - 200px)" }}>

            {/* Progress */}
            <div className="w-full shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Question {current + 1} <span className="text-slate-300">/ {QUESTIONS.length}</span>
                </span>
                <span className="text-[11px] font-bold text-[#0077b6]">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg,#03045e,#0096c7)",
                  }}
                />
              </div>
            </div>

            {/* Question card — grows to fill remaining height */}
            <div
              className="flex flex-col flex-1 w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-220"
              style={{ opacity: sliding ? 0 : 1, transform: sliding ? "translateY(10px)" : "translateY(0)" }}
            >
              {/* Coloured accent */}
              <div className="h-1.5 w-full shrink-0" style={{ background: "linear-gradient(90deg,#03045e,#0096c7)" }} />

              <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0"
                style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)" }}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Symptom Check</span>
                <span className="text-[10px] font-bold text-slate-300">{current + 1} / {QUESTIONS.length}</span>
              </div>

              {/* Question area — grows to push buttons down */}
              <div className="flex-1 flex flex-col items-center justify-center px-10 py-12 text-center gap-8">
                {/* Symptom badge */}
                <span className="inline-block text-sm font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 border border-indigo-100 px-5 py-2 rounded-full">
                  {fmt(QUESTIONS[current].key)}
                </span>

                {/* Question */}
                <h2 className="text-4xl sm:text-5xl font-black text-[#03045e] leading-snug mx-auto">
                  {QUESTIONS[current].label}
                </h2>
              </div>

              {/* Yes / No — full-width split, anchored at bottom */}
              <div className="flex border-t-2 border-slate-100 shrink-0" style={{ minHeight: "220px" }}>
                {/* NO */}
                <button
                  onClick={() => answer(false)}
                  className="group flex-1 flex flex-col items-center justify-center gap-5 py-12 bg-white hover:bg-red-50 border-r-2 border-slate-100 hover:border-red-200 active:scale-[0.98] transition-all duration-150"
                >
                  <FaTimesCircle className="text-7xl text-slate-200 group-hover:text-red-400 transition-colors duration-150" />
                  <span className="text-3xl font-black text-slate-300 group-hover:text-red-500 tracking-wide transition-colors duration-150">
                    No
                  </span>
                </button>

                {/* YES */}
                <button
                  onClick={() => answer(true)}
                  className="group flex-1 flex flex-col items-center justify-center gap-5 py-12 bg-white hover:bg-emerald-50 hover:border-emerald-200 active:scale-[0.98] transition-all duration-150"
                >
                  <FaCheckCircle className="text-7xl text-slate-200 group-hover:text-emerald-400 transition-colors duration-150" />
                  <span className="text-3xl font-black text-slate-300 group-hover:text-emerald-600 tracking-wide transition-colors duration-150">
                    Yes
                  </span>
                </button>
              </div>
            </div>

            {/* Confirmed symptoms mini list */}
            {Object.keys(answers).some((k) => answers[k]) && (
              <div className="w-full shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Symptoms confirmed so far
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(answers).filter((k) => answers[k]).map((k) => (
                    <span key={k}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-1">
                      <FaCheckCircle className="text-emerald-400 text-[9px]" />
                      {fmt(k)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ RESULTS ══════════════════════════════════════════ */}
        {view === "results" && results && (
          <div className="space-y-4 animate-fade-in">

            {/* Summary banner */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#03045e] to-[#0096c7] flex items-center justify-center shrink-0">
                  <span className="text-xl">📋</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Assessment complete</p>
                  <p className="text-[11px] text-slate-400">
                    {results.yesKeys.length} of {QUESTIONS.length} symptoms confirmed
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full border uppercase tracking-wider ${results.priority.badge}`}>
                {results.priority.label}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* LEFT: predictions + confirmed */}
              <div className="lg:col-span-7 space-y-4">

                {/* Predictions */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5"
                    style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)" }}>
                    <span>🏆</span>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      Diagnostic Predictions
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {results.predictions.map((p, idx) => (
                      <div key={p.maladie} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={idx === 0 ? "text-[#03045e] font-black" : "text-slate-500"}>
                            {idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : "🥉 "}{p.label}
                          </span>
                          <span className={`font-bold ${idx === 0 ? "text-[#0077b6]" : "text-slate-400"}`}>
                            {p.confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${p.confidence}%`,
                              background: idx === 0
                                ? "linear-gradient(90deg,#03045e,#0096c7)"
                                : idx === 1 ? "#94a3b8" : "#cbd5e1",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmed symptoms */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5"
                    style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)" }}>
                    <span>✅</span>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Confirmed Symptoms</h2>
                  </div>
                  <div className="p-5">
                    {results.yesKeys.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {results.yesKeys.map((k) => (
                          <span key={k}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-1">
                            <FaCheckCircle className="text-[9px]" />
                            {fmt(k)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No symptoms confirmed.</p>
                    )}
                  </div>
                </div>

                {/* Restart */}
                <button onClick={restart}
                  className="btn-outline w-full flex items-center justify-center gap-2 text-xs py-2.5">
                  <FaRedo className="text-[10px]" /> Restart Assessment
                </button>
              </div>

              {/* RIGHT: room suggestion */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
                  <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#03045e,#0096c7)" }} />
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5"
                    style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)" }}>
                    <span>🏥</span>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      Suggested Room
                    </h2>
                  </div>
                  <div className="p-6">
                    {results.matchedClass ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Clinic Room</p>
                          <p className="text-3xl font-black text-[#0077b6]">
                            #{results.matchedClass.placeCode}
                          </p>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between text-xs gap-2 border-b border-slate-100 pb-2.5">
                            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                              <FaShieldAlt className="text-[#0077b6] text-[10px]" /> Target Condition
                            </span>
                            <span className="font-bold text-slate-700 text-right">{results.matchedClass.name}</span>
                          </div>
                          {results.matchedClass.description && (
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {results.matchedClass.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <span className="text-4xl">🔍</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          No quarantine room is mapped to this condition in your clinic setup.
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Configure rooms in Disease Classes settings.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DetectSickness;
