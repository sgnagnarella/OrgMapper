"use client";

import React, { useCallback } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import type { TreemapNode as AppTreemapNode } from '@/types';
import { cn } from '@/lib/utils';

// Define a type for the Recharts treemap node props, as it's not directly exported well
interface RechartsNodeProps {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: AppTreemapNode; // The node data passed to Recharts
  name: string;
  value: number;
  children?: AppTreemapNode[]; // Children of the current node
  root?: AppTreemapNode; // Root node of the treemap
  [key: string]: any; // Allow other properties
}


interface CustomizedContentProps extends RechartsNodeProps {
  onNodeClick: (node: AppTreemapNode) => void;
  colors: string[];
}

const CustomizedContent: React.FC<CustomizedContentProps> = ({
  depth, x, y, width, height, index, payload, name, value, onNodeClick, colors
}) => {
  const handleClick = useCallback(() => {
    if (payload) {
      onNodeClick(payload);
    }
  }, [payload, onNodeClick]);

  const baseColorIndex = payload.type === 'manager' ? 0 : 1;
  const colorIndex = (index + baseColorIndex) % colors.length;
  const fillColor = colors[colorIndex];

  // Determine text color based on background brightness (simple heuristic)
  const isDarkColor = (hexColor: string): boolean => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };
  
  const textColor = fillColor && isDarkColor(fillColor) ? 'text-white' : 'text-gray-800';

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
          cursor: 'pointer',
        }}
        onClick={handleClick}
        className="transition-all duration-300 ease-in-out hover:opacity-80"
      />
      {width * height > 500 && width > 60 && height > 20 ? ( // Only show text if cell is large enough
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn("fill-current pointer-events-none transition-opacity duration-300 ease-in-out", textColor)}
          fontSize={Math.max(8, Math.min(14, Math.sqrt(width * height) / 10))} // Adjust font size dynamically
        >
          {name}
        </text>
      ) : null}
      {width * height > 1000 && width > 80 && height > 40 ? ( // Show value if even larger
         <text
          x={x + width / 2}
          y={y + height / 2 + Math.max(10, Math.min(16, Math.sqrt(width*height)/10)) + 2} // Position value below name
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn("fill-current pointer-events-none transition-opacity duration-300 ease-in-out", textColor)}
          fontSize={Math.max(7, Math.min(12, Math.sqrt(width * height) / 12))}
        >
          ({value})
        </text>
      ) : null}
    </g>
  );
};

interface OrgTreemapChartProps {
  data: AppTreemapNode[];
  onNodeClick: (node: AppTreemapNode) => void;
}

const TREEMAP_COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 40%, 70%)', // Lighter primary
  'hsl(28, 100%, 65%)', // Lighter accent
];

export function OrgTreemapChart({ data, onNodeClick }: OrgTreemapChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data to display. Try adjusting filters or uploading a new CSV.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={data}
        dataKey="value"
        ratio={4 / 3}
        stroke="#fff"
        content={<CustomizedContent onNodeClick={onNodeClick} colors={TREEMAP_COLORS} depth={0} x={0} y={0} width={0} height={0} index={0} payload={{} as AppTreemapNode} name={''} value={0} />}
        isAnimationActive={true}
        animationDuration={500}
        animationEasing="ease-in-out"
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
}


const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as AppTreemapNode; // Recharts payload structure
    return (
      <div className="bg-card p-3 border border-border shadow-lg rounded-md text-card-foreground">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm">Type: <span className="capitalize">{data.type}</span></p>
        <p className="text-sm">Employees: {data.value}</p>
        {data.path && <p className="text-xs text-muted-foreground">Path: {data.path}</p>}
      </div>
    );
  }
  return null;
};
