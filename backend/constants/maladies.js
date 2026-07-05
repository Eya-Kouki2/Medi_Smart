const MALADIES = [
    { value: 'cida', label: 'CIDA (AIDS)' },
    { value: 'malaria', label: 'Malaria' },
    { value: 'tuberculos', label: 'Tuberculosis' },
    { value: 'autre', label: 'Other' },
];

const MALADIE_VALUES = MALADIES.map((item) => item.value);

const getMaladieLabel = (value) =>
    MALADIES.find((item) => item.value === value)?.label || value;

module.exports = {
    MALADIES,
    MALADIE_VALUES,
    getMaladieLabel,
};

