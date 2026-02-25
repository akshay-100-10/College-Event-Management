// Event Categories
export const EVENT_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Other'] as const;

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    COLLEGE: 'college',
    STUDENT: 'student',
} as const;

// Event Status
export const EVENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
} as const;

// Registration Types
export const REGISTRATION_TYPES = {
    INTERNAL: 'internal',
    EXTERNAL: 'external',
} as const;
