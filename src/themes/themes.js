/**
 * Jalebi Theme Manager
 * A lightweight theme manager for Jalebi UI Component Library
 *
 * Usage:
 * - jalebi.theme.listThemes() - Returns array of available themes
 * - jalebi.theme.setTheme(themeName) - Set a theme by name
 * - jalebi.theme.currentTheme() - Returns the current theme name
 * - jalebi.theme.getTheme(themeName) - Returns a theme object by name
 */

(function (global) {
    // Define the jalebi namespace if it doesn't exist
    if (!global.jalebi) {
        global.jalebi = {};
    }

    // Theme manager constructor
    const ThemeManager = function () {
        // Private variables
        let themes = [];
        let currentThemeName = null;
        let themeDataUrl = 'https://jalebi.soham.sh/src/themes/themes.json';
        let isLoaded = false;
        let onLoadCallbacks = [];

        // Private methods
        const applyTheme = function (theme) {
            for (const key in theme) {
                if (key !== 'name') {
                    document.documentElement.style.setProperty(key, theme[key]);
                }
            }
            currentThemeName = theme.name;

            // Dispatch theme-updated event
            const event = new CustomEvent('theme-updated', {
                detail: { theme: theme, themeName: theme.name },
            });
            document.dispatchEvent(event);

            return theme;
        };

        const init = async function () {
            try {
                const response = await fetch(themeDataUrl);
                const data = await response.json();
                themes = data.themes;
                isLoaded = true;

                // Apply default theme if one exists
                if (themes.length > 0) {
                    applyTheme(themes[0]);
                }

                // Execute any callbacks waiting for theme data to load
                onLoadCallbacks.forEach(callback => callback(themes));
                onLoadCallbacks = [];

                return themes;
            } catch (error) {
                console.error('Error loading Jalebi themes:', error);
                return [];
            }
        };

        // Initialize theme loading
        init();

        // Public API
        return {
            /**
             * Set the theme data URL
             * @param {string} url - The URL to fetch theme data from
             */
            setThemeDataUrl: function (url) {
                themeDataUrl = url;
                isLoaded = false;
                return init();
            },

            /**
             * Get list of available themes
             * @param {Function} callback - Optional callback for async loading
             * @returns {Array} Array of theme objects or empty array if not loaded yet
             */
            listThemes: function (callback) {
                if (isLoaded) {
                    if (callback && typeof callback === 'function') {
                        callback(themes);
                    }
                    return themes;
                } else {
                    if (callback && typeof callback === 'function') {
                        onLoadCallbacks.push(callback);
                    }
                    return [];
                }
            },

            /**
             * Set active theme by name
             * @param {string} themeName - Name of theme to apply
             * @returns {Object|null} Theme object or null if theme not found
             */
            setTheme: function (themeName) {
                if (!isLoaded) {
                    console.warn('Themes not loaded yet. Theme will be applied when loaded.');
                    onLoadCallbacks.push(() => this.setTheme(themeName));
                    return null;
                }

                const theme = themes.find(t => t.name === themeName);
                if (theme) {
                    return applyTheme(theme);
                } else {
                    console.error(`Theme '${themeName}' not found.`);
                    return null;
                }
            },

            /**
             * Get current theme name
             * @returns {string|null} Current theme name or null if no theme is set
             */
            currentTheme: function () {
                return currentThemeName;
            },

            /**
             * Get theme object by name
             * @param {string} themeName - Name of theme to retrieve
             * @returns {Object|null} Theme object or null if not found
             */
            getTheme: function (themeName) {
                if (!isLoaded) {
                    console.warn('Themes not loaded yet.');
                    return null;
                }

                return themes.find(t => t.name === themeName) || null;
            },

            /**
             * Check if themes are loaded
             * @returns {boolean} True if themes are loaded
             */
            isReady: function () {
                return isLoaded;
            },

            /**
             * Register callback for when themes are loaded
             * @param {Function} callback - Function to call when themes are loaded
             */
            onReady: function (callback) {
                if (isLoaded) {
                    callback(themes);
                } else {
                    onLoadCallbacks.push(callback);
                }
            },
        };
    };

    // Assign the theme manager to the jalebi namespace
    global.jalebi.theme = new ThemeManager();
})(typeof window !== 'undefined' ? window : this);
