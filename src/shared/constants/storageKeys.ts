// Single inventory of every persistence key used by the app.
// These MUST match the legacy vanilla app so existing user data keeps loading
// after the migration (saved styles, applied theme, CV in progress, etc.).
export const STORAGE_KEYS = {
  // Theme editor
  SAVED_STYLES: 'oda_saved_styles',
  ACTIVE_STYLE_LIGHT: 'oda_active_style_id_light',
  ACTIVE_STYLE_DARK: 'oda_active_style_id_dark',
  APPLIED_LIGHT: 'oda_applied_light',
  APPLIED_DARK: 'oda_applied_dark',
  THEME_DEFAULT: 'oda_theme_default',
  THEME_CURRENT: 'oda_theme',
  THEME_ALLOW_TOGGLE: 'oda_theme_allow_toggle',
  LEGACY_ACTIVE_STYLE: 'oda_active_style_id', // migrated then removed

  // CV wizard
  CV_DATA: 'oda_cv_data',
} as const

// sessionStorage (cleared when the tab closes)
export const SESSION_KEYS = {
  ADMIN_LOGGED_IN: 'oda_admin_logged_in',
} as const
