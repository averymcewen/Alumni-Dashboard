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

const SOCPage: React.FC<Props> = ({ numPerProgram, department_id, departmentName, chartOptions }) => {

    const [data, setData] = useState({
        getApproval: [],
        SOCCert: [],
        SOCAI: []

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
            },
            datalabels: {
                display: false
            }
        },
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiService.getDeptInfo(department_id);
                setData(data);

                console.log(data);
            }
            catch (err) {
                console.error('Error loading ' + departmentName + ' page: ' + err);
            }
        };

        fetchData();
    }, [])



    const SOCAI = {
        labels: data.SOCAI?.map(item => item.value_text),
        datasets: [
            {
                label: 'Percent of Alumni',
                data: data.SOCAI?.map(item => item.percentage),
                backgroundColor: '#7a1e96',
                borderColor: '#4a0066',
                borderWidth: 2,

            },
        ],
    };

    const coloredPieChart = useMemo(() => {
        if (!SOCAI) return SOCAI;

        return {
            ...SOCAI,
            datasets: SOCAI.datasets?.map((ds: any) => ({
                ...ds,
                backgroundColor: SOCAI.labels?.map(
                    (_: string, idx: number) => colors[idx % colors.length]
                ),
                borderWidth: 0,
            })),
        };
    }, [SOCAI]);

    return (
        <div className="grid grid-cols-9 gap-6 mb-8">
            <PieChart
                data={numPerProgram}
                chartOptions={chartOptions}
                filterKey="department_id"
                filterValue={department_id}
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
                                            ? 'font-bold text-xl'
                                            : ''
                                            }`}
                                    >
                                        <span>{item.name}</span>
                                    </div>

                                    <span
                                        className={`flex items-center gap-3 ${data.getApproval[0]?.percentage === item.percentage
                                            ? 'font-bold text-xl'
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


            <div className="col-span-9">
                <ChartCard
                    title="Student Confidence in Pursuing Certification Post-Graduation">
                    <div className="space-y-3 min-w-full ">
                        {data.SOCCert?.map((item) => {
                            const maxNumAlum = data.SOCCert[0]?.percentage;
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
                                        <span>{item.value_text}</span>
                                    </div>

                                    <span
                                        className={`flex items-center gap-3 ${highlightClass}`}
                                    >
                                        {item.percentage} %
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                </ChartCard>
            </div>


            <div className="col-span-9">

                <ChartCard
                    title="AI Proficiency"
                >
                    <div className="space-y-3 min-w-full h-full self-start">

                        <div className="flex items-center gap-8">
                            <ul className="flex flex-col gap-3 shrink-0 w-100 align-center pl-25">
                                {SOCAI.labels?.map((labelHours: string, idx: number) => (
                                    <li key={labelHours} className="flex items-center gap-2 text-sm text-gray-700">
                                        <span
                                            className="inline-block w-3.5 h-3.5 rounded-sm shrink-0"
                                            style={{ backgroundColor: colors[idx % colors.length] }}
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

        </div>
    )
};

export default SOCPage;