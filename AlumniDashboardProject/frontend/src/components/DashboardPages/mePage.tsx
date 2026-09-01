import StatCard from '../StatCard';
import { useState, useEffect } from 'react';
import { Users, Briefcase, DollarSign, GraduationCap } from 'lucide-react';
import PieChart from './DashboardElements/PieChartPer';
import { alumniPerProgram } from '#/src/types';
import { Row } from './DashboardElements/PieChartPer';
import { apiService } from '../../../services/api';
import ChartCard from '../ChartCard';

interface Props {
    numPerProgram: Row[];
    department_id: number;
    departmentName: string;
    chartOptions: any;
}

const MEPage: React.FC<Props> = ({ numPerProgram, department_id, departmentName, chartOptions }) => {

    const [data, setData] = useState({
        getApproval: [],
        MEIndustries: [],
        MELicensure: []
    });

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

            <div className="col-span-4">
                <ChartCard
                    title="Recommendation of Program of Study">
                    <div className="space-y-3 min-w-full ">
                        {data.getApproval?.map((item) => {

                            const maxNumAlum = data.getApproval[0]?.percentage;
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
                                        <span>{item.name}</span>
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


            <div className="col-span-5">
                <ChartCard
                    title="Areas of Mechanical Engineering Where Students Are Seeking Employment">
                    <div className="space-y-3 min-w-full ">
                        {data.MEIndustries?.map((item) => {
                            const maxNumAlum = data.MEIndustries[0]?.percentage;
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
            </div >

            <div className="col-span-9">
                <ChartCard
                    title="Student Confidence in Pursuing Licensure Post-Graduation">
                    <div className="space-y-3 min-w-full ">
                        {data.MELicensure?.map((item) => {
                            const maxNumAlum = data.MELicensure[0]?.percentage;
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
                                        className={`flex items-center gap-3 text-nowrap pl-15 ${highlightClass}`}
                                    >
                                        {item.percentage} %
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                </ChartCard>
            </div >
        </div >
    )
};

export default MEPage;