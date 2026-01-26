// Set this to true if you want to test production API while running frontend locally
const FORCE_PRODUCTION = true;

const API_BASE = (window.location.hostname === 'localhost' && !FORCE_PRODUCTION)
    ? 'https://plotbackend-xi.vercel.app/api'
    : 'https://plotbackend-xi.vercel.app/api';

export default API_BASE;
