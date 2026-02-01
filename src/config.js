/**
 * API Configuration
 * 
 * V4 Multi-Tenant SaaS - Uses environment variable for API URL
 * Set VITE_API_URL in .env.local for local development
 */

// Get API base URL from environment or default to production
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Legacy API path (for backward compatibility during migration)
export const LEGACY_API_BASE = API_BASE + '/api';

// V1 API path (for new multi-tenant endpoints)
export const V1_API_BASE = API_BASE + '/api/v1';

// Export default for backward compatibility
export default API_BASE;
