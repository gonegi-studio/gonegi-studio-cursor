import React from 'react';
import type { ProfileConfig } from './types';

interface ProfileCardProps {
  profile: ProfileConfig;
}

const DetailItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-overlay last:border-b-0">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-text">{value ?? 'N/A'}</span>
    </div>
);


const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const sceneMap = {
    outdoor: { label: '야외', className: 'bg-primary/20 text-primary-focus' },
    indoor: { label: '실내', className: 'bg-secondary/20 text-secondary' },
    night: { label: '밤', className: 'bg-indigo-500/20 text-indigo-400' },
  };
  const sceneInfo = sceneMap[profile.scene] || sceneMap.indoor;


  return (
    <div className="bg-overlay/50 p-4 rounded-lg w-full transition-all hover:bg-overlay h-full flex flex-col">
      <div className="mb-2">
        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${sceneInfo.className}`}>
            {sceneInfo.label}
        </span>
        <h4 className="font-semibold text-text truncate mt-1" title={profile.profile_id}>{profile.category}</h4>
      </div>
      <p className="text-xs text-muted mb-3 flex-grow">{profile.notes}</p>
      <div className="space-y-1 text-xs">
          <DetailItem label="스타일 가중치" value={profile.style_weight} />
          <DetailItem label="색상 가중치" value={profile.color_weight} />
          <DetailItem label="구조 가중치" value={profile.structure_weight} />
          <DetailItem label="붓터치 깊이" value={profile.painterly.stroke_depth} />
          <DetailItem label="가장자리 뭉개기" value={profile.painterly.edge_soften} />
      </div>
    </div>
  );
};

export default ProfileCard;
