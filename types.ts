
export interface MonthlyCashFlow {
  month: string;
  prediction: number;
  confidence_interval: [number, number];
}

export interface ForecastData {
  monthly_cash_flow: MonthlyCashFlow[];
  key_drivers: string[];
  risk_factors: string[];
}

export interface HistoricalAnalysis {
  id: string; // Typically a timestamp or UUID
  date: string; // ISO string format for date
  title: string;
  forecastData: ForecastData;
  aiInterpretation: string | null;
  // We can add originalDataSourceInfo (e.g. filename, or a snippet of text input)
  // but for localStorage size constraints in a demo, we'll keep it lean for now.
}

export enum GeminiModel {
  TEXT_GENERATION = "gemini-2.5-flash-preview-04-17",
  // IMAGE_GENERATION = "imagen-3.0-generate-002" // Not used in this app
}