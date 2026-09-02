import { useEffect, useState, useMemo } from 'react';
import { apiService } from '../../../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend

} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { FlipHorizontal } from 'lucide-react';
import ChartCard from '../ChartCard';

import { colors } from './DashboardElements/PieChartPer';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels  // add this
);

import GaugeChart from './DashboardElements/gaugeChart';


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);
interface Props {

}

const EastInsights: React.FC = ({ }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        effectivefactors: [],
        topEffectiveFactors: [],
        rankEffective: [],
        eastStudentServices: [],
        engagedLearning: [],
        studentConfidence: [],
        age: [],
        gender: [],
        veteran: []
    });

    const stackedBarChartOptions = {
        type: 'bar',
        indexAxis: 'y' as const,
        plugins: {
            datalabels: {
                formatter: (value: number) => {
                    const num = Number(value);
                    return !isNaN(num) && num > 0 ? `${num.toFixed(0)}%` : '';
                },
                color: 'white',
            }
        },
        responsive: true,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        }

    };



    const eastStudentServicesOptions = {
        type: 'bar',
        indexAxis: 'y' as const,
        plugins: {
            datalabels: {
                formatter: (value: number) => {
                    const num = Number(value);
                    return !isNaN(num) && num > 5 ? `${num.toFixed(0)}%` : '';
                },
                color: 'white',
            }
        },
        responsive: true,
        scales: {
            x: {
                stacked: true,
                max: 100,
                ticks: {
                    callback: function (value, index, ticks) {
                        return value + '%';
                    }
                }
            },
            y: {
                stacked: true,
            },
        },
    }


    const pieOptions = {
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
        responsive: true,
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
        },
        plugins: {
            datalabels: {
                formatter: (value: number) => {
                    const num = Number(value);
                    return !isNaN(num) && num > 15 ? `${num.toFixed(0)}%` : '';
                },
                color: 'white',
            }
        }
    };

    const ageStats = {
        labels: data.age?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.age?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,

            },
        ],
    };

    const engagedLearning = {
        labels: data.engagedLearning?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.engagedLearning?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    display: false
                }
            },
        ],
    };

    const coloredLearningExperiences = useMemo(() => {
        if (!engagedLearning) return engagedLearning;

        return {
            ...engagedLearning,
            datasets: engagedLearning.datasets?.map((ds: any) => ({
                ...ds,
                backgroundColor: engagedLearning.labels?.map(
                    (_: string, idx: number) => colors[idx % colors?.length]
                ),
                borderWidth: 0,
            })),
        };
    }, [engagedLearning]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const statsData = await apiService.getEastInsights();

                setData(statsData);
                console.log(statsData);

            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const ANSWER_KEYS = [
        { key: 'not_at_all_effective_pct', label: 'Not at all Effective', color: '#4a0066' },
        { key: 'slightly_effective_pct', label: 'Slightly Effective', color: '#7a1e96' },
        { key: 'moderately_effective_pct', label: 'Moderately Effective', color: '#9f50b8' },
        { key: 'effective_pct', label: 'Effective', color: '#b470c9' },
        { key: 'very_effective_pct', label: 'Very Effective', color: '#cba1d8' },
    ];

    const barData = {
        labels: data.effectivefactors?.map(item => item.subquestion_text),
        datasets: ANSWER_KEYS?.map(({ key, label, color }) => ({
            label,
            data: data.effectivefactors?.map(item => parseFloat(item[key])),
            backgroundColor: color,
        })),
    };

    const eastStudentServicesBar = {
        labels: data.eastStudentServices?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.eastStudentServices?.map(item => Number(item.percentage)),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    color: 'white',
                },
                barThickness: 40,
                categoryPercentage: 0.8,
                // Bar percentage is the thickness of the bar inside that category (default: 0.9)
                barPercentage: 1,
            },
        ],
    };




    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-6">
            {loading ? (
                <div className="space-y-6 col-span-full">
                    {/* Stat card row -- its own grid, matching the real 4-card row exactly
            instead of forcing 9 columns to divide evenly into 4 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="skeleton h-4 w-24"></div>
                                        <div className="skeleton h-7 w-16"></div>
                                    </div>
                                    <div className="skeleton h-12 w-12 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart panel row -- mirrors the real 3x col-span-3 layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="card lg:col-span-3">
                                <div className="skeleton h-5 w-2/3 mb-2"></div>
                                <div className="skeleton h-4 w-1/2 mb-4"></div>
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="skeleton h-4 w-24"></div>
                                            <div className="skeleton h-4 w-10"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <> <div className="col-span-1 md:col-span-2 lg:col-span-9">
                    <ChartCard
                        title="Student Insight on EAST Programs">
                        <div className="w-full overflow-x-auto">
                            <Bar options={stackedBarChartOptions} data={barData} />
                        </div>
                    </ChartCard>
                </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-9">
                        <ChartCard
                            title="Student Ranking of EAST Effectiveness">
                            <div className="space-y-3 min-w-full h-full self-start overflow-x-auto">

                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead >
                                        <tr >
                                            <th className="px-6 py-3 ">Factor</th>
                                            <th className="px-6 py-6 text-nowrap">1st</th>
                                            {/* <th className="px-6 py-3 ">2nd</th>
                                    <th className="px-6 py-3 ">3rd</th> */}
                                            <th className="px-6 py-3">Percent ranked "Extremely Efficient"</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.topEffectiveFactors?.map((item) => {
                                            return (
                                                <tr className="items-center" key={item.value_text}>
                                                    <td
                                                        className="px-6 py-3 "
                                                    ><span>{item.subquestion_text}</span></td>
                                                    <td className="text-center px-6 py-3 text-nowrap"><span>{item.rank1_pct} %</span></td>
                                                    <td className="text-center px-6 py-3"><span>{item.extremely_effective_pct} %</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-5">
                        <ChartCard
                            title="Student's Top 3 Important Factors"
                        >
                            <div className="space-y-3 min-w-full h-full self-start overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead >
                                        <tr >
                                            <th className="px-6 py-3 ">Factor</th>
                                            <th className="px-6 py-3 ">Percent of Respondents</th>
                                            <th className="px-6 py-3 ">Total times chosen in top 3</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.rankEffective?.map((item) => {
                                            return (
                                                <tr className="items-center" key={item.value_text}>
                                                    <td
                                                        className="px-6 py-3 "
                                                    ><span>{item.subquestion_text}</span></td>
                                                    <td className="text-center px-6 py-3"><span>{item.pctOfRespondents} %</span></td>
                                                    <td className="text-center px-6 py-3"><span>{item.timesChosenInTop3}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-4 ">
                        <ChartCard
                            title="Utilized EAST Services">
                            <div className="relative w-full h-64 sm:h-80">
                                <Bar
                                    data={eastStudentServicesBar}
                                    options={eastStudentServicesOptions} />
                            </div>
                        </ChartCard>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-9">
                        <ChartCard
                            title="Student Confidence"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {data.studentConfidence?.map((item) => (
                                    <GaugeChart
                                        key={item.subquestion_text}
                                        value={Number(item.average)}
                                        label={item.subquestion_text}
                                        hoverLabel={"TEST"}
                                    />
                                ))}
                            </div>
                        </ChartCard>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-9">
                        <ChartCard
                            title="Utilized Engaged Learning Experiences by Percent"
                        >
                            <div className="space-y-3 min-w-full h-full self-start">
                                <div className="flex flex-col lg:flex-row items-center gap-8 w-full min-w-0">
                                    <ul className="flex flex-col gap-3 shrink-0 w-full lg:w-auto lg:min-w-40 lg:pl-25 min-w-0">
                                        {engagedLearning.labels?.map((labelHours: string, idx: number) => (
                                            <li key={labelHours} className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                                                <span
                                                    className="inline-block w-3.5 h-3.5 rounded-sm shrink-0"
                                                    style={{ backgroundColor: colors[idx % colors?.length] }}
                                                />
                                                <span className="truncate">{labelHours}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="relative w-full h-64 lg:h-80 flex-1 min-w-0">
                                        <Pie
                                            options={pieOptions}
                                            data={coloredLearningExperiences}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ChartCard>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <ChartCard
                            title="Gender"
                        >
                            <div className="space-y-3 min-w-full ">
                                {data.gender?.map((item) => {
                                    const maxNumAlum = data.gender[0]?.percentage;
                                    const isTopTied = item.percentage === maxNumAlum;
                                    const highlightClass = isTopTied ? 'font-bold text-lg' : '';

                                    return (
                                        <div
                                            key={item.value_text}
                                            className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                                        >
                                            <div className={`flex items-center gap-3 ${highlightClass} `}>
                                                <span>{item.value_text}</span>
                                            </div>

                                            <span className={`flex items-center gap-3 ${highlightClass} `}>
                                                {item.percentage} %
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </ChartCard>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <ChartCard
                            title="Age">
                            <div className="relative w-full h-64 sm:h-72">
                                <Bar
                                    data={ageStats}
                                    options={barChartOptions} />
                            </div>
                        </ChartCard>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <ChartCard
                            title="Veteran Status"
                        >
                            <div className="space-y-3 min-w-full ">
                                {data.veteran?.map((item) => {
                                    const maxNumAlum = data.veteran[0]?.percentage;
                                    const isTopTied = item.percentage === maxNumAlum;
                                    const highlightClass = isTopTied ? 'font-bold text-lg' : '';

                                    return (
                                        <div
                                            key={item.value_text}
                                            className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                                        >
                                            <div className={`flex items-center gap-3 ${highlightClass} `}>
                                                <span>{item.value_text}</span>
                                            </div>

                                            <span className={`flex items-center gap-3 ${highlightClass} `}>
                                                {item.percentage} %
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </ChartCard>
                    </div></>)}


        </div>
    )
}

export default EastInsights;