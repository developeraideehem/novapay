// NovaPay Modern Theme - Enhanced Color System
// Inspired by Branch, OPay, PalmPay with modern fintech aesthetics

export const lightColors = {
  // Primary Brand - Vibrant Blue to Purple Gradient
  primary: {
    main: '#6366F1',        // Indigo - Modern, trustworthy
    light: '#818CF8',
    dark: '#4F46E5',
    lighter: '#A5B4FC',
    darker: '#3730A3',
    contrast: '#FFFFFF',
  },

  // Secondary - Emerald Green for Money/Success
  secondary: {
    main: '#10B981',        // Emerald
    light: '#34D399',
    dark: '#059669',
    lighter: '#6EE7B7',
    darker: '#047857',
    contrast: '#FFFFFF',
  },

  // Accent - Purple for Premium Features
  accent: {
    main: '#8B5CF6',        // Violet
    light: '#A78BFA',
    dark: '#7C3AED',
    contrast: '#FFFFFF',
  },

  // Success - Money Received/Positive Actions
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    background: '#D1FAE5',
    border: '#6EE7B7',
  },

  // Warning - Pending/Fees
  warning: {
    main: '#F59E0B',
    light: '#FBB038',
    dark: '#D97706',
    background: '#FEF3C7',
    border: '#FCD34D',
  },

  // Error - Failed/Declined
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    background: '#FEE2E2',
    border: '#FCA5A5',
  },

  // Info - Informational
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    background: '#DBEAFE',
    border: '#93C5FD',
  },

  // Background Colors
  background: {
    default: '#F9FAFB',      // Light gray
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
    gradient: ['#6366F1', '#8B5CF6', '#EC4899'],  // Purple gradient
    overlay: 'rgba(0, 0, 0, 0.4)',
  },

  // Surface Colors (for cards, sections)
  surface: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    elevated: '#FFFFFF',
    hover: '#F3F4F6',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
    inverse: '#FFFFFF',
    link: '#6366F1',
    success: '#059669',
    error: '#DC2626',
  },

  // Border Colors
  border: {
    default: '#E5E7EB',
    light: '#F3F4F6',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
    focus: '#6366F1',
  },

  // Gradients (for backgrounds, buttons)
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],           // Indigo to Purple
    secondary: ['#10B981', '#059669'],         // Emerald gradient
    accent: ['#EC4899', '#8B5CF6'],            // Pink to Purple
    success: ['#10B981', '#34D399'],           // Green gradient
    hero: ['#6366F1', '#10B981'],              // Indigo to Emerald
    sunset: ['#F59E0B', '#EF4444'],            // Orange to Red
    card: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],  // Glassmorphism
  },

  // Transaction Type Colors
  transaction: {
    credit: '#10B981',     // Green
    debit: '#EF4444',      // Red
    pending: '#F59E0B',    // Amber
  },

  // Service Category Colors
  services: {
    airtime: '#EC4899',    // Pink
    data: '#8B5CF6',       // Purple
    electricity: '#F59E0B', // Amber
    cable: '#3B82F6',      // Blue
    transfer: '#6366F1',   // Indigo
    savings: '#10B981',    // Green
  },

  // Tier Badge Colors
  tier: {
    1: '#9CA3AF',          // Basic - Gray
    2: '#6366F1',          // Standard - Indigo
    3: '#F59E0B',          // Premium - Gold
  },

  // Shadows (for depth)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    card: '0 2px 8px rgba(99, 102, 241, 0.1)',
    button: '0 4px 12px rgba(99, 102, 241, 0.2)',
  },
};

export const darkColors = {
  // Primary Brand - Adjusted for dark mode
  primary: {
    main: '#818CF8',        // Lighter indigo for dark mode
    light: '#A5B4FC',
    dark: '#6366F1',
    lighter: '#C7D2FE',
    darker: '#4F46E5',
    contrast: '#FFFFFF',
  },

  // Secondary - Emerald for dark mode
  secondary: {
    main: '#34D399',
    light: '#6EE7B7',
    dark: '#10B981',
    lighter: '#A7F3D0',
    darker: '#059669',
    contrast: '#000000',
  },

  // Accent
  accent: {
    main: '#A78BFA',
    light: '#C4B5FD',
    dark: '#8B5CF6',
    contrast: '#000000',
  },

  // Success
  success: {
    main: '#34D399',
    light: '#6EE7B7',
    dark: '#10B981',
    background: '#064E3B',
    border: '#059669',
  },

  // Warning
  warning: {
    main: '#FBBF24',
    light: '#FCD34D',
    dark: '#F59E0B',
    background: '#78350F',
    border: '#D97706',
  },

  // Error
  error: {
    main: '#F87171',
    light: '#FCA5A5',
    dark: '#EF4444',
    background: '#7F1D1D',
    border: '#DC2626',
  },

  // Info
  info: {
    main: '#60A5FA',
    light: '#93C5FD',
    dark: '#3B82F6',
    background: '#1E3A8A',
    border: '#2563EB',
  },

  // Background Colors
  background: {
    default: '#0F172A',      // Slate 900
    paper: '#1E293B',        // Slate 800
    elevated: '#334155',     // Slate 700
    gradient: ['#1E293B', '#0F172A', '#020617'],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Surface Colors
  surface: {
    primary: '#1E293B',
    secondary: '#334155',
    elevated: '#475569',
    hover: '#475569',
  },

  // Text Colors
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    tertiary: '#94A3B8',
    disabled: '#64748B',
    inverse: '#0F172A',
    link: '#818CF8',
    success: '#34D399',
    error: '#F87171',
  },

  // Border Colors
  border: {
    default: '#334155',
    light: '#475569',
    medium: '#64748B',
    dark: '#94A3B8',
    focus: '#818CF8',
  },

  // Gradients
  gradients: {
    primary: ['#818CF8', '#A78BFA'],
    secondary: ['#34D399', '#10B981'],
    accent: ['#F472B6', '#A78BFA'],
    success: ['#34D399', '#6EE7B7'],
    hero: ['#818CF8', '#34D399'],
    sunset: ['#FBBF24', '#F87171'],
    card: ['rgba(30,41,59,0.9)', 'rgba(30,41,59,0.7)'],
  },

  // Transaction Type Colors
  transaction: {
    credit: '#34D399',
    debit: '#F87171',
    pending: '#FBBF24',
  },

  // Service Category Colors
  services: {
    airtime: '#F472B6',
    data: '#A78BFA',
    electricity: '#FBBF24',
    cable: '#60A5FA',
    transfer: '#818CF8',
    savings: '#34D399',
  },

  // Tier Badge Colors
  tier: {
    1: '#94A3B8',
    2: '#818CF8',
    3: '#FBBF24',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
    card: '0 2px 8px rgba(129, 140, 248, 0.2)',
    button: '0 4px 12px rgba(129, 140, 248, 0.3)',
  },
};

// Default export (light mode)
export const colors = lightColors;

export default { light: lightColors, dark: darkColors };
