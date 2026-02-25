// URL validation utility
export const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;

    try {
        const parsed = new URL(url);
        // Only allow HTTP and HTTPS protocols
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
};

// Sanitize URL to prevent XSS
export const sanitizeUrl = (url: string): string => {
    if (!isValidUrl(url)) return '';

    try {
        const parsed = new URL(url);
        // Remove javascript: and data: protocols
        if (['javascript:', 'data:'].includes(parsed.protocol)) {
            return '';
        }
        return parsed.toString();
    } catch {
        return '';
    }
};

// Check if URL is from a trusted domain (optional)
export const isTrustedDomain = (url: string, trustedDomains: string[] = []): boolean => {
    if (!isValidUrl(url)) return false;

    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        // Check if hostname matches any trusted domain
        return trustedDomains.some(domain =>
            hostname === domain.toLowerCase() ||
            hostname.endsWith(`.${domain.toLowerCase()}`)
        );
    } catch {
        return false;
    }
};

// Validate event form data
export const validateEventData = (formData: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields
    if (!formData.title || formData.title.trim() === '') {
        errors.push('Event title is required');
    }

    if (!formData.date) {
        errors.push('Event date is required');
    }

    if (!formData.time) {
        errors.push('Event time is required');
    }

    if (!formData.venue || formData.venue.trim() === '') {
        errors.push('Venue is required');
    }

    // Validate external registration URL if provided
    if (formData.registration_type === 'external') {
        if (!formData.external_registration_url || formData.external_registration_url.trim() === '') {
            errors.push('External registration URL is required');
        } else if (!isValidUrl(formData.external_registration_url)) {
            errors.push('Please enter a valid HTTPS URL for external registration');
        } else {
            const sanitized = sanitizeUrl(formData.external_registration_url);
            if (!sanitized) {
                errors.push('Invalid or unsafe URL detected');
            }
        }
    }

    // Validate seats
    if (formData.total_seats) {
        const seats = parseInt(formData.total_seats);
        if (isNaN(seats) || seats < 1) {
            errors.push('Total seats must be at least 1');
        }
        if (seats > 10000) {
            errors.push('Total seats cannot exceed 10,000');
        }
    }

    // Validate price
    if (formData.price) {
        const price = parseFloat(formData.price);
        if (isNaN(price) || price < 0) {
            errors.push('Price must be a positive number');
        }
    }

    // Validate date is not in the past
    if (formData.date) {
        const eventDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            errors.push('Event date cannot be in the past');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

export default {
    isValidUrl,
    sanitizeUrl,
    isTrustedDomain,
    validateEventData
};
