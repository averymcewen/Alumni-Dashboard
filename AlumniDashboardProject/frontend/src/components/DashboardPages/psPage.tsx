import StatCard from '../StatCard';
import { useState, useEffect, useMemo } from 'react';
import { Users, Briefcase, DollarSign, GraduationCap } from 'lucide-react';
import PieChart from './DashboardElements/PieChartPer';
import { alumniPerProgram } from '#/src/types';
import { Row } from './DashboardElements/PieChartPer';
import { apiService } from '../../../services/api';
import ChartCard from '../ChartCard';

import { Pie } from 'react-chartjs-2';
import { colors } from './DashboardElements/PieChartPer';

interface Props {
    numPerProgram: Row[];
    department_id: number;
    departmentName: string;
    chartOptions: any;
}

const PSPage: React.FC<Props> = ({ numPerProgram, department_id, departmentName, chartOptions }) => {

    const [data, setData] = useState({
        getApproval: [],
        PSModel: [],
        PSdeca: []

    });

    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await apiService.getDeptInfo(7);
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

    const PSModels = {
        labels: data.PSModel?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.PSModel?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                datalabels: {
                    display: false
                }
            },
        ],
    };

    const coloredPieChart = useMemo(() => {
        if (!PSModels) return PSModels;

        return {
            ...PSModels,
            datasets: PSModels.datasets?.map((ds: any) => ({
                ...ds,
                backgroundColor: PSModels.labels?.map(
                    (_: string, idx: number) => colors[idx % colors?.length]
                ),
                borderWidth: 0,
            })),
        };
    }, [PSModels]);

    return (
        <div className="grid grid-cols-9 gap-6 mb-8">
            {loading ? (<div className="animate-pulse space-y-6">
                <div className="grid grid-cols-9 gap-6">
                    {[...Array(4)]?.map((_, i) => (
                        <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
            </div>) : (<>
                <PieChart
                    data={numPerProgram}
                    chartOptions={chartOptions}
                    filterKey="department_id"
                    filterValue={department_id || 7}
                    title={`Recent Grads Per Program: ${departmentName}`}
                    itemLabel="program"
                />

                <div className="col-span-9">
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


                <div className="col-span-9">

                    <ChartCard
                        title="Post-Graduation Sales Model"
                    >
                        <div className="space-y-3 min-w-full h-full self-start">

                            <div className="flex items-center gap-8">
                                <ul className="flex flex-col gap-3 shrink-0 w-100 align-center pl-25">
                                    {PSModels.labels?.map((labelHours: string, idx: number) => (
                                        <li key={labelHours} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span
                                                className="inline-block w-3.5 h-3.5 rounded-sm shrink-0"
                                                style={{ backgroundColor: colors[idx % colors?.length] }}
                                            />
                                            <span>{labelHours}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="relative h-80 flex-1">
                                    <Pie
                                        options={pieOptions}
                                        data={coloredPieChart}
                                    />
                                </div>
                            </div>
                        </div>
                    </ChartCard>
                </div>




                <div className="col-span-9">
                    <ChartCard
                        title=""
                        contentClassName="w-full"
                    >
                        <div className="text-left w-full min-h-50">
                            <table className="w-full table-fixed">
                                <thead>
                                    <tr>
                                        <th className="font-semibold text-lg text-gray-900 text-left py-3 w-full">
                                            Professional Sales Competition Impact on Industry Readiness
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.PSdeca?.map((item) => (
                                        <tr key={item.value_text} className="border-b border-gray-300 drop-shadow-sm">
                                            <td className="px-6 py-3 w-full">{item.value_text}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </div> </>)}

        </div>
    )
};

export default PSPage;