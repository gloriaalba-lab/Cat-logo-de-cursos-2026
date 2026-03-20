import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
  vertical?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 40, 
  showText = true,
  textColor = "text-slate-700",
  vertical = false
}) => {
  const logoUrl = "https://lh3.googleusercontent.com/d/1REG3yzrXN0qzyerzmveZ_Jo9o0ax2FV2";

  return (
    <div className={`flex ${vertical ? 'flex-col items-center text-center' : 'items-center'} gap-3 ${className}`}>
      <div className="flex-shrink-0">
        <img 
          src={logoUrl}
          alt="Cademmy Logo"
          width={size}
          height={size}
          className="object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className={`flex flex-col ${vertical ? 'mt-4' : ''}`}>
          <span className={`font-bold tracking-tight leading-none ${vertical ? 'text-5xl' : 'text-2xl'} ${textColor} opacity-90`}>cademmy</span>
          <span className={`${vertical ? 'text-[11px] mt-3' : 'text-[7px] mt-0.5'} font-medium text-slate-400 uppercase tracking-[0.25em]`}>LEARN • IMPROVE • ACHIEVE</span>
        </div>
      )}
    </div>
  );
};
