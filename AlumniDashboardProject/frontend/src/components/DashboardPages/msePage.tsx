import StatCard from '../StatCard';
import { useState, useEffect, useMemo } from 'react';
import { Users, Briefcase, DollarSign, GraduationCap } from 'lucide-react';
import PieChart from './DashboardElements/PieChartPer';
import { alumniPerProgram } from '#/src/types';
import { Row } from './DashboardElements/PieChartPer';
import { apiService } from '../../../services/api';
import ChartCard from '../ChartCard';

import { Bar, Pie } from 'react-chartjs-2';


import { colors } from './DashboardElements/PieChartPer';

interface Props {
    numPerProgram: Row[];
    department_id: number;
    departmentName: string;
    chartOptions: any;
}

const MSEPage: React.FC<Props> = ({ numPerProgram, department_id, departmentName, chartOptions }) => {

    const [data, setData] = useState({
        getApproval: [],
        MSETools: [],
        MSEFactors: []

    });

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
                const data = await apiService.getDeptInfo(5);
                setData(data);

                console.log(data);
            }
            catch (err) {
                console.error('Error loading ' + departmentName + ' page: ' + err);
            }
        };

        fetchData();
    }, [])


    const MSEFactors = {
        labels: data.MSEFactors?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.MSEFactors?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,

            },
        ],
    };

    const coloredPieChart = useMemo(() => {
        if (!MSEFactors) return MSEFactors;

        return {
            ...MSEFactors,
            datasets: MSEFactors.datasets?.map((ds: any) => ({
                ...ds,
                backgroundColor: MSEFactors.labels?.map(
                    (_: string, idx: number) => colors[idx % colors?.length]
                ),
                borderWidth: 0,
            })),
        };
    }, [MSEFactors]);


    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
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

    const MSEFactorsBarData = {
        labels: data.MSEFactors?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.MSEFactors?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,
                maxBarThickness: 60,

            },
        ],
    };

    return (
        <div className="grid grid-cols-9 gap-6 mb-8">
            <PieChart
                data={numPerProgram}
                chartOptions={chartOptions}
                filterKey="department_id"
                filterValue={department_id || 5}
                title={`Recent Grads Per Program: ${departmentName}`}
                itemLabel="program"
            />


            <div className="col-span-3">
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
                                        <span>{item.name}</span>
                                    </div>

                                    <span
                                        className={`flex items-center gap-3 ${data.getApproval[0]?.percentage === item.percentage
                                            ? 'font-bold text-lg'
                                            : ''
                                            }`}
                                    >
                                        {item.percentage} %
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                </ChartCard>
            </div>




            <div className="col-span-6">
                <ChartCard title="Influential Factors in Choosing MSE">
                    <div className="relative w-full h-80">
                        <Bar
                            data={MSEFactorsBarData}
                            options={barChartOptions} />
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
                                        Effectiveness of Lab Tools
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.MSETools?.map((item) => (
                                    <tr key={item.value_text} className="border-b border-gray-300 drop-shadow-sm">
                                        <td className="px-6 py-3 w-full">{item.value_text}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>

        </div>
    )
};

export default MSEPage;