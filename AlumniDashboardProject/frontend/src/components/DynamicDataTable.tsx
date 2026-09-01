import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual'

interface Column<T> {
    id: string;
    header: string;
    value: (row: T) => any;
    render?: (value: any, row: T) => React.ReactNode;

    width?: string;
}
interface SortConfig<T> {
    key: keyof T;
    direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    getRowId: (row: T) => number;
    selectedRowId?: number | null;
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;

    sortConfig: SortConfig<T> | null;
    onSort: (key: keyof T) => void;
}

function DynamicDataTable<T>({
    columns,
    data,
    loading = false,
    selectedRowId,
    emptyMessage = 'No data available',
    onRowClick,
    getRowId,
    sortConfig,
    onSort
}: DataTableProps<T>) {

    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44,
        overscan: 10,
    });

    function getDefaultWidth(header: string) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) return 400;

        context.font = "500 14px Inter, sans-serif";

        const textWidth = context.measureText(header).width;

        if (textWidth < 150) {
            return Math.min(
                300,
                Math.max(200, textWidth)
            );
        }
        else {

            return Math.min(
                600,
                Math.max(400, textWidth)
            );
        }
    }


    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
        Object.fromEntries(
            columns?.map(column => [
                column.id,
                column.width
                    ? Number.parseInt(column.width)
                    : getDefaultWidth(column.header),
            ])
        )
    );

    React.useEffect(() => {
        setColumnWidths(
            Object.fromEntries(
                columns?.map(column => [
                    column.id,
                    getDefaultWidth(column.header),
                ])
            )
        );
    }, [columns],);

    const startResize = (
        e: React.MouseEvent,
        columnId: string
    ) => {

        const startX = e.clientX;
        const startWidth = columnWidths[columnId];

        document.body.style.userSelect = "none";

        const onMouseMove = (event: MouseEvent) => {

            document.body.style.cursor = "col-resize";

            const delta = event.clientX - startX;

            setColumnWidths(widths => ({
                ...widths,
                [columnId]: Math.min(
                    800,
                    Math.max(400, startWidth + delta)
                ),
            }));
            document.body.style.cursor = "";
        };

        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            document.body.style.userSelect = "";
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };



    const gridTemplateColumns = React.useMemo(
        () =>
            columns
                ?.map(column => `${columnWidths[column.id]}px`)
                .join(" "),
        [columns, columnWidths]
    );

    const virtualRows = rowVirtualizer.getVirtualItems();


    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                {[...Array(5)]?.map((_, index) => (
                    <div key={index} className="h-12 bg-gray-100 rounded-md mb-2"></div>
                ))}
            </div>
        );
    }



    if (!data.length) {
        return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
    }


    return (
        <div className="border border-gray-400 rounded-lg shadow p-3">
            {/* Horizontal Scroll */}
            <div className="overflow-x-auto overflow-y-hidden">

                {/* Scrollable Body */}
                <div
                    ref={parentRef}
                    className="overflow-y-auto"
                    style={{
                        height: "600px",
                    }}
                >

                    {/* Width grows with the columns */}
                    <div
                        style={{
                            minWidth: "max-content",
                        }}
                    >
                        {/* Header */}
                        <div
                            className="sticky top-0 z-20 bg-white border-b border-gray-300"
                            style={{
                                display: "grid",
                                gridTemplateColumns,
                            }}
                        >
                            {columns?.map((column) => (
                                <div
                                    key={column.id}
                                    className="relative border-r border-gray-200"
                                >
                                    <button
                                        onClick={() => onSort(column.id as keyof T)}
                                        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-gray-50"
                                    >
                                        <span className="line-clamp-4">{column.header}</span>

                                    </button>

                                    <div
                                        className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-500/20"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            startResize(e, column.id);
                                        }}
                                    />
                                </div>
                            ))}

                        </div>


                        <div
                            style={{
                                height: rowVirtualizer.getTotalSize(),
                                position: "relative",
                            }}
                        >
                            {virtualRows?.map((virtualRow) => {

                                const row = data[virtualRow.index];

                                const isSelected =
                                    selectedRowId === getRowId(row);

                                return (
                                    <div
                                        key={virtualRow.key}
                                        onClick={() => onRowClick?.(row)}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div
                                            className={`
                                            border-b border-gray-200
                                            cursor-pointer
                                            transition-colors
                                            select-none
                                            
                                            ${isSelected
                                                    ? "bg-weber-purple text-white"
                                                    : ""}
                                        `}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns,
                                            }}
                                        >
                                            {columns?.map((column) => {

                                                const value = column.value(row);

                                                return (
                                                    <div
                                                        key={column.id}
                                                        className={`
                                                        px-4
                                                        py-3
                                                        text-sm
                                                        border-r
                                                        border-gray-200
                                                        truncate whitespace-nowrap overflow-hidden
                                                        ${isSelected
                                                                ? "text-white"
                                                                : "text-gray-700"}
                                                    `}
                                                    >
                                                        {column.render
                                                            ? column.render(value, row)
                                                            : String(value ?? "-")}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default DynamicDataTable;