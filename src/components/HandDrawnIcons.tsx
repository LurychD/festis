import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// Beautifully crafted hand-drawn (sketchy style) SVG icons
// Using styled crooked paths, rounded joints and expressive strokes.

export const HandDrawnHome: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Sketchy crooked outer house border */}
    <path d="M2.5 12.3 C 5 9.5, 9 5.5, 12 2.8 C 15 5.5, 19 9.5, 21.5 12.3" />
    <path d="M4.5 10.5 L 4.8 21.2 C 8 21.4, 16 21.1, 19.2 21.2 L 19.5 10.5" />
    {/* Crooked window or door */}
    <path d="M9.5 21 L 9.8 14.5 C 10.5 13.8, 13.5 13.8, 14.2 14.5 L 14.5 21" />
  </svg>
);

export const HandDrawnList: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Sketchy dots */}
    <path d="M 4.2 6.1 A 1.2 1.2 0 1 1 4 6 A 1.2 1.2 0 0 1 4.2 6.1" />
    <path d="M 3.8 12.2 A 1.2 1.2 0 1 1 3.6 12.1 A 1.2 1.2 0 0 1 3.8 12.2" />
    <path d="M 4.1 18.3 A 1.2 1.2 0 1 1 3.9 18.2 A 1.2 1.2 0 0 1 4.1 18.3" />
    {/* Sketchy lines */}
    <path d="M 8.5 6 C 12 5.8, 16 6.2, 20.2 6.1" />
    <path d="M 8.1 12.1 C 11.5 12.3, 15.5 11.8, 19.8 12.2" />
    <path d="M 8.3 18.2 C 12.5 18.1, 16.5 18.4, 20.5 18" />
  </svg>
);

export const HandDrawnTasks: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Clipboard base */}
    <path d="M 16 4.2 C 17.5 4.5, 19.2 5.5, 19.4 7.5 L 19.1 21 C 15 21.5, 9 21.2, 4.6 21 C 4.5 18.5, 4.8 9.5, 4.5 7.5 C 5 5.5, 6.5 4.5, 8 4.2" />
    {/* Clipboard metal latch */}
    <path d="M 8.5 4.5 C 9 3, 15 3, 15.5 4.5 L 14.5 6.5 L 9.5 6.5 Z" />
    {/* Sketchy checkmarks */}
    <path d="M 8 11.5 L 10 13.5 L 15.5 9" />
    <path d="M 8 16.5 L 10 18.5 L 15.5 14" />
  </svg>
);

export const HandDrawnCalendar: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Calendar body */}
    <path d="M 4 7 C 4.5 5, 6 4.5, 8 4.5 L 16 4.5 C 18 4.5, 19.5 5, 20 7 L 19.8 20 C 18 20.5, 6 20.5, 4.2 20 Z" />
    {/* Grid line */}
    <path d="M 4.1 9.5 C 9 9.3, 15 9.7, 19.9 9.5" />
    {/* Binder rings */}
    <path d="M 8 2.5 L 8 5.5" />
    <path d="M 16 2.5 L 16 5.5" />
    {/* Small crooked grid lines or event highlight */}
    <path d="M 7.5 13 L 9.5 13" />
    <path d="M 12.5 13 L 15.5 13" />
    <path d="M 7.5 16.5 L 11.5 16.5" />
    <path d="M 14.5 16.5 L 16.5 16.5" />
  </svg>
);

export const HandDrawnStats: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Crooked pie chart outline */}
    <path d="M 12 2.5 C 17.5 3, 21.5 7, 21.5 12.5 C 21 18, 17 21.5, 11.5 21.5 C 6 21, 2.5 17, 2.5 11.5 C 3 6, 7 2.5, 12 2.5 Z" />
    {/* Pie pieces dividers */}
    <path d="M 12 2.5 L 11.8 12.2" />
    <path d="M 11.8 12.2 L 18.5 18" />
    <path d="M 11.8 12.2 L 3 13.5" />
  </svg>
);

export const HandDrawnHelp: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Help circle */}
    <path d="M 12 2.5 C 17.5 3, 21.5 7, 21.5 12.5 C 21 18, 17 21.5, 11.5 21.5 C 6 21, 2.5 17, 2.5 11.5 C 3 6, 7 2.5, 12 2.5 Z" />
    {/* Crooked question mark */}
    <path d="M 9.5 9 C 9.5 6.5, 14.5 6, 14.5 9.5 C 14.5 12, 11.8 11.5, 11.8 14.2" />
    {/* Dot */}
    <path d="M 11.8 18.2 A 0.8 0.8 0 1 1 11.6 18.1 A 0.8 0.8 0 0 1 11.8 18.2" />
  </svg>
);

export const HandDrawnPlanning: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Whiteboard frame */}
    <path d="M 3.5 4.5 C 8 4, 16 4.2, 20.5 4.5 L 20.2 17.5 C 16 17.8, 8 17.5, 3.8 17.2 Z" />
    {/* Board easel stand */}
    <path d="M 6.5 17.5 L 4.5 21.5" />
    {/* Pen / pencil drawing inside */}
    <path d="M 17.5 17.5 L 19.5 21.5" />
    <path d="M 7.5 8.5 C 9.5 7.5, 12 11.5, 14.5 9.5 L 16.5 11.5" />
    <path d="M 8 13.5 C 10.5 13.5, 13 13.2, 15.5 13.5" />
  </svg>
);

export const HandDrawnCompass: React.FC<IconProps> = ({ size = 32, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Top hanging loop/casing ring */}
    <path d="M 10.5 3 C 11.2 1.8, 12.8 1.8, 13.5 3 C 14.2 4.2, 9.8 4.2, 10.5 3 Z" />
    {/* Outer sketchy compass circular rim */}
    <path d="M 12 4.2 C 16.5 4.1, 20.8 7.8, 20.9 12.8 C 21 17.5, 16.8 21.2, 12.1 21.1 C 7.2 21, 3.1 17.1, 3.2 12.2 C 3.3 7.5, 7.3 4.3, 12 4.2" />
    {/* Cardinal direction ticks */}
    <path d="M 12 5.5 L 12 7.2" />
    <path d="M 12 18.8 L 12 17.1" />
    <path d="M 4.5 12.2 L 6.2 12.2" />
    <path d="M 19.5 12.2 L 17.8 12.2" />
    {/* Center magnetic needle (rhombus) pointing North-East */}
    <path d="M 12 12.2 L 15.2 8.2 L 12.8 11.5 Z" fill="currentColor" opacity="0.85" />
    <path d="M 12 12.2 L 8.8 16.2 L 11.2 12.9 Z" />
    {/* Center pivot pin */}
    <circle cx="12" cy="12.2" r="1.2" fill="currentColor" />
  </svg>
);



