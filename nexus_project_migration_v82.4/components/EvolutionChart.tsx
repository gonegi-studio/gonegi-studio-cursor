import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MetaConfig } from '../types';

interface EvolutionChartProps {
  configs: MetaConfig[];
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ configs }) => {
  const sortedConfigs = [...configs].sort((a, b) => {
    const versionA = parseInt(a.meta_id.match(/v(\d+)$/)?.[1] ?? '0', 10);
    const versionB = parseInt(b.meta_id.match(/v(\d+)$/)?.[1] ?? '0', 10);
    return versionA - versionB;
  });

  const chartData = sortedConfigs.map(config => {
    // Fix: Changed 0 to '0' to ensure the argument to parseInt is always a string
    const version = parseInt(config.meta_id.match(/v(\d+)$/)?.[1] ?? '0', 10);
    return {
      version: `v${version}`,
      '야외 대기 농도': config.lighting_bank.outdoor?.ambient_haze ?? 0,
      '금속 → 나무 변환율': config.material_rules.metal_to_wood ?? 0,
      '플라스틱 → 나무 변환율': config.material_rules.plastic_to_wood ?? 0,
      '그물 → 덩굴 변환율': config.material_rules.net_to_vine ?? 0,
      '고무 → 돌 변환율': config.material_rules.rubber_to_stone ?? 0,
    };
  });

  const colors: {[key: string]: string} = {
    '야외 대기 농도': '#10b981', // emerald
    '금속 → 나무 변환율': '#f59e0b', // amber
    '플라스틱 → 나무 변환율': '#a855f7', // purple
    '그물 → 덩굴 변환율': '#3b82f6', // blue
    '고무 → 돌 변환율': '#ec4899', // pink
  }

  return (
    <div className="w-full h-64">
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} stroke="#a8a29e" />
            <XAxis dataKey="version" tick={{ fontSize: 12, fill: '#78716c' }} angle={-30} textAnchor="end" height={50} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12, fill: '#78716c' }} domain={[0, 1]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #e7e5e4',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
            <Legend wrapperStyle={{fontSize: '0.75rem', paddingTop: '20px'}}/>
            
            {Object.entries(colors).map(([key, color]) => (
                <Line 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    stroke={color} 
                    strokeWidth={2} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }} 
                />
            ))}
            
          </LineChart>
        </ResponsiveContainer>
      </div>
  );
};

export default EvolutionChart;