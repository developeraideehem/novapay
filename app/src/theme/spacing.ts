// NovaPay Theme - Spacing System
// Consistent spacing and layout values

export const spacing = {
    // Base spacing unit (4px)
    base: 4,

    // Spacing scale
    xs: 4,
    sm: 8,
    md: 12,
    regular: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,

    // Screen padding
    screenHorizontal: 16,
    screenVertical: 24,

    // Card padding
    cardPadding: 16,
    cardPaddingLarge: 20,

    // Button padding
    buttonPaddingHorizontal: 24,
    buttonPaddingVertical: 14,

    // Input padding
    inputPadding: 16,
    inputPaddingVertical: 14,

    // List item padding
    listItemPadding: 16,
    listItemPaddingVertical: 12,

    // Icon sizes
    iconSmall: 16,
    iconMedium: 24,
    iconLarge: 32,
    iconXLarge: 48,

    // Border radius
    borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
    },

    // Touch target minimum (accessibility)
    touchTarget: 44,

    // Avatar sizes
    avatar: {
        xs: 24,
        sm: 32,
        md: 40,
        lg: 48,
        xl: 64,
    },
};

// Shadow styles for elevation
export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
};

export default { spacing, shadows };
