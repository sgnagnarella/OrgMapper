
"use client";

import React, { useCallback } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import type { TreemapNode as AppTreemapNode } from '@/types';
import { cn } from '@/lib/utils';

// Define a type for the Recharts treemap node props
interface RechartsNodeProps {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload?: AppTreemapNode; // Make payload optional as it might be undefined
  name?: string;
  value?: number;
  children?: AppTreemapNode[];
  root?: AppTreemapNode;
  [key: string]: any;
}

// Information about each color used in the treemap for styling
const TREEMAP_COLORS_INFO: Array<{ fill: string; isLightnessDark: boolean }> = [
  { fill: 'hsl(var(--chart-1))', isLightnessDark: false }, // L=60% (Light bg)
  { fill: 'hsl(var(--chart-2))', isLightnessDark: true },  // L=45.1% (Dark bg)
  { fill: 'hsl(var(--chart-3))', isLightnessDark: false }, // L=60% (Light bg)
  { fill: 'hsl(var(--chart-4))', isLightnessDark: false }, // L=60% (Light bg)
  { fill: 'hsl(var(--chart-5))', isLightnessDark: false }, // L=60% (Light bg)
  { fill: 'hsl(210, 40%, 70%)', isLightnessDark: false },   // L=70% (Light bg)
  { fill: 'hsl(28, 100%, 65%)', isLightnessDark: false },  // L=65% (Light bg)
];


interface CustomizedContentProps extends RechartsNodeProps {
  onNodeClick: (node: AppTreemapNode) => void;
  colorsInfo: Array<{ fill: string; isLightnessDark: boolean }>;
}

const CustomizedContent: React.FC<CustomizedContentProps> = ({
  depth, x, y, width, height, index, payload, name, value, onNodeClick, colorsInfo
}) => {
  if (!payload || !name) { // Add guard for payload and name
    return null;
  }

  const handleClick = useCallback(() => {
    // payload is guaranteed to exist here due to the check above
    onNodeClick(payload);
  }, [payload, onNodeClick]);

  const isManagerNode = payload.type === 'manager';

  const baseColorIndex = isManagerNode ? 0 : 1; // Managers use first set of colors, locations offset
  const colorOverallIndex = (index + baseColorIndex) % colorsInfo.length;
  const colorInfo = colorsInfo[colorOverallIndex];
  
  const fillColor = colorInfo.fill;
  const textColor = colorInfo.isLightnessDark ? 'text-white' : 'text-gray-800';

  // Conditions for showing text elements
  const canShowAnyText = width > 30 && height > 15;

  const showName = canShowAnyText && (
    (isManagerNode && width > 50 && height > 20) ||
    (!isManagerNode && width > 60 && height > 20 && width * height > 500)
  );

  const showValue = canShowAnyText && value !== undefined && ( // Ensure value is defined
    (isManagerNode && width > 70 && height > 25 && width * height > 1500) || 
    (!isManagerNode && width > 80 && height > 40 && width * height > 1000)
  );
  
  const nameFontSize = Math.max(8, Math.min(isManagerNode ? 15 : 13, Math.sqrt(width * height) / (isManagerNode ? 9 : 11)));
  const valueFontSize = Math.max(7, Math.min(isManagerNode ? 13 : 11, Math.sqrt(width * height) / (isManagerNode ? 11 : 13)));
  const nameFontWeight = isManagerNode ? 'font-semibold' : 'font-normal';

  let nameYPosition = y + height / 2;
  let valueYPosition = y + height / 2;

  if (showName && showValue) {
    nameYPosition = y + height / 2 - nameFontSize * 0.55; 
    valueYPosition = y + height / 2 + valueFontSize * 0.75; 
  } else if (showName && !showValue) {
    nameYPosition = y + height / 2;
  } else if (!showName && showValue) {
    valueYPosition = y + height / 2;
  }

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
      {showName && (
        <text
          x={x + width / 2}
          y={nameYPosition}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn("fill-current pointer-events-none transition-opacity duration-300 ease-in-out", textColor, nameFontWeight)}
          fontSize={nameFontSize}
        >
          {name}
        </text>
      )}
      {showValue && value !== undefined && ( 
         <text
          x={x + width / 2}
          y={valueYPosition}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn("fill-current pointer-events-none transition-opacity duration-300 ease-in-out", textColor)}
          fontSize={valueFontSize}
        >
          ({value})
        </text>
      )}
    </g>
  );
};

interface OrgTreemapChartProps {
  data: AppTreemapNode[];
  onNodeClick: (node: AppTreemapNode) => void;
}

export function OrgTreemapChart({ data, onNodeClick }: OrgTreemapChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data to display. Try adjusting filters or uploading a new CSV.</div>;
  }
  
  const contentRenderer = (props: RechartsNodeProps) => (
    <CustomizedContent {...props} onNodeClick={onNodeClick} colorsInfo={TREEMAP_COLORS_INFO} />
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={data}
        dataKey="value" 
        ratio={4 / 3}    
        stroke="#fff"    
        content={contentRenderer}
        isAnimationActive={true}
        animationDuration={500}
        animationEasing="ease-in-out"
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
}


const CustomTooltip: React.FC<any> = ({ active, payload: tooltipPayload }) => { // Renamed to avoid conflict
  if (active && tooltipPayload && tooltipPayload.length) {
    const data = tooltipPayload[0].payload as AppTreemapNode; 
    // Ensure data and its properties are defined before accessing
    if (!data || data.name === undefined || data.type === undefined || data.value === undefined) {
        return null;
    }
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
