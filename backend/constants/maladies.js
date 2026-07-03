const MALADIES = [
    { value: 'grippe', label: 'Influenza (Flu)' },
    { value: 'covid19', label: 'COVID-19' },
    { value: 'tuberculose', label: 'Tuberculosis' },
    { value: 'asthme', label: 'Asthma' },
    { value: 'diabete', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hypertension' },
    { value: 'paludisme', label: 'Malaria' },
    { value: 'dengue', label: 'Dengue' },
    { value: 'gastroenterite', label: 'Gastroenteritis' },
    { value: 'infection_respiratoire', label: 'Respiratory infection' },
    { value: 'infection_urinaire', label: 'Urinary tract infection' },
    { value: 'hepatite', label: 'Hepatitis' },
    { value: 'drepanocytose', label: 'Sickle-cell disease' },
    { value: 'meningite', label: 'Meningitis' },
    { value: 'rougeole', label: 'Measles' },
    { value: 'varicelle', label: 'Chickenpox' },
    { value: 'diphterie', label: 'Diphtheria' },
    { value: 'typhoide', label: 'Typhoid fever' },
    { value: 'cholera', label: 'Cholera' },
    { value: 'mpox', label: 'Mpox' },
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

