import { Doughnut } from "react-chartjs-2";

const PercentageDial = ({
    value,
    label
}: {
    value: number;
    label: string;
}) => {
    const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

    const gaugeData = {
        labels: ['Yes', 'Remaining'],
        datasets: [
            {
                data: [safeValue, 100 - safeValue],
                backgroundColor: ['#7a1e96', '#e5e7eb'],
                borderWidth: 0,
                circumference: 360,
                rotation: 270,
            }
        ]
    };

    const gaugeOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            },
            datalabels: {
                display: false
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-full h-40">
                <Doughnut
                    data={gaugeData}
                    options={gaugeOptions}
                />

                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">
                        {safeValue.toFixed(0)}%
                    </span>
                </div>
            </div>

            <div className="text-center text-sm font-medium mt-2 pl-10 pr-10 pt-2">
                {label}
            </div>
        </div>
    );
};

export default PercentageDial;