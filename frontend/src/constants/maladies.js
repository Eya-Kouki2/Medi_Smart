export const MALADIES = [
  { value: "grippe", label: "Grippe" },
  { value: "covid19", label: "COVID-19" },
  { value: "tuberculose", label: "Tuberculose" },
  { value: "asthme", label: "Asthme" },
  { value: "diabete", label: "Diabète" },
  { value: "hypertension", label: "Hypertension" },
  { value: "paludisme", label: "Paludisme" },
  { value: "dengue", label: "Dengue" },
  { value: "gastroenterite", label: "Gastro-entérite" },
  { value: "infection_respiratoire", label: "Infection respiratoire" },
  { value: "infection_urinaire", label: "Infection urinaire" },
  { value: "hepatite", label: "Hépatite" },
  { value: "drepanocytose", label: "Drépanocytose" },
  { value: "meningite", label: "Méningite" },
  { value: "rougeole", label: "Rougeole" },
  { value: "varicelle", label: "Varicelle" },
  { value: "diphterie", label: "Diphtérie" },
  { value: "typhoide", label: "Typhoïde" },
  { value: "cholera", label: "Choléra" },
  { value: "autre", label: "Autre" },
];

export const getMaladieLabel = (value) =>
  MALADIES.find((item) => item.value === value)?.label || value;
