import PageHeader from "./PageHeader";

const PlaceholderPage = ({ title, description }) => (
  <div>
    <PageHeader title={title} description={description} />
    <div className="admin-card p-6 text-center">
      <p className="text-xs text-gray-400">Coming soon.</p>
    </div>
  </div>
);

export default PlaceholderPage;
