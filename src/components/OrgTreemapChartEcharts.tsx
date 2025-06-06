"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as echarts from 'echarts/core'; import type { EChartsCoreOption } from 'echarts/core';
// Import the tooltip component
import { TooltipComponent } from 'echarts/components';
import { TreemapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { TreemapNode } from '@/types';
echarts.use([TreemapChart, CanvasRenderer]);
echarts.use([TooltipComponent]);

interface OrgTreemapChartEchartsProps {
  data: TreemapNode[];
  onNodeClick: (node: TreemapNode) => void;
  showEmployeeCount?: boolean;
}

export interface OrgTreemapChartEchartsHandle {
  exportAsPng: () => void;
  exportAsHtml: () => void;
}

export const OrgTreemapChartEcharts = forwardRef<OrgTreemapChartEchartsHandle, OrgTreemapChartEchartsProps>(({ data, onNodeClick, showEmployeeCount = false }, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const lastOptionRef = useRef<EChartsCoreOption | null>(null);

  useImperativeHandle(ref, () => ({
    exportAsPng: () => {
      if (chartInstanceRef.current) {
        const url = chartInstanceRef.current.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
        const link = document.createElement('a');
        link.href = url;
        link.download = 'treemap.png';
        link.click();
      }
    },
    exportAsHtml: () => {
      if (!lastOptionRef.current) return;
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OrgMapper Treemap Export</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>body { margin: 0; } #main { width: 100vw; height: 100vh; }</style>
</head>
<body>
  <div id="main"></div>
  <script>
    var chart = echarts.init(document.getElementById('main'));
    var option = ${JSON.stringify(lastOptionRef.current)};
    chart.setOption(option);
  </script>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'treemap.html';
      link.click();
    }
  }), []);

  useEffect(() => {
    let chartInstance: echarts.ECharts | null = null;
    let resizeObserver: ResizeObserver | null = null;

    if (chartRef.current) {
      chartInstance = echarts.init(chartRef.current);
      chartInstanceRef.current = chartInstance;

      // ECharts options will go here
      // ECharts Treemap requires a specific data format, often a tree structure. 
      // Your `data` prop seems to be an array of top-level nodes (managers),
      // each with a `children` array for locations. This structure should work.
      const option: EChartsCoreOption = {
        tooltip: {
          formatter: '{b}: {c} Employees', // Show name and value (employees) on hover
        },
        series: [
          {
            type: 'treemap',
            data: data, // Your data structure should be compatible
            breadcrumb: {
              show: false // You might want to handle breadcrumbs manually
            },
            leafDepth: 2, // Display levels up to depth 1 (managers and locations)
            roam: false, // Disable panning by default
            nodeClick: false, // Disable default zoom on click
            label: {
              show: true,
              formatter: function(params: any) {
                if (params.data.type === 'manager' && params.data.managerLocation) {
                  return `${params.data.name} (${params.data.managerLocation})`;
                }
                if (showEmployeeCount && params.data.type === 'location' && typeof params.data.value === 'number') {
                  return `${params.data.name} (${params.data.value})`;
                }
                return params.data.name;
              },
              position: 'insideTop',
              fontSize: 12,
              fontWeight: 500,
              color: '#444',
              fontFamily: 'PT Sans, Segoe UI, Arial, sans-serif',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 3,
              padding: [2, 4],
            },
            upperLabel: {
              show: true,
              height: 22,
              color: '#333',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'PT Sans, Segoe UI, Arial, sans-serif',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 3,
              padding: [2, 6],
            },
            levels: [
              {
                itemStyle: {
                  borderColor: '#fff',
                  borderWidth: 2,
                },
                upperLabel: { show: true },
              },
              {},
            ],
          }
        ],
      };
      console.log(option);

      chartInstance.setOption(option);
      lastOptionRef.current = option;

      // Add resize listener
      const handleResize = () => { chartInstance?.resize(); };
      window.addEventListener('resize', handleResize);

      // Add ResizeObserver to parent element for width changes
      if (chartRef.current.parentElement) {
        resizeObserver = new ResizeObserver(() => {
          chartInstance?.resize();
        });
        resizeObserver.observe(chartRef.current.parentElement);
      }

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
        if (resizeObserver && chartRef.current?.parentElement) {
          resizeObserver.unobserve(chartRef.current.parentElement);
        }
        chartInstance?.dispose();
        chartInstanceRef.current = null;
      };
    }
    return () => {}; // Return empty cleanup if ref is null
  }, [data, onNodeClick, showEmployeeCount]); // Depend on data and onNodeClick. Removed chartInstance from dependencies as it's managed internally
  
  return <div ref={chartRef} style={{ width: '100%', height: '100%' }}></div>;
});
