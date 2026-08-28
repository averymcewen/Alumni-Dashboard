import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as React from 'react';

import cn from '../libs/utils';

const ScrollArea = React.forwardRef<
    React.Ref<typeof ScrollAreaPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
        viewPortClassName?: string;
        orientation?: 'vertical' | 'horizontal';
        viewPortRef?: React.RefObject<HTMLDivElement>;
    }
>(
    (
        {
            className,
            children,
            viewPortClassName,
            viewPortRef,
            orientation = 'vertical',
            ...props
        },
        ref,
    ) => (
        <ScrollAreaPrimitive.Root
            ref={ref}
            className={cn('relative overflow-hidden', className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                className={cn(
                    'size-full rounded-[inherit] [&>div]:!block',
                    viewPortClassName,
                )}
                ref={viewPortRef}
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation={orientation} />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    ),
);

export default ScrollArea;