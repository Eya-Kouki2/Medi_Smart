const PageHeader = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl font-bold text-health-navy tracking-tight">{title}</h1>
      {description && (
        <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;
