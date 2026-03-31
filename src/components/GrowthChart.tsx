import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GrowthLog } from '../types';
import { format } from 'date-fns';

interface GrowthChartProps {
  logs: GrowthLog[];
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ logs }) => {
  const data = logs
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(log => ({
      date: format(new Date(log.timestamp), 'MMM d'),
      height: log.height
    }));

  return (
    <div className="h-64 w-full bg-white rounded-3xl p-4 border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-4 px-2">Growth History (cm)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }} 
          />
          <Line 
            type="monotone" 
            dataKey="height" 
            stroke="#059669" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
