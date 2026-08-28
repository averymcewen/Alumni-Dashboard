import StatCard from '../StatCard';
import { Users, Briefcase, DollarSign, GraduationCap } from 'lucide-react';

const OverviewTab = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <StatCard
      title="Total Alumni"
      value={stats.totalAlumni.toLocaleString()}
      icon={Users}
    />

    <StatCard
      title="Employment Rate"
      value={`${stats.employmentRate}%`}
      icon={Briefcase}
    />

    <StatCard
      title="Average Salary"
      value={`$${stats.averageSalary.toLocaleString()}`}
      icon={DollarSign}
    />
  </div>
);

export default OverviewTab;