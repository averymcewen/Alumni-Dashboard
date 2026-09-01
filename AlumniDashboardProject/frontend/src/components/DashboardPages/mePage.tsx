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

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await apiService.getDeptInfo(6);
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
            </div>) : (<> <PieChart
                data={numPerProgram}
                chartOptions={chartOptions}
                filterKey="department_id"
                filterValue={department_id || 6}
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
                                            <span>{item.name || `No data found`}</span>
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
                                            <span>{item.value_text || `No data found`}</span>
                                        </div>

                                        <span
                                            className={`flex items-center gap-3 text-nowrap pl-15 ${highlightClass}`}
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
                </div ></>)}

        </div >
    )
};

export default MEPage;