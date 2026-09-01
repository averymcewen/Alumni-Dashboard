import React, { useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';


import { DashboardStats, EmploymentByMajorData, SalaryByMajorData } from '../types/';
import PageHeader from '../components/PageHeader';
import { apiService } from '../../services/api';

import { OverviewElements, AUTOPage, CBSPage, ECEPage, MEPage, MSEPage, PSPage, SOCPage, EastInsights, GradPrograms } from './export';

// Register ChartJS components
ChartJS.register(ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);
ChartJS.register(Filler);

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalAlumni: 0,
        averageSalary: 0,
        gradSchoolRate: 0,
        overviewPerDept: [],
        alumniPerProgram: [],
        careerOutlook: [],
        postGradData: [],
        gradSchools: [],
        averageSalaryPerTerm: [],
        primaryClassFormat: [],
        top5Employers: [],
        employerByCounty: [],
        top5InternshipCo: [],
        internshipByLocation: [],
        programOfStudyApproval: [],
        programOfStudyImprovements: [],
        hoursWorked: [],
        gradDegreePursue: [],
        workExperience: []
    });


    const tabPages = {
        overview: OverviewElements,
        insights: EastInsights,
        grad: GradPrograms,
        auto: AUTOPage,
        soc: SOCPage,
        ece: ECEPage,
        cbs: CBSPage,
        me: MEPage,
        mse: MSEPage,
        ps: PSPage,
    } as const;

    type Tab = keyof typeof tabPages;

    const [activeTab, setActiveTab] = useState<Tab>("overview");

    let socRow = null;
    let autoRow = null;
    let cbsRow = null;
    let eceRow = null;
    let mseRow = null;
    let meRow = null;
    let psRow = null;


    const defineDepartments = async () => {
        // these are used for assigning the correct department per tab
        socRow = stats.alumniPerProgram?.find(r => r.department_id === 1);
        autoRow = stats.alumniPerProgram?.find(r => r.department_id === 2);
        cbsRow = stats.alumniPerProgram?.find(r => r.department_id === 3);
        eceRow = stats.alumniPerProgram?.find(r => r.department_id === 4);
        mseRow = stats.alumniPerProgram?.find(r => r.department_id === 5);
        meRow = stats.alumniPerProgram?.find(r => r.department_id === 6);
        psRow = stats.alumniPerProgram?.find(r => r.department_id === 7);
    }

    const departmentPages = {
        auto: {
            label: "Automotive Technology",
            component: AUTOPage,
            department: autoRow,
        },
        cbs: {
            label: "Construction & Building Sciences",
            component: CBSPage,
            department: cbsRow,
        },
        ece: {
            label: "Electrical & Computer Engineering",
            component: ECEPage,
            department: eceRow,
        },
        mse: {
            label: "Manufacturing & Systems Engineering",
            component: MSEPage,
            department: mseRow,
        },
        me: {
            label: "Mechanical Engineering",
            component: MEPage,
            department: meRow,
        },

        ps: {
            label: "Professional Sales",
            component: PSPage,
            department: psRow,
        },
        soc: {
            label: "School of Computing",
            component: SOCPage,
            department: socRow,
        }
    } as const;

    type Department = keyof typeof departmentPages;

    const activeDepartment =
        activeTab !== "overview"
            ? departmentPages[activeTab]
            : null;

    const ActiveDepartmentPage = activeDepartment?.component;





    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const statsData = await apiService.getDashboardStats();

                setStats(statsData);

            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        defineDepartments();
    }, []);


    const careerOutlookData = {
        labels: stats.careerOutlook?.map(item => item.value_text),
        datasets: [
            {
                label: 'Average Salary ($)',
                data: stats.careerOutlook?.map(item => item.numAnswers),
                backgroundColor: '#38b2ac',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    display: false
                }
            },
        ],
    };



    const averageSalaryPerTerm = {
        labels: stats.averageSalaryPerTerm?.map(item => item.value_text),
        datasets: [
            {
                label: 'Average Salary',
                data: stats.averageSalaryPerTerm?.map(item => item.numAlum),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    display: false
                }
            },
        ],
    };

    const hoursWorked = {
        labels: stats.hoursWorked?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: stats.hoursWorked?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    display: false
                }
            },
        ],
    };

    const workExperience = {
        labels: stats.workExperience?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: stats.hoursWorked?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    display: false
                }
            },
        ],
    };


    const gradSchoolData = {
        labels: stats.gradSchools?.map(item => item.value_text),
        datasets: [
            {
                label: 'Average Salary ($)',
                data: stats.gradSchools?.map(item => item.numStudentsPerSchool),
                backgroundColor: '#38b2ac',
                borderColor: '#4a0066',
                borderWidth: 2,
            },
        ],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            datalabels: {
                display: false
            }
        },
    };


    const isDepartmentTab = activeTab in departmentPages;

    return (
        <div className="animate-fade-in">
            <div className="">
                <PageHeader
                    title="Alumni Dashboard"
                    description={
                        activeTab === 'overview'
                            ? 'Overview of Alumni'
                            : activeTab === 'grad'
                                ? 'Graduate Program Insights'
                                : activeTab === 'insights'
                                    ? 'Insights on College of EAST'
                                    : ''
                    }
                />

                <div className="flex h-12 items-end space-x-4 border-b mb-6 ">
                    {/* Overview */}
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`pb-2 px-4 text-sm font-medium border-b-2 transition ${activeTab === "overview"
                            ? "border-weber-purple text-weber-purple"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Overview
                    </button>

                    <button
                        onClick={() => setActiveTab("insights")}
                        className={`pb-2 px-4 text-sm font-medium border-b-2 transition ${activeTab === "insights"
                            ? "border-weber-purple text-weber-purple"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        EAST Insights
                    </button>

                    <button
                        onClick={() => setActiveTab("grad")}
                        className={`pb-2 px-4 text-sm font-medium border-b-2 transition ${activeTab === "grad"
                            ? "border-weber-purple text-weber-purple"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Graduate Programs
                    </button>

                    {/* Departments dropdown */}
                    <div className="relative h-full flex items-end">
                        <select
                            value={isDepartmentTab ? activeTab : ""}
                            onChange={(e) => {
                                setActiveTab(e.target.value as Department);
                            }}
                            className={`pb-2 px-4 text-sm font-medium bg-transparent border-b-2 outline-none cursor-pointer ${isDepartmentTab
                                ? "border-weber-purple text-weber-purple"
                                : "border-transparent text-gray-500"
                                }`}
                        >
                            <option value="" disabled>
                                Select a Department...
                            </option>

                            {Object.entries(departmentPages)?.map(([key, department]) => (
                                <option key={key} value={key}>
                                    {department.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)]?.map((_, i) => (
                            <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-64 bg-gray-200 rounded-lg"></div>
                        <div className="h-64 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            ) : (

                <>
                    {activeTab === "overview" ? (
                        <OverviewElements
                            numPerDepartment={stats.overviewPerDept}
                            salaryChartData={careerOutlookData}
                            chartOptions={chartOptions}
                            careerOutlook={stats.careerOutlook}
                            postGradData={stats.postGradData}
                            gradSchoolData={stats.gradSchools}
                            averageSalaryPerTerm={averageSalaryPerTerm}
                            primaryClassformat={stats.primaryClassFormat}
                            top5Employers={stats.top5Employers}
                            employerByCounty={stats.employerByCounty}
                            top5InternshipCo={stats.top5InternshipCo}
                            internshipByLocation={stats.internshipByLocation}
                            programOfStudyApproval={stats.programOfStudyApproval}
                            programOfStudyImprovements={stats.programOfStudyImprovements}
                            hoursWorked={hoursWorked}
                            gradDegreePursue={stats.gradDegreePursue}
                            workExperience={workExperience}
                        />
                    ) :
                        activeTab === "insights" ? (
                            <EastInsights />

                        ) :
                            activeTab === "grad" ? (
                                <GradPrograms />

                            )
                                : ActiveDepartmentPage ? (
                                    <ActiveDepartmentPage
                                        numPerProgram={stats.alumniPerProgram}
                                        department_id={activeDepartment.department?.department_id}
                                        departmentName={activeDepartment.department?.department_name}
                                        chartOptions={chartOptions}
                                    />
                                ) : "No Departments Found"}
                </>
            )}

        </div>
    );
};

export default Dashboard;