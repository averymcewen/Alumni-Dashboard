import StatCard from '../StatCard';
import { useState, useEffect } from 'react';
import { Users, Briefcase, DollarSign, GraduationCap } from 'lucide-react';
import PieChart from './DashboardElements/PieChartPer';
import { alumniPerProgram } from '#/src/types';
import { Row } from './DashboardElements/PieChartPer';
import { apiService } from '../../../services/api';
import ChartCard from '../ChartCard';

import { Bar } from 'react-chartjs-2';

interface Props {
    numPerProgram: Row[];
    department_id: number;
    departmentName: string;
    chartOptions: any;
}

const ECEPage: React.FC<Props> = ({ numPerProgram, department_id, departmentName, chartOptions }) => {

    const [data, setData] = useState({
        getApproval: [],
        ECEFactors: [],
        ECELicensure: [],

    });

    const [loading, setLoading] = useState(false);

    const stackedBarChartOptions = {
        type: 'bar',
        indexAxis: 'y' as const,
        beginAtZero: true,
        plugins: {
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
        }

    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await apiService.getDeptInfo(4);
                setData(data);

                console.log(data);
            }
            catch (err) {
                console.error('Error loading ' + departmentName + ' page: ' + err);
            }
            finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [])

    const EceFactors = {
        labels: data.ECEFactors?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.ECEFactors?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    formatter: (value: number) => {
                        const num = Number(value);
                        return !isNaN(num) && num > 0 ? `${num.toFixed(0)}%` : '';
                    },
                    color: 'white',
                }
            },
        ],
    };

    const ECELicensure = {
        labels: data.ECELicensure?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.ECELicensure?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,

            },
        ],
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-9 gap-6 mb-8">

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
                <>

                    <PieChart
                        data={numPerProgram}
                        chartOptions={chartOptions}
                        filterKey="department_id"
                        filterValue={department_id || 4}
                        title={`Recent Grads Per Program: ${departmentName}`}
                        itemLabel="program"
                    />

                    <div className="col-span-1 md:col-span-3">
                        <ChartCard
                            title="Recommendation of Program of Study">
                            <div className="space-y-3 min-w-full ">
                                {data.getApproval?.map((item) => {
                                    return (
                                        <div
                                            key={item.name}
                                            className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                                        >
                                            <div
                                                className={`flex items-center gap-3 ${data.getApproval[0]?.name === item.name
                                                    ? 'font-bold text-lg'
                                                    : ''
                                                    }`}
                                            >
                                                <span>{item.name || `No data found`}</span>
                                            </div>

                                            <span
                                                className={`flex items-center gap-3 ${data.getApproval[0]?.percentage === item.percentage
                                                    ? 'font-bold text-lg'
                                                    : ''
                                                    }`}
                                            >
                                                {item.percentage && (
                                                    <>{item.percentage} %</>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                        </ChartCard>
                    </div>



                    <div className="col-span-1 md:col-span-6">
                        <ChartCard
                            title="Influential Factors in Choosing ECE"
                        >
                            <div className="space-y-3 min-w-full h-full self-start min-h-[250px]">


                                <div className="relative flex-1">
                                    <Bar
                                        data={EceFactors}
                                        options={stackedBarChartOptions} />
                                </div>
                            </div>
                        </ChartCard>
                    </div>


                    <div className="col-span-1 md:col-span-9">
                        <ChartCard
                            title="Student Confidence in Pursuing Certification Post-Graduation">
                            <div className="space-y-3 min-w-full ">
                                {data.ECELicensure?.map((item) => {
                                    const maxNumAlum = data.ECELicensure[0]?.percentage;
                                    const isTopTied = item.percentage === maxNumAlum;
                                    const highlightClass = isTopTied ? 'font-bold text-lg' : '';

                                    return (
                                        <div
                                            key={item.name}
                                            className="flex items-center justify-between rounded-lg border p-3 pl-8 pr-8"
                                        >
                                            <div
                                                className={`flex items-center gap-3 ${highlightClass}`}
                                            >
                                                <span>{item.value_text || `No data found`}</span>
                                            </div>

                                            <span
                                                className={`flex items-center gap-3 ${highlightClass}`}
                                            >
                                                {item.percentage && (
                                                    <>{item.percentage} %</>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                        </ChartCard>
                    </div></>)}

        </div>
    )
};

export default ECEPage;