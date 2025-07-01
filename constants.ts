
export const APP_NAME = "IntelliForecast AI";
export const COMPANY_NAME = "Here and Now AI Research Institute";
export const COMPANY_LOGO_URL = "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/HNAI%20Title%20-Teal%20%26%20Golden%20Logo%20-%20DESIGN%203%20-%20Raj-07.png";

let apiKey: string | undefined = undefined;
try {
  // Check if process and process.env are defined before trying to access API_KEY
  // This adheres to the requirement of using process.env.API_KEY while preventing runtime errors
  // if the environment doesn't provide `process`.
  if (typeof process !== 'undefined' && process.env && typeof process.env.API_KEY === 'string') {
    apiKey = process.env.API_KEY;
  } else {
    // console.warn("process.env.API_KEY is not defined or not a string. AI features requiring a key may not work.");
  }
} catch (e) {
  console.warn("Error accessing process.env.API_KEY. Ensure it is configured in the execution environment.", e);
}
export const GEMINI_API_KEY = apiKey;


export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Forecast Dashboard', path: '/forecast' },
  { name: 'Analysis History', path: '/history' },
  { name: 'AI Assistant', path: '/assistant' },
];

export const LOCAL_STORAGE_HISTORY_KEY = 'intelliforecast_analysis_history';
export const MAX_HISTORY_ITEMS = 20; // Max number of history items to store

// INITIAL_MOCK_FORECAST_DATA removed as forecasts will be AI-generated