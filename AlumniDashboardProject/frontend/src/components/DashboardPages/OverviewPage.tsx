import { useMemo, useState, useRef, useEffect } from 'react';
import { averageSalaryPerTerm, careerOutlook, gradSchools } from '#/src/types';
import ChartCard from '../ChartCard';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  ChevronRight,
  ChevronLeft,
  Donut
} from "lucide-react";

import { colors } from './DashboardElements/PieChartPer';

import PieChart from './DashboardElements/PieChartPer';



const weatherIcons = {
  Sunny: Sun,
  "Partly Sunny": CloudSun,
  Fair: Sun,
  "Partly Cloudy": Cloud,
  Cloudy: CloudRain,
  Stormy: CloudLightning,
};


const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 0
  },
  plugins: {
    legend: {
      display: false
    }
  },
};

const barChartOptions = {
  responsive: false,
  maintainAspectRatio: true,
  scales: {
    y: {
      grace: 10,
      max: 100,
      ticks: {
        callback: function (value, index, ticks) {
          return value + '%';
        }
      }
    }
  }
};

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    let frame;
    const handleResize = () => {
      // rAF avoids thrashing on rapid resize events
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return size;
}

interface Props {
  numPerDepartment: any;
  salaryChartData: any;
  chartOptions: any;
  careerOutlook: careerOutlook[];
  postGradData: any;
  gradSchoolData: gradSchools[];
  averageSalaryPerTerm: any;
  primaryClassformat: any;
  top5Employers: any;
  employerByCounty: any;
  top5InternshipCo: any;
  internshipByLocation: any;
  programOfStudyApproval: any;
  programOfStudyImprovements: any;
  hoursWorked: any;
  gradDegreePursue: any;
  workExperience: any;
}


