export const getDashboardPath = (role) => {
  if (role === "admin") return "/admin";
  if (role === "nurses") return "/nurses";
  if (role === "triage") return "/triage";
  if (role === "pharmacy") return "/pharmacy";
  return "/login";
};

export const getPostLoginPath = (user) => {
  if (user.role === "admin") {
    return user.area ? "/admin" : "/admin/setup";
  }
  return getDashboardPath(user.role);
};
