import ChartCard from "../ChartCard";
import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { apiService } from '../../../services/api';
import PercentageDial from "./DashboardElements/percentageDial";


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface Props {
    gradSchoolData: any;
    overallQuality: any;
    gradSchoolRecommend: any;
    gradschoolEffective: any;
}

const GradPrograms: React.FC = ({
}) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        gradStudentEffective: [],
        overallQuality: [],
        gradSchoolRecommend: [],
        gradschoolEffective: []
    });

    const stackedBarChartOptions = {
        type: 'bar',
        indexAxis: 'y' as const,
        grace: 0,
        beginAtZero: true,
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
                max: 100
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
                const statsData = await apiService.getGradPrograms();

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
        labels: data.gradStudentEffective?.map(item => item.subquestion_text),
        datasets: ANSWER_KEYS?.map(({ key, label, color }) => ({
            label,
            data: data.gradStudentEffective?.map(item => parseFloat(item[key])),
            backgroundColor: color,
        })),
    };




    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-6">


            <div className="col-span-1 md:col-span-1 lg:col-span-5">
                <ChartCard
                    title="Overall Quality of Graduate Education from EAST">

                    <div className="space-y-3 min-w-full pl-20 pr-20 self-start">
                        {data.overallQuality?.map((item) => {
                            const maxNumAlum = data.overallQuality[0]?.percentage;
                            const isTopTied = item.percentage === maxNumAlum;
                            const highlightClass = isTopTied ? 'font-bold text-lg' : '';

                            return (
                                <div className="flex items-end justify-between rounded-lg border p-3 pl-8 pr-8">
                                    <div className={`${highlightClass}`}>{item.value_text}</div>
                                    <div className={`${highlightClass}`}>{item.percentage} %</div>

                                </div>
                            )
                        })}

                    </div>

                </ChartCard>

            </div>

            <div className="col-span-1 md:col-span-1 lg:col-span-4">
                <ChartCard
                    title="Graduate Program Recommended"
                >
                    <div className=" gap-6 justify-items-center justify-center">
                        {data.gradSchoolRecommend?.map((item) => (
                            <PercentageDial
                                key={item.subquestion_text}
                                value={Number(item.percentage)}
                                label={item.question_text}
                            />
                        ))}
                    </div>
                </ChartCard>
            </div>


            <div className="col-span-1 md:col-span-2 lg:col-span-9">
                <ChartCard
                    title="Graduate Program Effectiveness">
                    <div className="space-y-3 min-w-full h-full self-start">

                        <table className="min-w-full divide-y divide-gray-200">
                            <thead >
                                <tr >
                                    <th className="px-6 py-3 ">Factor</th>
                                    <th className="px-6 py-6 text-nowrap">Very Effective</th>
                                    <th className="px-6 py-3">Extremely Effective</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.gradschoolEffective?.map((item) => {
                                    console.log("item value is: " + item.value_text);

                                    return (


                                        <tr className="items-center" key={item.value_text}>
                                            <td
                                                className="px-6 py-3 "
                                            ><span>{item.subquestion_text}</span></td>
                                            <td className="text-center px-6 py-3 text-nowrap"><span>{item.very_effective_pct} %</span></td>
                                            <td className="text-center px-6 py-3"><span>{item.extreme_effective_pct} %</span></td>
                                        </tr>


                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-9">
                <ChartCard
                    title="Why Students Chose EAST">
                    <Bar options={stackedBarChartOptions} data={barData} />
                </ChartCard>
            </div>
        </div>
    )
}

export default GradPrograms;