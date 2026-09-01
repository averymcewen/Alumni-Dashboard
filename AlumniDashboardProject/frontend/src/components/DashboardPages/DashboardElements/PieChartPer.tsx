import React, { useMemo } from 'react';
import ChartCard from '../../ChartCard';
import { Pie } from 'react-chartjs-2';


export interface Row {
    [key: string]: any;
    name: string;
    numAlum: number;
}

interface Props {
    data: Row[];
    chartOptions: any;
    groupKey?: string;         // e.g. "department_id" — omit for a single pie
    groupLabelKey?: string;    // e.g. "department_name" — used for title when grouping
    title?: string;            // used when NOT grouping
    itemLabel?: string;        // e.g. "program" — used in subtitle count text
    filterKey?: string;        // e.g. "department_id" — filter data before charting
    filterValue?: string | number;
}

export const colors = [
    '#4a0066', '#7a1e96', '#320044', '#38b2ac',
    '#f2c94c', '#2c5282', '#9f7aea'
];

const PieChart: React.FC<Props> = ({
    data,
    chartOptions,
    groupKey,
    groupLabelKey,
    title = 'Overview',
    itemLabel = 'item',
    filterKey,
    filterValue
}) => {

    const mappedData = useMemo(() => {
        console.log('filterKey:', filterKey, 'filterValue:', filterValue, typeof filterValue);
        // Apply filter first, if provided (e.g. only this department's programs)
        const filtered = filterKey && filterValue !== undefined
            ? data.filter(row => row[filterKey] === filterValue)
            : data;

        const buildChart = (rows: Row[]) => ({
            labels: rows?.map(d => d.name),
            datasets: [
                {
                    label: 'Number of Alumni',
                    data: rows?.map(d => d.numAlum),
                    backgroundColor: colors,
                    borderWidth: 0,
                },
            ],
        });

        // No groupKey → single pie from the filtered array
        if (!groupKey) {
            return [{
                title,
                subtitle: `${filtered?.length} ${itemLabel}${filtered?.length !== 1 ? 's' : ''}`,
                chartData: buildChart(filtered),
            }];
        }

        // groupKey provided → one pie per group within the filtered array
        const grouped = filtered.reduce<Record<string, Row[]>>((acc, item) => {
            const key = item[groupKey];
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        return Object.values(grouped)?.map(rows => ({
            title: groupLabelKey ? `${rows[0][groupLabelKey]}` : `Group ${rows[0][groupKey]}`,
            subtitle: `${rows?.length} ${itemLabel}${rows?.length !== 1 ? 's' : ''}`,
            chartData: buildChart(rows),
        }));
    }, [data, groupKey, groupLabelKey, title, itemLabel, filterKey, filterValue]);




    return (
        <>
            {mappedData?.map((d, i) => (
                <div key={i} className="col-span-1 md:col-span-2 lg:col-span-9">
                    <ChartCard title={d.title} subtitle={d.subtitle}>
                        <div className="flex flex-col lg:flex-row items-center gap-8 w-full min-w-0">
                            <ul className="flex flex-col gap-3 shrink-0 w-full lg:w-48 min-w-0 pl-10">
                                {d.chartData.labels?.map((label: string, idx: number) => (
                                    <li key={label} className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                                        <span
                                            className="inline-block w-3.5 h-3.5 rounded-sm shrink-0"
                                            style={{ backgroundColor: colors[idx % colors?.length] }}
                                        />
                                        <span className="truncate">{label}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="relative w-full h-64 sm:h-80 flex-1 min-w-0">
                                <Pie data={d.chartData} options={chartOptions} />
                            </div>
                        </div>
                    </ChartCard>
                </div>
            ))}
        </>
    );
};

export default PieChart;