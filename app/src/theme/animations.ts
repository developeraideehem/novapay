// NovaPay Modern Theme - Animation & Timing Constants

export const animations = {
    // Duration in milliseconds
    duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
    },

    // Easing functions
    easing: {
        // Accelerate (entering elements)
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',

        // Decelerate (exiting elements)
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',

        // Both accelerate and decelerate
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

        // Sharp (instant feel)
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },

    // Spring animations (for React Native Reanimated)
    spring: {
        gentle: {
            damping: 20,
            stiffness: 120,
        },
        bouncy: {
            damping: 10,
            stiffness: 100,
        },
        smooth: {
            damping: 30,
            stiffness: 200,
        },
    },
};

export const borderRadius = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
    card: 16,
    button: 12,
    input: 10,
};

export const zIndex = {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1300,
    popover: 1400,
    toast: 1500,
    tooltip: 1600,
};

export default {
    animations,
    borderRadius,
    zIndex,
};
