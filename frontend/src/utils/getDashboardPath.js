export const getDashboardPath = (role) => {
  if (role === "admin") return "/admin";
  if (role === "nurses") return "/nurses";
  if (role === "triage") return "/triage";
  if (role === "pharmacy") return "/pharmacy";
  return "/login";
};