const OverviewElements: React.FC<Props> = ({
  numPerDepartment,
  salaryChartData,
  chartOptions,
  careerOutlook,
  postGradData,
  gradSchoolData,
  averageSalaryPerTerm,
  primaryClassformat,
  top5Employers,
  employerByCounty,
  top5InternshipCo,
  internshipByLocation,
  programOfStudyApproval,
  programOfStudyImprovements,
  hoursWorked,
  gradDegreePursue,
  workExperience
}) => {

  const salaryChartRef = useRef(null);
  const hoursChartRef = useRef(null);
  const workExpChartRef = useRef(null);
  const { width } = useWindowSize();

  useEffect(() => {
    salaryChartRef.current?.resize();
    hoursChartRef.current?.resize();
    workExpChartRef.current?.resize();
  }, [width]);

  const coloredSalaryData = useMemo(() => {
    if (!averageSalaryPerTerm) return averageSalaryPerTerm;

    return {
      ...averageSalaryPerTerm,
      datasets: averageSalaryPerTerm.datasets?.map((ds: any) => ({
        ...ds,
        backgroundColor: averageSalaryPerTerm.labels?.map(
          (_: string, idx: number) => colors[idx % colors.length]
        ),
        borderWidth: 0,
      })),
    };
  }, [averageSalaryPerTerm]);

  const coloredHours = useMemo(() => {
    if (!hoursWorked) return hoursWorked;

    return {
      ...hoursWorked,
      datasets: hoursWorked.datasets?.map((ds: any) => ({
        ...ds,
        backgroundColor: hoursWorked.labels?.map(
          (_: string, idx: number) => colors[idx % colors.length]
        ),
        borderWidth: 0,
      })),
    };
  }, [hoursWorked]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-6">

      <PieChart
        data={numPerDepartment}
        chartOptions={chartOptions}
        title="Alumni by Department"
        itemLabel="department"
      />

      <div className="sm:col-span-2 lg:col-span-3">
        <ChartCard
          title="Post-Graduation Destination"
          subtitle="Direction Post Grad per Alumni"
        >
          <div className="space-y-3 min-w-full h-full self-start">
            {postGradData?.map((item) => (
              <div
                key={item.destination_group}
                className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
              >
                <div className={`flex items-center gap-3 ${postGradData[0].destination_group === item.destination_group && 'font-bold text-lg'}`}>
                  <span>{item.destination_group}</span>
                </div>
                <div>
                  <span className={`flex items-center gap-3 ${postGradData[0].destination_group === item.destination_group && 'font-bold text-lg'}`}>
                    {item.pct_of_total} %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <ChartCard
          title="Career Outlook"
          subtitle="How alumni describe their career outlook"
        >
          <div className="space-y-3 min-w-full">
            {careerOutlook?.map((item) => {
              const Icon = weatherIcons[item.value_text] ?? Cloud;
              return (
                <div
                  key={item.value_text}
                  className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-yellow-500" />
                    <span>{item.value_text}</span>
                  </div>
                  <span className="font-semibold">{item.numAnswers} %</span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <ChartCard title="Primary Class Format">
          <div className="space-y-3 min-w-full h-full self-start">
            {primaryClassformat?.map((item) => (
              <div
                key={item.value_text}
                className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
              >
                <div className="flex items-center gap-3">
                  <span>{item.value_text}</span>
                </div>
                <span className="font-semibold">{item.percentage} %</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-9">
        <ChartCard
          title="Average Salary Range"
          subtitle="Average Reported Salary of Post-Graduation Employment"
        >
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <ul className="flex flex-col pl-0 sm:pl-0 gap-3 shrink-0 w-full sm:w-auto sm:min-w-40">
              {averageSalaryPerTerm.labels?.map((label: string, idx: number) => (
                <li key={label} className="flex items-center gap-2 text-sm text-gray-700">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: colors[idx % colors.length] }}
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <div className="relative w-full h-64 sm:h-80 flex-1">
              <Doughnut ref={salaryChartRef} options={donutOptions} data={coloredSalaryData} />
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-6">
        <ChartCard title="Top 5 Employers post-graduation">
          <div className="space-y-3 min-w-full self-start">
            {top5Employers?.map((item) => {
              const isTopTied = item.numAlum === top5Employers[0]?.numAlum;
              const highlightClass = isTopTied ? 'font-bold text-lg' : '';
              return (
                <div
                  key={item.value_text}
                  className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                >
                  <div className={`flex items-center gap-3 ${highlightClass}`}>
                    <span>{item.value_text}</span>
                  </div>
                  <span className={`flex items-center gap-3 ${highlightClass}`}>
                    {item.numAlum}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <ChartCard title="Employer by County">
          <div className="space-y-3 min-w-full self-start">
            {employerByCounty?.map((item) => {
              const isTopTied = item.numAlum === employerByCounty[0]?.numAlum;
              const highlightClass = isTopTied ? 'font-bold text-lg' : '';
              return (
                <div
                  key={item.value_text}
                  className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                >
                  <div className={`flex items-center gap-3 ${highlightClass}`}>
                    <span>{item.value_text}</span>
                  </div>
                  <span className={`flex items-center gap-3 ${highlightClass}`}>
                    {item.numAlum}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-6">
        <ChartCard title="Top 5 Internship Companies">
          <div className="space-y-3 min-w-full self-start">
            {top5InternshipCo?.map((item) => {
              const isTopTied = item.numAlum === top5InternshipCo[0]?.numAlum;
              const highlightClass = isTopTied ? 'font-bold text-lg' : '';
              return (
                <div
                  key={item.value_text}
                  className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                >
                  <div className={`flex items-center gap-3 ${highlightClass}`}>
                    <span>{item.value_text}</span>
                  </div>
                  <span className={`flex items-center gap-3 ${highlightClass}`}>
                    {item.numAlum}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <ChartCard title="Internship Locations">
          <div className="space-y-3 min-w-full self-start">
            {internshipByLocation?.map((item) => {
              const isTopTied = item.numAlum === internshipByLocation[0]?.numAlum;
              const highlightClass = isTopTied ? 'font-bold text-lg' : '';
              return (
                <div
                  key={item.value_text}
                  className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                >
                  <div className={`flex items-center gap-3 ${highlightClass}`}>
                    <span>{item.value_text}</span>
                  </div>
                  <span className={`flex items-center gap-3 ${highlightClass}`}>
                    {item.numAlum}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-9">
        <ChartCard title="Recommendation of Program of Study">
          <div className="space-y-3 min-w-full">
            {programOfStudyApproval?.map((item) => {
              const isTopTied = item.percentage === programOfStudyApproval[0]?.percentage;
              const highlightClass = isTopTied ? 'font-bold text-lg' : '';
              return (
                <div
                  key={item.value_text}
                  className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                >
                  <div className={`flex items-center gap-3 ${highlightClass}`}>
                    <span>{item.value_text}</span>
                  </div>
                  <span className={`flex items-center gap-3 ${highlightClass}`}>
                    {item.percentage} %
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-9">
        <ChartCard title="Program of Study Recommended Improvements">
          <div className="space-y-3 min-w-full h-full self-start">
            {programOfStudyImprovements?.map((item) => (
              <div
                key={item.value_text}
                className="flex items-start justify-between rounded-lg border p-3 pl-8 pr-8"
              >
                <div className="font-semibold">
                  <span>{item.value_text}</span>
                </div>
                <span className="font-semibold pl-15 text-nowrap">{item.percentage} %</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <ChartCard title="Top 5 Grad Schools" subtitle="Where Our Grads Are Going Next">
          <div className="space-y-3 min-w-full h-full self-start">
            {gradSchoolData?.map((item) => (
              <div
                key={item.value_text}
                className="flex items-start justify-between rounded-lg border p-3 pl-8 pr-8"
              >
                <div className="gap-3">
                  <span>{item.value_text}</span>
                </div>
                <span className="font-semibold">{item.numStudentsPerSchool} Alumni</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="sm:col-span-2 lg:col-span-6">
        <ChartCard title="Hours Worked During Program Completion">
          <div className="space-y-3 min-w-full h-full self-start">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ul className="flex flex-col gap-3 shrink-0 w-full lg:w-auto lg:min-w-40">
                {hoursWorked.labels?.map((labelHours: string, idx: number) => (
                  <li key={labelHours} className="flex items-center gap-2 text-sm text-gray-700">
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-sm shrink-0"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    <span>{labelHours}</span>
                  </li>
                ))}
              </ul>

              <div className="relative w-full h-64 lg:h-80 flex-1">
                <Doughnut ref={hoursChartRef} options={donutOptions} data={coloredHours} />
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="col-span-1 sm:col-span-2 lg:col-span-4">
        <ChartCard title="Graduate Degrees to be Pursued">
          <div className="space-y-3 min-w-full h-full self-start">
            {gradDegreePursue?.map((item) => {
              const isTopTied = item.percentage === gradDegreePursue[0]?.percentage;
              const highlightClass = isTopTied ? 'font-bold text-lg' : '';
              return (
                <div
                  key={item.value_text}
                  className="flex items-end justify-between rounded-lg border p-3 pl-8 pr-8"
                >
                  <div className={`${highlightClass}`}>
                    <span>{item.value_text}</span>
                  </div>
                  <span className={`font-semibold pl-4 text-nowrap ${highlightClass}`}>
                    {item.percentage} %
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <div className="col-span-1 sm:col-span-2 lg:col-span-5">
        <ChartCard title="Work Experience Related to Field of Study">
          <div className="space-y-3 min-w-full h-full self-start">
            <div className="relative w-full h-64 sm:h-72">
              <Bar ref={workExpChartRef} data={workExperience} options={barChartOptions} />
            </div>
          </div>
        </ChartCard>
      </div>

    </div>
  )
};

export default OverviewElements;