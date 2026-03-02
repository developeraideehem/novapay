// NovaPay Theme - Typography System
// Optimized for African market with clear readability

export const typography = {
    // Font Families
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semibold: 'System',
        bold: 'System',
    },

    // Font Sizes (in pixels)
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 40,
    },

    // Font Weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line Heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Letter Spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
    },

    // Pre-defined Text Styles
    styles: {
        // Display - Large headings
        displayLarge: {
            fontSize: 40,
            fontWeight: '700' as const,
            lineHeight: 48,
            letterSpacing: -0.5,
        },
        displayMedium: {
            fontSize: 32,
            fontWeight: '700' as const,
            lineHeight: 40,
            letterSpacing: -0.25,
        },
        displaySmall: {
            fontSize: 28,
            fontWeight: '600' as const,
            lineHeight: 36,
        },

        // Headline - Section titles
        headlineLarge: {
            fontSize: 24,
            fontWeight: '600' as const,
            lineHeight: 32,
        },
        headlineMedium: {
            fontSize: 20,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        headlineSmall: {
            fontSize: 18,
            fontWeight: '600' as const,
            lineHeight: 24,
        },

        // Title - Card titles, list headers
        titleLarge: {
            fontSize: 18,
            fontWeight: '500' as const,
            lineHeight: 24,
        },
        titleMedium: {
            fontSize: 16,
            fontWeight: '500' as const,
            lineHeight: 22,
        },
        titleSmall: {
            fontSize: 14,
            fontWeight: '500' as const,
            lineHeight: 20,
        },

        // Body - Main content
        bodyLarge: {
            fontSize: 16,
            fontWeight: '400' as const,
            lineHeight: 24,
        },
        bodyMedium: {
            fontSize: 14,
            fontWeight: '400' as const,
            lineHeight: 20,
        },
        bodySmall: {
            fontSize: 12,
            fontWeight: '400' as const,
            lineHeight: 16,
        },

        // Label - Buttons, form labels
        labelLarge: {
            fontSize: 16,
            fontWeight: '600' as const,
            lineHeight: 20,
        },
        labelMedium: {
            fontSize: 14,
            fontWeight: '600' as const,
            lineHeight: 18,
        },
        labelSmall: {
            fontSize: 12,
            fontWeight: '600' as const,
            lineHeight: 16,
        },

        // Caption - Secondary info
        caption: {
            fontSize: 12,
            fontWeight: '400' as const,
            lineHeight: 16,
        },

        // Balance Display - For showing money
        balance: {
            fontSize: 32,
            fontWeight: '700' as const,
            lineHeight: 40,
            letterSpacing: -0.5,
        },
        balanceSmall: {
            fontSize: 24,
            fontWeight: '600' as const,
            lineHeight: 32,
        },

        // Amount Input
        amountInput: {
            fontSize: 40,
            fontWeight: '700' as const,
            lineHeight: 48,
            letterSpacing: -1,
        },
    },
};

export default typography;
