import { Doughnut } from "react-chartjs-2";


const GaugeChart = ({
    value,
    label,
    isPercent,
    hoverLabel
}: {
    value: number;
    label: string;
    isPercent?: boolean;
    hoverLabel?: string;
}) => {

    const gaugeData = {
        labels: ['Score', 'Remaining'],
        datasets: [
            {
                label: hoverLabel ? hoverLabel : "",
                data: [value, 5 - value],
                backgroundColor: ['#7a1e96', '#e5e7eb'],
                borderWidth: 0,
                circumference: 180,
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
                enabled: true,
                filter: (tooltipItem: any) => tooltipItem.dataIndex === 0 && !!hoverLabel,
                callbacks: {
                    label: (context: any) => {
                        const displayLabel = hoverLabel || label;
                        const displayValue = isPercent
                            ? `${value.toFixed(1)}%`
                            : value.toFixed(1);
                        return `${displayLabel}: ${displayValue}`;
                    },
                    title: () => '', // suppress the default title row
                }
            },
            datalabels: {
                display: false
            }
        }
    };

    return (
        <div className="flex flex-col items-center basis-sm p-3">
            <div className="relative w-full h-40">
                <Doughnut
                    data={gaugeData}
                    options={gaugeOptions}
                />

                <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <span className="text-3xl font-bold">
                        {isPercent ? value.toFixed(1) + "%" : value.toFixed(1)}

                    </span>
                </div>
            </div>

            <div className="text-center text-sm font-medium mt-2">
                {label}
            </div>
        </div>
    );
};

export default GaugeChart;