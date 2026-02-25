/**
 * Design System - Centralized styling constants
 * Use these constants throughout the app for consistency
 */

export const colors = {
    // Primary
    primary: {
        DEFAULT: 'indigo-600',
        hover: 'indigo-700',
        light: 'indigo-50',
        dark: 'indigo-500/10',
    },

    // Backgrounds
    bg: {
        primary: 'white dark:bg-gray-900',
        secondary: 'gray-50 dark:bg-gray-900',
        tertiary: 'gray-100 dark:bg-gray-800',
    },

    // Borders
    border: {
        DEFAULT: 'gray-200 dark:border-gray-800',
        hover: 'gray-300 dark:border-gray-700',
        focus: 'indigo-500',
    },

    // Text
    text: {
        primary: 'gray-900 dark:text-white',
        secondary: 'gray-600 dark:text-gray-400',
        muted: 'gray-500 dark:text-gray-500',
        accent: 'indigo-600 dark:text-indigo-400',
    },
};

export const typography = {
    // Headings - Use sparingly, avoid font-black
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-semibold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-medium',

    // Body text
    body: {
        lg: 'text-base font-normal',
        md: 'text-sm font-normal',
        sm: 'text-xs font-normal',
    },

    // Labels
    label: 'text-xs font-medium uppercase tracking-wide',

    // Avoid using these (legacy):
    // - font-black (too heavy)
    // - tracking-widest (too spaced)
    // - excessive uppercase
};

export const spacing = {
    // Section spacing
    section: 'space-y-8',
    sectionLg: 'space-y-12',

    // Card spacing
    card: 'p-6',
    cardSm: 'p-4',

    // Grid gaps
    grid: 'gap-6',
    gridSm: 'gap-4',
};

export const borderRadius = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
};

export const transitions = {
    DEFAULT: 'transition-all duration-200',
    slow: 'transition-all duration-300',
    colors: 'transition-colors duration-200',
};

// Component-specific styles
export const components = {
    button: {
        primary: `bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold ${transitions.colors}`,
        secondary: `bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold ${transitions.colors} border border-gray-200 dark:border-gray-700`,
        ghost: `text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg font-medium ${transitions.colors}`,
    },

    input: `w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${transitions.DEFAULT}`,

    card: `bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg ${transitions.DEFAULT}`,

    badge: {
        base: 'text-xs font-medium px-2.5 py-1 rounded-md border',
        approved: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
        pending: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
        rejected: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
    },
};
