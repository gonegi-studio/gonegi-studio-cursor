
import React from 'react';
import { QualityScore } from '../types';

interface QualityScoreDisplayProps {
  scoreData: QualityScore;
}

const QualityScoreDisplay: React.FC<QualityScoreDisplayProps> = ({ scoreData }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-primary';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-overlay mt-4">
      <h3 className="text-sm font-black text-text uppercase tracking-widest mb-4">AI 아티스트 평가 리포트</h3>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center justify-center bg-stone-50 w-24 h-24 rounded-2xl border border-overlay">
          <span className={`text-4xl font-black ${getScoreColor(scoreData.score)}`}>
            {scoreData.score}
          </span>
          <span className="text-[10px] text-muted font-bold uppercase tracking-tighter">SCORE</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-text mb-1 uppercase tracking-tight">Director's Note</p>
          <p className="text-sm text-muted italic leading-relaxed">
            "{scoreData.feedback}"
          </p>
        </div>
      </div>
      {scoreData.checklist && (
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-overlay">
          {Object.entries(scoreData.checklist).map(([key, passed]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
              <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className={passed ? 'text-primary' : 'text-red-400'}>
                {passed ? '●' : '○'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QualityScoreDisplay;
