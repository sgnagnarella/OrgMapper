"use client";

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core'; import type { EChartsCoreOption } from 'echarts/core';
// Import the tooltip component
import { TooltipComponent } from 'echarts/components';
import { TreemapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([TreemapChart, CanvasRenderer]);
echarts.use([TooltipComponent]);

interface OrgTreemapChartEchartsProps {
  data: TreemapNode[];
  onNodeClick: (node: TreemapNode) => void;
}

export const OrgTreemapChartEcharts: React.FC<OrgTreemapChartEchartsProps> = ({ data, onNodeClick }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chartInstance: echarts.ECharts | null = null;

    if (chartRef.current) {
      chartInstance = echarts.init(chartRef.current);

      // ECharts options will go here
      // ECharts Treemap requires a specific data format, often a tree structure. 
      // Your `data` prop seems to be an array of top-level nodes (managers),
      // each with a `children` array for locations. This structure should work.
      const option: EChartsCoreOption = {
        tooltip: {
          formatter: '{b}: {c} Employees', // Show name and value (employees) on hover
        },
        series: [
          {type: 'treemap',
            data: data, // Your data structure should be compatible
            breadcrumb: {
              show: false // You might want to handle breadcrumbs manually
            },
            leafDepth: 2, // Display levels up to depth 1 (managers and locations)
            levels: [
              {}, // Level 0 (Managers)
            ],
            roam: false, // Disable panning by default
            nodeClick: false, // Disable default zoom on click
            label: {
              show: true,
              formatter: '{b}', // Default label for all levels if not overridden
            },
          }
        ],
      };
      console.log(option);

      chartInstance.setOption(option);

      // Add resize listener
      const handleResize = () => { // Correctly defined handleResize
        chartInstance?.resize();
      };
      window.addEventListener('resize', handleResize);

      // Add click listener (basic example)
      chartInstance.on('click', (params: any) => {
        if (params.data && params.data.type === 'manager') { // Check if it's a manager node
            const zoomAction = {
 type: 'treemapZoomToNode',
 targetNode: params.data.name // ECharts uses 'id' for zooming, make sure your data has an 'id' or use another identifier
 }; 
 chartInstance?.dispatchAction(zoomAction);
            onNodeClick(params.data as TreemapNode);
        }
      });


      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstance?.dispose();
      };
    }
    return () => {}; // Return empty cleanup if ref is null
  }, [data, onNodeClick]); // Depend on data and onNodeClick. Removed chartInstance from dependencies as it's managed internally
  
  return <div ref={chartRef} style={{ width: '100%', height: '100%' }}></div>;
};
