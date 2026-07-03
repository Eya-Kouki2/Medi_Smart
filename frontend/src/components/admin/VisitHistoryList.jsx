import { FaEdit } from "react-icons/fa";

export const formatVisitDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const HISTORY_BADGES = {
  visit: "bg-blue-50 text-blue-700 border-blue-100",
  diagnosis: "bg-purple-50 text-purple-700 border-purple-100",
  treatment: "bg-emerald-50 text-emerald-700 border-emerald-100",
  note: "bg-gray-50 text-gray-600 border-gray-100",
};

const hasTriageData = (entry) =>
  Boolean(entry.triage?.symptoms?.length || entry.triage?.predictions?.length || entry.triage?.vitals);

const EditButton = ({ onEdit, entry }) => {
  if (!onEdit) return null;
  return (
    <button
      type="button"
      onClick={() => onEdit(entry)}
      className="text-gray-400 hover:text-health-blue p-1 shrink-0"
      aria-label="Edit visit"
      title="Edit"
    >
      <FaEdit className="text-[11px]" />
    </button>
  );
};

const TriageVisitCard = ({ entry, onEdit }) => {
  const { triage } = entry;
  const vitals = [
    triage.vitals?.temperature?.trim() && `Temp ${triage.vitals.temperature}`,
    triage.vitals?.pulse?.trim() && `Pulse ${triage.vitals.pulse}`,
    triage.vitals?.bloodPressure?.trim() && `BP ${triage.vitals.bloodPressure}`,
    triage.vitals?.weight?.trim() && `Weight ${triage.vitals.weight}`,
    triage.vitals?.height?.trim() && `Height ${triage.vitals.height}`,
  ].filter(Boolean);

  return (
    <li className="rounded-xl border border-health-ice/80 bg-health-ice/20 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[11px] font-semibold text-health-navy">{formatVisitDateTime(entry.date)}</p>
          <span className="inline-flex mt-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-100">
            Visit
          </span>
        </div>
        <div className="flex items-start gap-1">
          {triage.priority && (
            <span className="text-[10px] text-gray-500 shrink-0">{triage.priority}</span>
          )}
          <EditButton onEdit={onEdit} entry={entry} />
        </div>
      </div>

      {vitals.length > 0 && (
        <p className="text-[10px] text-gray-500 mb-2">
          <span className="font-medium text-gray-600">Vitals: </span>
          {vitals.join(" · ")}
        </p>
      )}

      <div className="mb-2">
        <p className="text-[10px] font-medium text-gray-600 mb-1">Symptoms</p>
        {triage.symptoms?.length ? (
          <div className="flex flex-wrap gap-1">
            {triage.symptoms.map((symptom) => (
              <span
                key={symptom}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-health-navy"
              >
                {symptom}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400">—</p>
        )}
        {triage.duration?.trim() && (
          <p className="text-[10px] text-gray-500 mt-1">Duration: {triage.duration}</p>
        )}
        {triage.additionalNotes?.trim() && (
          <p className="text-[10px] text-gray-500 mt-1">{triage.additionalNotes}</p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-medium text-gray-600 mb-1">Predictions</p>
        {triage.predictions?.length ? (
          <ul className="space-y-1">
            {triage.predictions.map((item, index) => (
              <li
                key={`${item.maladie}-${index}`}
                className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-lg ${
                  index === 0 ? "bg-white border border-health-blue/30 font-semibold text-health-navy" : "text-gray-600"
                }`}
              >
                <span>{item.label}</span>
                <span className={index === 0 ? "text-health-blue" : "text-gray-400"}>{item.confidence}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-gray-400">—</p>
        )}
        {triage.suggestedClass?.name && (
          <p className="text-[10px] text-health-blue mt-1">
            Class: {triage.suggestedClass.name}
            {triage.suggestedClass.placeCode != null && ` · #${triage.suggestedClass.placeCode}`}
          </p>
        )}
      </div>
    </li>
  );
};

const LegacyHistoryCard = ({ entry, onEdit }) => (
  <li className="border-l-2 border-health-cyan pl-3">
    <div className="flex items-center justify-between gap-2 mb-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${
            HISTORY_BADGES[entry.type] || HISTORY_BADGES.note
          }`}
        >
          {entry.type}
        </span>
        <span className="text-[10px] text-gray-400">{formatVisitDateTime(entry.date)}</span>
      </div>
      <EditButton onEdit={onEdit} entry={entry} />
    </div>
    <p className="text-xs font-semibold text-health-navy">{entry.title}</p>
    {entry.notes && (
      <p className="text-[11px] text-gray-500 mt-0.5 whitespace-pre-line">{entry.notes}</p>
    )}
  </li>
);

const VisitHistoryList = ({ history = [], maxHeight = "max-h-56", emptyMessage = "No visits yet.", onEdit }) => {
  if (!history.length) {
    return <p className="text-[11px] text-gray-400">{emptyMessage}</p>;
  }

  const sorted = [...history].reverse();

  return (
    <ul className={`space-y-2.5 overflow-y-auto pr-1 ${maxHeight}`}>
      {sorted.map((entry) =>
        hasTriageData(entry) ? (
          <TriageVisitCard key={entry._id} entry={entry} onEdit={onEdit} />
        ) : (
          <LegacyHistoryCard key={entry._id} entry={entry} onEdit={onEdit} />
        )
      )}
    </ul>
  );
};

export default VisitHistoryList;
