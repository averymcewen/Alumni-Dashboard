import React, { useState, useId } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    onRemove?: () => void;
    children: React.ReactNode;
}

/**
 * A generic expand/collapse card used for repeatable sub-records
 * (a single degree, a single job, a single internship) inside the
 * alumni edit page. Pass onRemove to show a delete (X) button in
 * the header; omit it for sections that can't be removed.
 */
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    defaultOpen = false,
    onRemove,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentId = useId();

    return (
        <div className="border border-neutral-200 rounded-lg mb-4">
            <div className="w-full flex items-center justify-between px-4 py-3">
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="flex-1 flex items-center justify-between text-left"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                >
                    <span className="font-medium text-gray-800">{title}</span>
                    <ChevronDown
                        size={18}
                        className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="ml-3 text-gray-400 hover:text-red-500"
                        aria-label={`Remove ${title}`}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <div
                id={contentId}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                aria-hidden={!isOpen}
            >
                <div className="overflow-hidden">
                    <div className="border-t px-4 py-4">{children}</div>
                </div>
            </div>
        </div>
    );
};

export default CollapsibleSection;