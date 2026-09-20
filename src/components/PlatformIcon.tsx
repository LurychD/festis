import React from 'react';
import * as LucideIcons from 'lucide-react';

interface PlatformIconProps {
  iconName: string;
  className?: string;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({ iconName, className = "h-4 w-4" }) => {
  // Fallback if the iconName is not found or is empty
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Globe;
  return <IconComponent className={className} />;
};
