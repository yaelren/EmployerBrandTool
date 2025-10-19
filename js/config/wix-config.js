/**
 * Wix Headless Configuration - PRODUCTION VERSION
 *
 * This file contains ONLY non-sensitive configuration that is safe to commit.
 * Sensitive data (API keys) are stored as environment variables in the backend.
 *
 * ✅ Safe to commit to version control
 * ✅ No secrets exposed to the browser
 */

export const WIX_CONFIG = {
    /**
     * OAuth Client ID (Safe to commit - public identifier)
     * Used for visitor authentication and OAuth flows
     */
    clientId: 'be6b179c-58a3-457e-aada-b37e3d245348',

    /**
     * Wix Site ID (Safe to commit - public identifier)
     * Found in your Wix dashboard URL:
     * https://manage.wix.com/dashboard/[YOUR-SITE-ID]/home
     *
     * Required for Media Manager API calls.
     */
    siteId: 'edaa8e17-ad18-47e2-8266-179540e1f27b',

    /**
     * API Key is NOT stored here for security.
     * The backend API uses environment variables (WIX_API_KEY).
     * The frontend NEVER needs to know the API key.
     */
};
