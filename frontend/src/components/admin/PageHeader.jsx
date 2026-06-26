const PageHeader = ({ title, description }) => (
  <div className="mb-4">
    <h1 className="text-base font-semibold text-health-navy">{title}</h1>
    {description && (
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    )}
  </div>
);

export default PageHeader;
