import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EmotionWave } from '../types';

interface EmotionChartProps {
  emotionWaveHistory: EmotionWave[];
}

const EmotionChart: React.FC<EmotionChartProps> = ({ emotionWaveHistory }) => {
  if (emotionWaveHistory.length < 2) {
    return (
      <div className="text-center text-sm text-muted mt-4 h-48 flex items-center justify-center">
        감정 시퀀스 데이터가 부족합니다. 2개 이상의 이미지를 연속으로 변환하여 기록을 시작하세요.
      </div>
    );
  }

  const chartData = emotionWaveHistory.map((wave, index) => ({
    scene: `장면 ${index + 1}`,
    '감정 강도': wave.emotion_wave.intensity,
    '따뜻함': wave.emotion_wave.color_bias.warmth,
    '부드러움': wave.emotion_wave.color_bias.softness,
    '우울함': wave.emotion_wave.color_bias.melancholy,
    '빛 확산': wave.light_signature.diffusion,
  }));

  const colors: {[key: string]: string} = {
    '감정 강도': '#10b981', // emerald
    '따뜻함': '#f59e0b',   // amber
    '부드러움': '#3b82f6',   // blue
    '우울함': '#6366f1',   // indigo
    '빛 확산': '#ec4899',   // pink
  };

  return (
    <div className="w-full h-48 mt-4">
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} stroke="#a8a29e" />
            <XAxis dataKey="scene" tick={{ fontSize: 12, fill: '#78716c' }} />
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
            <Legend wrapperStyle={{fontSize: '0.75rem'}}/>
            
            {Object.keys(colors).map((key) => (
                <Line 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    stroke={colors[key]} 
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

export default EmotionChart;