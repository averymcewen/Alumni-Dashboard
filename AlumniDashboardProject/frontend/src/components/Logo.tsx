import React from 'react';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  white?: boolean;
}

const Logo: React.FC<LogoProps> = ({ white = false }) => {
  return (
    <div className={`flex items-center ${white ? 'text-white' : 'text-weber-purple'}`}>
      <GraduationCap className="h-8 w-8 mr-2" />
      <div>
        <div className={`font-display font-bold text-lg ${white ? 'text-white' : 'text-weber-purple'}`}>EAST</div>
        <div className="text-xs">Alumni Dashboard</div>
      </div>
    </div>
  );
};

export default Logo;