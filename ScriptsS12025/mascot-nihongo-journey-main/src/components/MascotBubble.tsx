import { ReactNode } from 'react';

interface MascotBubbleProps {
  mascotImage: string;
  mascotName: string;
  children: ReactNode;
  position?: 'left' | 'right';
  isTalking?: boolean;
}

export const MascotBubble = ({ 
  mascotImage, 
  mascotName, 
  children, 
  position = 'left',
  isTalking = false
}: MascotBubbleProps) => {
  return (
    <div className={`flex items-start gap-4 mb-6 ${position === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="relative">
        <img 
          src={mascotImage} 
          alt={mascotName}
          className={`w-20 h-20 object-contain ${isTalking ? 'mascot-talking' : 'mascot-idle'}`}
        />
      </div>
      <div className="flex-1 max-w-2xl">
        <div className="bg-card border-2 border-primary rounded-2xl p-4 shadow-lg relative">
          <div className={`absolute top-6 ${position === 'right' ? 'right-full mr-2' : 'left-full ml-2'} w-0 h-0 
            border-t-8 border-t-transparent
            border-b-8 border-b-transparent
            ${position === 'right' ? 'border-r-8 border-r-primary' : 'border-l-8 border-l-primary'}`} 
          />
          <p className="text-sm font-medium text-primary mb-1">{mascotName}</p>
          <div className="text-foreground leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
