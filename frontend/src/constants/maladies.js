export const MALADIES = [
  { value: "cida", label: "CIDA (AIDS)" },
  { value: "malaria", label: "Malaria" },
  { value: "tuberculos", label: "Tuberculosis" },
  { value: "autre", label: "Other" },
];

export const getMaladieLabel = (value) =>
  MALADIES.find((item) => item.value === value)?.label || value;

