/**
 * Environment Configuration Utility
 * 
 * Provides centralized URL configuration for switching between
 * local development and production environments.
 */

// Environment URLs
export const ENV_URLS = {
  local: {
    backend: 'http://localhost:5000',
    frontend: 'http://localhost:5173',
    widget: 'http://localhost:5173/widget.js'
  },
  production: {
    backend: 'https://plot3d-backend.onrender.com',
    frontend: 'https://plot3d.vercel.app', // Update with your actual Vercel URL
    widget: 'https://plot3d.vercel.app/widget.js'
  }
};

/**
 * Get backend URL based on environment mode
 * @param {string} mode - 'local' or 'production'
 * @returns {string} Backend URL
 */
export const getBackendUrl = (mode = 'local') => {
  return ENV_URLS[mode]?.backend || ENV_URLS.local.backend;
};

/**
 * Get frontend URL based on environment mode
 * @param {string} mode - 'local' or 'production'
 * @returns {string} Frontend URL
 */
export const getFrontendUrl = (mode = 'local') => {
  return ENV_URLS[mode]?.frontend || ENV_URLS.local.frontend;
};

/**
 * Get widget script URL based on environment mode
 * @param {string} mode - 'local' or 'production'
 * @returns {string} Widget script URL
 */
export const getWidgetUrl = (mode = 'local') => {
  return ENV_URLS[mode]?.widget || ENV_URLS.local.widget;
};

/**
 * Check if current environment is production
 * @returns {boolean}
 */
export const isProduction = () => {
  return import.meta.env.VITE_API_URL?.includes('render.com') ||
    import.meta.env.VITE_API_URL?.includes('vercel.app') ||
    import.meta.env.MODE === 'production';
};

/**
 * Get current environment mode from Vite config
 * @returns {string} 'local' or 'production'
 */
export const getCurrentMode = () => {
  return isProduction() ? 'production' : 'local';
};

/**
 * Generate embed code for a venture
 * @param {Object} options - Embed options
 * @param {string} options.apiKey - Tenant API key
 * @param {string} options.ventureId - Venture ID
 * @param {string} options.mode - 'local' or 'production'
 * @param {string} options.theme - 'light' or 'dark'
 * @param {string} options.containerId - Container element ID
 * @returns {Object} Embed code snippets
 */
export const generateEmbedCode = ({ apiKey, ventureId, mode = 'local', theme = 'light', containerId = 'venture-viewer' }) => {
  const backendUrl = getBackendUrl(mode);
  const widgetUrl = getWidgetUrl(mode);

  // Basic HTML embed
  const htmlEmbed = `<!-- VentureCRM Widget -->
<div id="${containerId}"></div>
<script src="${widgetUrl}"></script>
<script>
  VentureCRM.init({
    apiKey: '${apiKey || 'YOUR_API_KEY'}',
    container: '#${containerId}',
    ventureId: '${ventureId || ''}',
    apiUrl: '${backendUrl}',
    theme: '${theme}'
  });
</script>`;

  // Minimal embed (just the widget)
  const minimalEmbed = `<div id="${containerId}"></div>
<script src="${widgetUrl}"></script>
<script>
  VentureCRM.init({
    apiKey: '${apiKey || 'YOUR_API_KEY'}',
    container: '#${containerId}'${ventureId ? `,\n    ventureId: '${ventureId}'` : ''},
    apiUrl: '${backendUrl}'
  });
</script>`;

  // React component
  const reactEmbed = `// VentureCRM Widget Integration
import { useEffect } from 'react';

const VentureWidget = () => {
  useEffect(() => {
    // Load widget script
    const script = document.createElement('script');
    script.src = '${widgetUrl}';
    script.async = true;
    script.onload = () => {
      window.VentureCRM.init({
        apiKey: '${apiKey || 'YOUR_API_KEY'}',
        container: '#${containerId}',${ventureId ? `\n        ventureId: '${ventureId}',` : ''}
        apiUrl: '${backendUrl}',
        theme: '${theme}'
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (window.VentureCRM) {
        window.VentureCRM.destroyAll();
      }
      document.body.removeChild(script);
    };
  }, []);

  return <div id="${containerId}" />;
};

export default VentureWidget;`;

  // Vue component
  const vueEmbed = `<!-- VentureCRM Widget Vue Component -->
<template>
  <div id="${containerId}"></div>
</template>

<script>
export default {
  name: 'VentureWidget',
  mounted() {
    const script = document.createElement('script');
    script.src = '${widgetUrl}';
    script.async = true;
    script.onload = () => {
      window.VentureCRM.init({
        apiKey: '${apiKey || 'YOUR_API_KEY'}',
        container: '#${containerId}',${ventureId ? `\n        ventureId: '${ventureId}',` : ''}
        apiUrl: '${backendUrl}',
        theme: '${theme}'
      });
    };
    document.body.appendChild(script);
  },
  beforeUnmount() {
    if (window.VentureCRM) {
      window.VentureCRM.destroyAll();
    }
  }
};
</script>`;

  // iFrame embed (for CMS/no-code platforms)
  const iframeEmbed = `<!-- VentureCRM Widget (iframe) -->
<iframe 
  src="${getFrontendUrl(mode)}/widget/embed?apiKey=${apiKey || 'YOUR_API_KEY'}${ventureId ? `&ventureId=${ventureId}` : ''}&theme=${theme}"
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>`;

  return {
    html: htmlEmbed,
    minimal: minimalEmbed,
    react: reactEmbed,
    vue: vueEmbed,
    iframe: iframeEmbed
  };
};

export default {
  ENV_URLS,
  getBackendUrl,
  getFrontendUrl,
  getWidgetUrl,
  isProduction,
  getCurrentMode,
  generateEmbedCode
};
