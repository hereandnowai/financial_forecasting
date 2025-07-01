

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { ForecastData, MonthlyCashFlow, GeminiModel, HistoricalAnalysis } from '../types';
import { GEMINI_API_KEY, LOCAL_STORAGE_HISTORY_KEY, MAX_HISTORY_ITEMS } from '../constants';
import { HelpCircle, TrendingUp, AlertTriangle, Lightbulb, Zap, BarChartBig, UploadCloud, Info, FileText, XCircle, Image as ImageIcon, BrainCircuit, Sparkles, Rocket, ShieldAlert, BookOpen, MessageSquarePlus, Table, FileCode2, Camera } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import html2canvas from 'html2canvas';


const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const PDF_JS_WORKER_VERSION = "4.5.136"; // Match version in importmap

interface FileData {
  name: string;
  type: 'text' | 'image'; // PDF text is treated as 'text'
  content: string; // text content or base64 image data
  mimeType?: string; // for images
}

// Type for the properties object passed to the activeDot.onClick handler in LineChart
interface ActiveDotClickData {
  payload: MonthlyCashFlow;
  cx?: number;
  cy?: number;
  index?: number;
  value?: any;
  [key: string]: any;
}


const ForecastPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [historicalDataInput, setHistoricalDataInput] = useState<string>('');
  const [scenarioQuery, setScenarioQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // For AI calls
  const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [currentForecast, setCurrentForecast] = useState<ForecastData | null>(null);
  const [displayChartType, setDisplayChartType] = useState<'line' | 'bar'>('line');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardContentRef = useRef<HTMLDivElement>(null); // Ref for dashboard content capture

  const [selectedMonthForInsight, setSelectedMonthForInsight] = useState<string | null>(null);
  const [monthSpecificInsight, setMonthSpecificInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const [overallForecastInsight, setOverallForecastInsight] = useState<string | null>(null);
  const [isLoadingOverallInsight, setIsLoadingOverallInsight] = useState<boolean>(false);
  const [overallInsightError, setOverallInsightError] = useState<string | null>(null);
  
  const [isScenarioInterpretation, setIsScenarioInterpretation] = useState<boolean>(false);
  const [isDownloadingDashboard, setIsDownloadingDashboard] = useState<boolean>(false);


  const { theme } = useTheme();
  const [chartColors, setChartColors] = useState({
    linePrimary: 'var(--color-chart-line-primary)',
    lineSecondary1: 'var(--color-chart-line-secondary1)',
    lineSecondary2: 'var(--color-chart-line-secondary2)',
    grid: 'var(--color-chart-grid)',
    text: 'var(--color-chart-text)',
    tooltipBg: 'var(--color-chart-tooltip-bg)',
    tooltipBorder: 'var(--color-chart-tooltip-border)',
    tooltipLabel: 'var(--color-chart-tooltip-text-label)',
    tooltipItem: 'var(--color-chart-tooltip-text-item)',
    barFill: 'var(--color-chart-bar-fill)',
  });

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };
  
  useEffect(() => {
    if (location.state && location.state.historicalAnalysis) {
      const { forecastData, aiInterpretation: histInterpretation, title } = location.state.historicalAnalysis as HistoricalAnalysis;
      setCurrentForecast(forecastData);
      setAiInterpretation(histInterpretation);
      setError(null); 
      setHistoricalDataInput('');
      setSelectedFile(null);
      setFileData(null);
      setFileError(null);
      setScenarioQuery('');
      setIsScenarioInterpretation(false); 
      setSelectedMonthForInsight(null);
      setMonthSpecificInsight(null);
      setInsightError(null);
      setOverallForecastInsight(null);
      setIsLoadingOverallInsight(false);
      setOverallInsightError(null);
      navigate(location.pathname, { replace: true, state: {} }); 
      const notification = document.createElement('div');
      notification.textContent = `Loaded historical analysis: "${title}"`;
      notification.style.cssText = "position:fixed; top:80px; left:50%; transform:translateX(-50%); background-color:var(--color-text-accent); color:var(--color-text-on-accent); padding:10px 20px; border-radius:5px; z-index:1000; box-shadow: var(--color-shadow-card);";
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  }, [location, navigate]);


  useEffect(() => {
    setChartColors({
        linePrimary: 'var(--color-chart-line-primary)',
        lineSecondary1: 'var(--color-chart-line-secondary1)',
        lineSecondary2: 'var(--color-chart-line-secondary2)',
        grid: 'var(--color-chart-grid)',
        text: 'var(--color-chart-text)',
        tooltipBg: 'var(--color-chart-tooltip-bg)',
        tooltipBorder: 'var(--color-chart-tooltip-border)',
        tooltipLabel: 'var(--color-chart-tooltip-text-label)',
        tooltipItem: 'var(--color-chart-tooltip-text-item)',
        barFill: 'var(--color-chart-bar-fill)',
    });
  }, [theme]);

  const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

  const saveAnalysisToHistory = (forecast: ForecastData, interpretation: string | null) => {
    try {
      const now = new Date();
      const newAnalysis: HistoricalAnalysis = {
        id: now.toISOString(),
        date: now.toISOString(),
        title: `Forecast - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        forecastData: forecast,
        aiInterpretation: interpretation,
      };

      const existingHistoryJson = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      let history: HistoricalAnalysis[] = existingHistoryJson ? JSON.parse(existingHistoryJson) : [];
      
      history.unshift(newAnalysis); 
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS); 
      }
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save analysis to history:", e);
      setError("Could not save this analysis to history due to a local storage issue.");
    }
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
    }

    if (!file) {
      setSelectedFile(null);
      setFileData(null);
      setFileError(null);
      return;
    }

    setSelectedFile(file);
    setFileData(null);
    setFileError(null);
    setIsFileProcessing(true);
    setError(null); 
    setAiInterpretation(null); 
    setIsScenarioInterpretation(false);
    setSelectedMonthForInsight(null);
    setMonthSpecificInsight(null);
    setInsightError(null);
    setOverallForecastInsight(null);
    setIsLoadingOverallInsight(false);
    setOverallInsightError(null);


    const { name, type, size } = file;

    if (type.startsWith('image/')) {
      if (size > MAX_IMAGE_SIZE_BYTES) {
        setFileError(`Image file is too large (max ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB).`);
        setSelectedFile(null);
        setIsFileProcessing(false);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData({ name, type: 'image', content: (reader.result as string).split(',')[1], mimeType: type });
        setIsFileProcessing(false);
      };
      reader.onerror = () => {
        setFileError('Error reading image file.');
        setSelectedFile(null);
        setIsFileProcessing(false);
      };
      reader.readAsDataURL(file);
    } else if (['text/plain', 'text/csv', 'text/markdown', 'application/json', 'application/xml'].includes(type) || name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.md') || name.endsWith('.json') || name.endsWith('.xml')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData({ name, type: 'text', content: reader.result as string });
        setIsFileProcessing(false);
      };
      reader.onerror = () => {
        setFileError('Error reading text file.');
        setSelectedFile(null);
        setIsFileProcessing(false);
      };
      reader.readAsText(file);
    } else if (type === 'application/pdf' || name.endsWith('.pdf')) {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${PDF_JS_WORKER_VERSION}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((s: any) => s.str).join(' ') + '\n';
        }
        if (!textContent.trim()) {
          setFileError('Extracted no text from PDF. It might be image-based or empty. Try providing data textually, as an image, or ensure the PDF contains selectable text.');
        }
        setFileData({ name, type: 'text', content: textContent.trim() });
        setIsFileProcessing(false);
      } catch (e: any) {
        console.error('Error processing PDF:', e);
        setFileError(`Error processing PDF: ${e.message}. Try converting to text/image or copy-pasting content.`);
        setSelectedFile(null);
        setIsFileProcessing(false);
      }
    } else {
      setFileError(`Unsupported file type: '${type || 'unknown'}'. Please upload text, CSV, MD, JSON, XML, image, or PDF.`);
      setSelectedFile(null);
      setIsFileProcessing(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileData(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const getSystemInstruction = (imageProvided: boolean, textProvided: boolean) => {
    let dataSourcesDescription = "";
    if (imageProvided && textProvided) {
      dataSourcesDescription = "You will receive financial information as an IMAGE and accompanying TEXT.\nThe IMAGE may contain financial statements, tables, receipts, or handwritten notes. Analyze it carefully, performing OCR if necessary, to extract all relevant financial figures, dates, and descriptions.\nThe TEXT provides additional financial data, context, or specific instructions. It might be from a file (like TXT, CSV, or extracted from a PDF) or manually typed notes.\nYour task is to SYNTHESIZE information from BOTH the image and the text to form a comprehensive understanding of the user's financial situation.";
    } else if (imageProvided) {
      dataSourcesDescription = "You will receive financial information as an IMAGE.\nThe IMAGE may contain financial statements, tables, receipts, or handwritten notes. Analyze it carefully, performing OCR if necessary, to extract all relevant financial figures, dates, and descriptions to understand the user's financial situation.";
    } else if (textProvided) {
      dataSourcesDescription = "You will receive financial information as TEXT input.\nThis text input might be from a file (like TXT, CSV, or extracted from a PDF) or manually typed notes by the user. It contains historical financial information, descriptions, figures, or tables.\nYour task is to INTERPRET this text input as best as you can to understand the user's financial situation.";
    } else {
      return "You are an expert financial AI model. Your SOLE TASK is to generate a 12-month cash flow forecast. However, no specific financial data was provided in this request. Please inform the user that data is required. Your response should still be in the specified JSON format, possibly indicating missing data in 'key_drivers' or 'risk_factors'.";
    }

    return `You are an expert financial AI model. Your SOLE TASK is to generate a 12-month cash flow forecast.
${dataSourcesDescription}
Based on your interpretation of ALL provided input, identify trends, seasonality (if indicated or inferable), and typical revenue/expense patterns.
Then, generate a 12-month cash flow forecast starting from the month after the last provided historical data point (or current month if no dates are clear).

Your response MUST BE A VALID JSON OBJECT ONLY. It ABSOLUTELY MUST adhere to this exact structure:
{
  "monthly_cash_flow": [
    {"month": "YYYY-MM", "prediction": 0, "confidence_interval": [0, 0]}
  ],
  "key_drivers": ["string1", "string2"],
  "risk_factors": ["string1", "string2"]
}

Details for the JSON structure:
- "monthly_cash_flow": An array of EXACTLY 12 objects, each representing a month.
- "month": String in "YYYY-MM" format. Ensure chronological order.
- "prediction": A NUMBER representing the cash flow prediction (e.g., net of revenue and expenses).
- "confidence_interval": An array of two NUMBERS [lower_bound, upper_bound].
- "key_drivers": An array of 2-3 strings describing key factors influencing your forecast.
- "risk_factors": An array of 2-3 strings describing potential risks affecting the forecast.

CRITICAL INSTRUCTIONS:
1.  YOUR ENTIRE RESPONSE MUST START WITH '{' AND END WITH '}'.
2.  DO NOT include ANY text, explanations, apologies, greetings, or conversational remarks before or after the JSON object.
3.  DO NOT use markdown code fences (like \`\`\`json) around the JSON.
4.  Ensure all string values within the JSON are enclosed in double quotes.
5.  Ensure all numbers are valid numerical types, not strings.
6.  If the input data is very sparse or unclear, make reasonable assumptions and reflect them in key_drivers or risk_factors. If no data at all, indicate this.
7.  The output must be a single, complete, and valid JSON object. NOTHING ELSE.
`;
  };


const getSystemPromptForScenario = (currentMonthlyForecast: MonthlyCashFlow[], userScenarioQuery: string) => `You are an AI financial scenario analyst. Your SOLE TASK is to adjust a given cash flow forecast based on a user's scenario.
The current 12-month cash flow forecast is:
${JSON.stringify(currentMonthlyForecast, null, 2)}

The user wants to understand the impact of the following scenario: "${userScenarioQuery}"

Analyze this scenario and adjust the provided monthly cash flow predictions accordingly.
Your response MUST BE A VALID JSON OBJECT ONLY. It ABSOLUTELY MUST adhere to this exact structure:
{
  "interpretation_text": "Brief explanation of changes made to the forecast based on the scenario.",
  "monthly_cash_flow": [
    {"month": "YYYY-MM", "prediction": 0, "confidence_interval": [0,0]}
  ]
}

Details for the JSON structure:
- "interpretation_text": A string (1-2 sentences) explaining the adjustments based SOLELY on the user's scenario.
- "monthly_cash_flow": An array of EXACTLY 12 objects, matching the structure and month sequence of the original forecast's monthly_cash_flow items. Each item must have "month" (string YYYY-MM), "prediction" (NUMBER), and "confidence_interval" (array of 2 NUMBERS).

CRITICAL INSTRUCTIONS:
1.  YOUR ENTIRE RESPONSE MUST START WITH '{' AND END WITH '}'.
2.  DO NOT include ANY text, explanations, apologies, greetings, or conversational remarks before or after the JSON object.
3.  DO NOT use markdown code fences (like \`\`\`json) around the JSON.
4.  DO NOT modify key_drivers or risk_factors from any original forecast; your task is only to provide the "interpretation_text" and the adjusted "monthly_cash_flow".
5.  Ensure all string values within the JSON are enclosed in double quotes.
6.  Ensure all numbers are valid numerical types, not strings.
7.  The output must be a single, complete, and valid JSON object. NOTHING ELSE.
`;

const getSystemPromptForMonthInsight = (forecast: ForecastData, sMonth: string): string => {
    const monthData = forecast.monthly_cash_flow.find(m => m.month === sMonth);
    if (!monthData) return "Error: Selected month data not found in the provided forecast context.";

    const fullMonthlyDataString = forecast.monthly_cash_flow
        .map(m => `  Month: ${m.month}, Prediction: ${formatNumber(m.prediction)}, Confidence: [${formatNumber(m.confidence_interval[0])} to ${formatNumber(m.confidence_interval[1])}]`)
        .join('\n');

    return `You are an expert AI financial analyst providing a focused insight.
The user has the following 12-month cash flow forecast:
Overall Key Drivers: ${forecast.key_drivers.join(', ') || 'Not specified'}
Overall Risk Factors: ${forecast.risk_factors.join(', ') || 'Not specified'}
Full Monthly Data:
${fullMonthlyDataString}

The user specifically wants to understand the forecast for the month of: ${sMonth}.
The forecast for ${sMonth} shows a prediction of ${formatNumber(monthData.prediction)}.

Your task is to provide a concise explanation (2-3 sentences, maximum 4) for this specific prediction for ${sMonth}.
Consider the following aspects in your explanation:
-   How does this month's prediction compare to the immediately preceding and succeeding months? (e.g., is it a peak, a dip, stable, part of a growth/decline trend?)
-   How might the overall key drivers or risk factors (listed above) specifically influence this particular month's figure?
-   Are there any implicit trends (e.g., growth trajectory, decline, potential seasonality if pattern is evident from the monthly data) that contribute to this month's value?
-   What are the most likely reasons or contributing factors for this specific predicted figure for ${sMonth}?

Your response MUST be a direct textual explanation.
ABSOLUTELY DO NOT use JSON, markdown, or any kind of list formatting.
Focus ONLY on explaining the prediction for the selected month: ${sMonth}. Be clear and direct.`;
};

const getSystemPromptForOverallForecastInsight = (forecast: ForecastData): string => {
    const fullMonthlyDataString = forecast.monthly_cash_flow
        .map(m => `  - Month: ${m.month}, Prediction: ${formatNumber(m.prediction)}, Confidence: [${formatNumber(m.confidence_interval[0])} to ${formatNumber(m.confidence_interval[1])}]`)
        .join('\n');

    return `You are an expert AI financial analyst. The user has generated the following 12-month cash flow forecast:
Overall Key Drivers: ${forecast.key_drivers.join('; ') || 'Not specified'}
Overall Risk Factors: ${forecast.risk_factors.join('; ') || 'Not specified'}
Monthly Breakdown:
${fullMonthlyDataString}

Your task is to provide a comprehensive and holistic insight into this entire 12-month forecast. Your analysis should be a narrative, typically 2-4 paragraphs long.

In your analysis, please cover the following:
1.  **Overall Trend:** Describe the general trajectory of the forecast. Is it showing growth, decline, stability, or significant fluctuations? Are there any clear patterns (e.g., U-shape, V-shape, consistent incline/decline)?
2.  **Key Periods/Turning Points:** Highlight any specific months or periods that stand out (e.g., peaks, troughs, periods of rapid change, shifts in trend). Explain what might be driving these.
3.  **Impact of Drivers and Risks:** Discuss how the identified 'Key Drivers' and 'Risk Factors' likely influence the overall shape and specifics of the forecast across the 12 months. Explain their interplay.
4.  **Confidence Levels:** Briefly comment if the confidence intervals suggest high certainty or significant unpredictability in certain periods, if noteworthy.
5.  **Narrative Summary:** Conclude with a summary of what this forecast implies for the user's financial outlook over the next year. What are the main takeaways?

Your response MUST be a direct textual explanation.
ABSOLUTELY DO NOT use JSON, markdown, or any kind of list formatting (unless it's naturally part of a sentence).
Provide a coherent, well-structured narrative. Be insightful and clear.
`;
};


  const parseJsonFromText = (text: string): any | null => {
    let jsonStrToParse = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStrToParse.match(fenceRegex);
    if (match && match[2]) {
      jsonStrToParse = match[2].trim();
    }
    try {
      return JSON.parse(jsonStrToParse);
    } catch (e) {
      console.error("Failed to parse JSON response. Error:", e);
      console.error("Original text received from AI:", text);
      if (text.trim() !== jsonStrToParse) {
        console.error("Text attempted for parsing (after fence removal):", jsonStrToParse);
      }
      setError("The AI's response was not in the expected JSON format. This can sometimes happen with complex inputs or if the AI deviates from instructions. Please try simplifying your input or rephrasing your request.");
      return null;
    }
  };
  
  const handleGenerateForecast = useCallback(async () => {
    if (!ai) {
      setError("Gemini API key not configured. Cannot generate forecast.");
      return;
    }

    const contentPartsForApi: any[] = [];
    let combinedTextInputForPrompt: string | null = historicalDataInput.trim() || null;

    if (fileData?.type === 'text' && fileData.content.trim()) {
      const fileContentText = `Data from uploaded file (${fileData.name}):\n${fileData.content.trim()}`;
      if (combinedTextInputForPrompt) {
        combinedTextInputForPrompt = `${fileContentText}\n\n--- Additional Notes/Input ---\n${combinedTextInputForPrompt}`;
      } else {
        combinedTextInputForPrompt = fileContentText;
      }
    }

    if (fileData?.type === 'image' && fileData.content && fileData.mimeType) {
      contentPartsForApi.push({
        inlineData: {
          data: fileData.content,
          mimeType: fileData.mimeType,
        },
      });
    }
    
    if (combinedTextInputForPrompt) {
      contentPartsForApi.push({ text: combinedTextInputForPrompt });
    }

    if (contentPartsForApi.length === 0) {
      setError("Please input some historical financial data, either by typing/pasting or uploading a file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileError(null); 
    setAiInterpretation(null);
    setCurrentForecast(null);
    setIsScenarioInterpretation(false);
    setSelectedMonthForInsight(null); 
    setMonthSpecificInsight(null);
    setInsightError(null);
    setOverallForecastInsight(null);
    setIsLoadingOverallInsight(false);
    setOverallInsightError(null);


    const systemInstruction = getSystemInstruction(
      fileData?.type === 'image',
      !!combinedTextInputForPrompt
    );

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GeminiModel.TEXT_GENERATION,
        contents: { parts: contentPartsForApi },
        config: { 
          systemInstruction: systemInstruction,
          responseMimeType: "application/json" 
        }
      });
      
      const forecastResult = parseJsonFromText(response.text);

      if (forecastResult) { 
        if (
            Array.isArray(forecastResult.monthly_cash_flow) &&
            forecastResult.monthly_cash_flow.length === 12 &&
            forecastResult.monthly_cash_flow.every((item: any) => 
              typeof item.month === 'string' && 
              typeof item.prediction === 'number' &&
              Array.isArray(item.confidence_interval) && item.confidence_interval.length === 2 &&
              typeof item.confidence_interval[0] === 'number' && typeof item.confidence_interval[1] === 'number'
            ) &&
            Array.isArray(forecastResult.key_drivers) &&
            Array.isArray(forecastResult.risk_factors)
        ) {
            setCurrentForecast(forecastResult);
            const interpretationText = "Successfully generated forecast based on your data. You can now explore specific monthly insights or request an overall forecast analysis.";
            setAiInterpretation(interpretationText);
            setIsScenarioInterpretation(false);
            saveAnalysisToHistory(forecastResult, interpretationText);
        } else {
            console.error("Parsed JSON has incorrect structure or not 12 months:", forecastResult);
            setError("AI returned data in an unexpected structure, even though it was valid JSON (e.g., not 12 months of cash flow, or missing fields). Please check the AI's response if possible, or simplify your input.");
            setCurrentForecast(null);
        }
      } else {
        setCurrentForecast(null);
      }

    } catch (e: any) {
      console.error("Error during forecast generation process:", e);
      if (!error) { 
         setError(`An unexpected error occurred while generating forecast: ${e.message}. Please check your input or try again.`);
      }
      setCurrentForecast(null);
    } finally {
      setIsLoading(false);
    }
  }, [historicalDataInput, fileData, ai, error]); // Added error to dependency array

  const handleScenarioAnalysis = useCallback(async () => {
    if (!scenarioQuery.trim()) {
      setError("Please enter a scenario to analyze.");
      return;
    }
    if (!currentForecast) {
      setError("Please generate a base forecast first before analyzing scenarios.");
      return;
    }
    if (!ai) {
      setError("Gemini API key not configured. Cannot analyze scenario.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileError(null);
    setSelectedMonthForInsight(null); 
    setMonthSpecificInsight(null);
    setInsightError(null);
    setOverallForecastInsight(null); 
    setIsLoadingOverallInsight(false);
    setOverallInsightError(null);
    
    const systemPromptScenario = getSystemPromptForScenario(currentForecast.monthly_cash_flow, scenarioQuery);

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GeminiModel.TEXT_GENERATION,
        contents: "Analyze the provided scenario against the current forecast.", 
        config: { 
            systemInstruction: systemPromptScenario,
            responseMimeType: "application/json" 
        }
      });
      
      const scenarioResult = parseJsonFromText(response.text);

      if (scenarioResult) { 
         if (
            typeof scenarioResult.interpretation_text === 'string' &&
            Array.isArray(scenarioResult.monthly_cash_flow) && 
            scenarioResult.monthly_cash_flow.length === 12 && 
            scenarioResult.monthly_cash_flow.every((item: any) => 
              typeof item.month === 'string' && 
              typeof item.prediction === 'number' &&
              Array.isArray(item.confidence_interval) && item.confidence_interval.length === 2 &&
              typeof item.confidence_interval[0] === 'number' && typeof item.confidence_interval[1] === 'number'
            )
        ) {
            const updatedForecastData = {
                ...currentForecast, 
                monthly_cash_flow: scenarioResult.monthly_cash_flow,
            };
            setCurrentForecast(updatedForecastData);
            const interpretationText = scenarioResult.interpretation_text || "Scenario analyzed and forecast updated.";
            setAiInterpretation(interpretationText);
            setIsScenarioInterpretation(true); 
            saveAnalysisToHistory(updatedForecastData, `Scenario: "${scenarioQuery}" - ${interpretationText}`);

        } else {
             console.error("Parsed JSON for scenario has incorrect structure or not 12 months:", scenarioResult);
             setError("AI returned scenario data in an unexpected structure, even though it was valid JSON. Please try again.");
        }
      } 

    } catch (e: any) {
      console.error("Error analyzing scenario with Gemini:", e);
      if (!error) {
        setError(`Scenario analysis failed: ${e.message}. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [scenarioQuery, currentForecast, ai, error]); // Added error to dependency array


  const handleGetInsightForMonth = useCallback(async (month: string) => {
    if (!ai || !currentForecast) {
        setInsightError("Cannot fetch insight: AI or current forecast is not ready.");
        setSelectedMonthForInsight(month); 
        return;
    }
    if (isLoadingInsight && selectedMonthForInsight === month) return;

    setSelectedMonthForInsight(month);
    setIsLoadingInsight(true);
    setMonthSpecificInsight(null);
    setInsightError(null);

    const systemInstruction = getSystemPromptForMonthInsight(currentForecast, month);
    const userPromptForInsight = `Provide a specific insight for the month of ${month} based on the overall forecast data I've provided in the system instruction.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GeminiModel.TEXT_GENERATION,
            contents: userPromptForInsight,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        setMonthSpecificInsight(response.text.trim());
    } catch (e: any) {
        console.error(`Error fetching monthly insight for ${month}:`, e);
        setInsightError(`Failed to get insight for ${month}: ${e.message}. The AI might be temporarily unavailable or the request could not be processed.`);
    } finally {
        setIsLoadingInsight(false);
    }
  }, [ai, currentForecast, isLoadingInsight, selectedMonthForInsight]);

  const handleGetOverallForecastInsight = useCallback(async () => {
    if (!ai || !currentForecast) {
        setOverallInsightError("Cannot fetch overall insight: AI or current forecast is not ready.");
        return;
    }
    if (isLoadingOverallInsight) return;

    setIsLoadingOverallInsight(true);
    setOverallForecastInsight(null);
    setOverallInsightError(null);
    
    const systemInstruction = getSystemPromptForOverallForecastInsight(currentForecast);
    const userPromptForOverallInsight = "Provide a comprehensive analysis of the entire forecast based on the data given in the system instruction.";

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GeminiModel.TEXT_GENERATION,
            contents: userPromptForOverallInsight,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        setOverallForecastInsight(response.text.trim());
    } catch (e: any) {
        console.error("Error fetching overall forecast insight:", e);
        setOverallInsightError(`Failed to get overall insight: ${e.message}. The AI might be temporarily unavailable or the request could not be processed.`);
    } finally {
        setIsLoadingOverallInsight(false);
    }
  }, [ai, currentForecast, isLoadingOverallInsight]);


  const handleDownloadForecastCSV = () => {
    if (!currentForecast) return;

    const headers = "Month,Prediction,Confidence Low,Confidence High";
    const rows = currentForecast.monthly_cash_flow.map(item => 
      `${item.month},${item.prediction},${item.confidence_interval[0]},${item.confidence_interval[1]}`
    );
    const csvContent = `${headers}\n${rows.join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0,10);
      link.setAttribute("href", url);
      link.setAttribute("download", `IntelliForecast_Analysis_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadFullAnalysis = () => {
    if (!currentForecast) return;

    const now = new Date();
    let reportContent = `# IntelliForecast AI - Full Analysis Report\n\n`;
    reportContent += `**Generated on:** ${now.toLocaleString()}\n\n`;

    if (aiInterpretation) {
        reportContent += `## AI Action Summary & Interpretation\n`;
        if (isScenarioInterpretation && scenarioQuery) {
            reportContent += `Based on scenario: "${scenarioQuery}"\n`;
        }
        reportContent += `> ${aiInterpretation.split('\n').join('\n> ')}\n\n`;
    }

    if (overallForecastInsight) {
        reportContent += `## Comprehensive AI Forecast Insight\n`;
        reportContent += `> ${overallForecastInsight.split('\n').join('\n> ')}\n\n`;
    } else {
        reportContent += `## Comprehensive AI Forecast Insight\n`;
        reportContent += `> Not generated for this analysis session.\n\n`;
    }

    reportContent += `---
## 12-Month Cash Flow Projection

| Month     | Prediction   | Confidence Low | Confidence High |
|:----------|:-------------|:---------------|:----------------|
`;
    currentForecast.monthly_cash_flow.forEach(item => {
        reportContent += `| ${item.month} | ${formatNumber(item.prediction)} | ${formatNumber(item.confidence_interval[0])} | ${formatNumber(item.confidence_interval[1])} |\n`;
    });
    reportContent += `\n`;

    reportContent += `---
## Key Drivers
`;
    currentForecast.key_drivers.forEach(driver => {
        reportContent += `- ${driver}\n`;
    });
    reportContent += `\n`;

    reportContent += `---
## Risk Factors
`;
    currentForecast.risk_factors.forEach(factor => {
        reportContent += `- ${factor}\n`;
    });
    reportContent += `\n---\n`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const timestamp = now.toISOString().slice(0,19).replace(/:/g,'').replace('T','_');
      link.setAttribute("href", url);
      link.setAttribute("download", `IntelliForecast_Full_Analysis_${timestamp}.md`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadDashboardImage = async () => {
    if (!dashboardContentRef.current) {
        setError("Could not find dashboard content to capture.");
        return;
    }
    setIsDownloadingDashboard(true);
    setError(null);
    try {
        const canvas = await html2canvas(dashboardContentRef.current, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--color-background-primary').trim() || '#F1F5F9', // Use theme background
            scrollX: 0,
            scrollY: -window.scrollY, // Try to capture from top
            windowWidth: dashboardContentRef.current.scrollWidth,
            windowHeight: dashboardContentRef.current.scrollHeight
        });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const today = new Date().toISOString().slice(0, 10);
        link.download = `IntelliForecast_Dashboard_View_${today}.png`;
        link.href = image;
        link.click();
    } catch (err: any) {
        console.error("Error capturing dashboard image:", err);
        setError(`Failed to capture dashboard image: ${err.message}`);
    } finally {
        setIsDownloadingDashboard(false);
    }
  };


  return (
    <div className="space-y-8" ref={dashboardContentRef}>
      <Card title="Step 1: Input Your Financial Data" icon={<UploadCloud className="w-6 h-6" />}>
        <div className="mb-6 p-3 bg-[var(--color-button-outline-hover-bg)] border border-[var(--color-text-accent)] rounded-md text-sm text-[var(--color-text-accent)] flex items-start">
            <Info size={36} className="mr-3 flex-shrink-0" /> 
            <div>
                Provide your historical financial information. You can either:
                <ul className="list-disc list-inside ml-4 my-2 text-xs">
                    <li><b>Upload a file:</b> Supports text (.txt), CSV (.csv), Markdown (.md), JSON (.json), XML (.xml), images (.png, .jpg, .jpeg - max 4MB), or PDF (.pdf - text will be extracted). For spreadsheets (Excel, Google Sheets), please save as CSV or copy-paste content into the text area.</li>
                    <li><b>Type or paste data directly</b> into the text area below.</li>
                </ul>
                You can use both: upload a file and add supplementary notes/context in the text area. The AI will consider all provided information to generate the forecast.
            </div>
        </div>

        <div className="mb-4">
            <label htmlFor="file-upload" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Upload File (Optional):</label>
            <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.csv,.md,.json,.xml,image/png,image/jpeg,.pdf"
                className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-button-secondary-bg)] file:text-[var(--color-button-secondary-text)] hover:file:bg-[var(--color-button-secondary-hover-bg)] disabled:opacity-50"
                disabled={isLoading || isFileProcessing}
            />
        </div>

        {isFileProcessing && (
            <div className="my-3 text-sm text-[var(--color-text-secondary)] flex items-center">
                <Spinner size="sm" /> <span className="ml-2">Processing file...</span>
            </div>
        )}

        {fileError && <p className="my-3 text-xs text-red-600 bg-red-100 p-2 rounded-md flex items-center"><AlertTriangle size={16} className="mr-2"/>{fileError}</p>}
        
        {selectedFile && !fileError && fileData && (
            <div className="my-3 p-3 bg-[var(--color-background-secondary)] rounded-md text-sm text-[var(--color-text-primary)] flex items-center justify-between">
                <div className="flex items-center">
                    {fileData.type === 'image' ? <ImageIcon size={18} className="mr-2 text-[var(--color-text-accent)]" /> : <FileText size={18} className="mr-2 text-[var(--color-text-accent)]" />}
                    <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
                    {fileData.type === 'text' && fileData.content.length === 0 && (
                        <span className="ml-2 text-amber-600 text-xs">(File processed, but no text content found or extracted)</span>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={handleClearFile} disabled={isLoading || isFileProcessing} className="!p-1.5">
                    <XCircle size={16} />
                </Button>
            </div>
        )}
        
        <textarea
          id="historical-data-input"
          value={historicalDataInput}
          onChange={(e) => setHistoricalDataInput(e.target.value)}
          placeholder="Type or paste your financial data here, or add notes to supplement an uploaded file. Examples:&#10;- 'Monthly sales: Jan $5k, Feb $5.5k, Mar $6k. Costs are 60% of sales.'&#10;- 'Q4 2023: Total Revenue $150k, Total Expenses $90k. Expecting stable performance.'"
          rows={selectedFile ? 3 : 6} 
          className="w-full p-3 border border-[var(--color-border-primary)] rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] text-sm text-[var(--color-text-primary)] bg-[var(--color-background-input)] mt-2"
          disabled={isLoading || isFileProcessing}
        />
        <Button 
            onClick={handleGenerateForecast} 
            isLoading={isLoading && !currentForecast && !scenarioQuery} 
            disabled={isLoading || isFileProcessing || (!fileData && !historicalDataInput.trim())} 
            className="mt-4 w-full md:w-auto" 
            leftIcon={<BarChartBig size={18}/>}
        >
          Generate Forecast with AI
        </Button>
      </Card>

      {isLoading && !currentForecast && !error && !aiInterpretation && <div className="text-center py-8"><Spinner /><p className="mt-2 text-[var(--color-text-secondary)]">AI is generating your forecast...</p></div>}
      
      {error && <Card className="border-red-500 bg-red-50/50 backdrop-blur-sm"><p className="text-red-700 font-medium text-sm flex items-center p-2"><AlertTriangle size={20} className="inline mr-2 flex-shrink-0"/> {error}</p></Card>}
      
      {aiInterpretation && !error && ( 
          <Card className="bg-[var(--color-button-outline-hover-bg)] border-[var(--color-text-accent)] backdrop-blur-sm" title={isScenarioInterpretation ? "Scenario Impact Summary" : "AI Action Summary"} icon={<MessageSquarePlus className="w-6 h-6"/>}>
            <div className="text-[var(--color-text-accent)]">
                {isScenarioInterpretation && scenarioQuery && <p className="text-xs italic mb-1">Applied scenario: "{scenarioQuery}"</p>}
                <p className="text-sm mb-3">{aiInterpretation}</p>
                 {currentForecast && !overallForecastInsight && !isLoadingOverallInsight && (
                    <Button 
                        onClick={handleGetOverallForecastInsight} 
                        variant="primary" 
                        size="sm" 
                        leftIcon={<Sparkles size={16}/>}
                        disabled={isLoadingOverallInsight}
                    >
                        Get Overall AI Insight
                    </Button>
                )}
            </div>
          </Card>
        )}

      {isLoadingOverallInsight && (
         <Card title="Fetching Comprehensive AI Forecast Insight..." icon={<BrainCircuit className="w-6 h-6 animate-pulse text-[var(--color-text-accent)]" />}>
            <div className="flex items-center text-[var(--color-text-secondary)]">
                <Spinner size="sm" />
                <p className="ml-3">The AI is preparing a detailed analysis of the entire forecast...</p>
            </div>
        </Card>
      )}

      {overallInsightError && (
         <Card title="Overall Insight Error" icon={<AlertTriangle className="w-6 h-6 text-red-500" />}>
            <p className="text-red-600 dark:text-red-400 text-sm">{overallInsightError}</p>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                    setOverallForecastInsight(null);
                    setOverallInsightError(null);
                    setIsLoadingOverallInsight(false);
                }}
                className="mt-3"
                leftIcon={<XCircle size={16}/>}
            >
                Clear Error
            </Button>
        </Card>
      )}

      {overallForecastInsight && !isLoadingOverallInsight && !overallInsightError && (
         <Card title="Comprehensive AI Forecast Insight" icon={<BrainCircuit className="w-6 h-6 text-[var(--color-text-accent)]" />}>
            <p className="text-[var(--color-text-secondary)] text-sm whitespace-pre-wrap">{overallForecastInsight}</p>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                    setOverallForecastInsight(null);
                    setOverallInsightError(null);
                    setIsLoadingOverallInsight(false);
                }}
                className="mt-4"
                leftIcon={<XCircle size={16}/>}
            >
                Close Overall Insight
            </Button>
        </Card>
      )}


      {currentForecast && !error && ( 
        <>
          <Card title="Step 2: Analyze Scenarios (Optional)" icon={<Zap className="w-6 h-6" />}>
             <div className="flex flex-col md:flex-row gap-4 mb-2 items-end">
                <Input
                    id="forecast-query"
                    label="Describe a scenario to adjust the forecast (e.g., 'What if sales increase by 15% next quarter?', 'Impact of reducing marketing spend by 2k/month')"
                    type="text"
                    value={scenarioQuery}
                    onChange={(e) => setScenarioQuery(e.target.value)}
                    placeholder="e.g., What if interest rates increase 2%?"
                    className="flex-grow"
                    disabled={isLoading}
                />
                <Button onClick={handleScenarioAnalysis} isLoading={isLoading && !!scenarioQuery} disabled={isLoading || !scenarioQuery.trim()} className="w-full md:w-auto" leftIcon={<Zap size={18}/>}>
                    Analyze Scenario
                </Button>
            </div>
          </Card>

          <Card title="12-Month Cash Flow Projection" icon={<TrendingUp className="w-6 h-6" />}>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3 -mt-2">Click on chart data points or table rows for AI insights on specific months.</p>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button variant='secondary' size='sm' onClick={() => setDisplayChartType(displayChartType === 'line' ? 'bar' : 'line')}>
                    Switch to {displayChartType === 'line' ? 'Bar' : 'Line'} Chart
                </Button>
                <div className="flex flex-wrap gap-2">
                    <Button variant='primary' size='sm' onClick={handleDownloadForecastCSV} leftIcon={<Table size={16}/>} disabled={isDownloadingDashboard}>
                        Download CSV
                    </Button>
                    <Button variant='primary' size='sm' onClick={handleDownloadFullAnalysis} leftIcon={<FileCode2 size={16}/>} disabled={isDownloadingDashboard}>
                        Full Analysis (MD)
                    </Button>
                    <Button 
                        variant='primary' 
                        size='sm' 
                        onClick={handleDownloadDashboardImage} 
                        leftIcon={<Camera size={16}/>}
                        isLoading={isDownloadingDashboard}
                        disabled={isDownloadingDashboard}
                    >
                        Download View (PNG)
                    </Button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              {displayChartType === 'line' ? (
                <LineChart data={currentForecast.monthly_cash_flow} onClick={(chartData) => {
                    if (chartData && chartData.activePayload && chartData.activePayload.length > 0) {
                        const payload = chartData.activePayload[0].payload;
                        if (payload.month) handleGetInsightForMonth(payload.month);
                    }
                }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} stroke={chartColors.grid}/>
                  <XAxis dataKey="month" stroke={chartColors.text} />
                  <YAxis stroke={chartColors.text} tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(value: number) => formatNumber(value)}
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '0.5rem', boxShadow: 'var(--color-shadow-card)' }}
                    labelStyle={{ color: chartColors.tooltipLabel, fontWeight: 'bold' }}
                    itemStyle={{ color: chartColors.tooltipItem }}
                  />
                  <Legend wrapperStyle={{color: chartColors.text}}/>
                  <Line type="monotone" dataKey="prediction" stroke={chartColors.linePrimary} strokeWidth={2} name="Predicted Cash Flow" 
                        activeDot={{ 
                            r: 8, 
                            style: { cursor: 'pointer', strokeWidth: 2, fill: chartColors.linePrimary}, 
                            onClick: (dotProps: ActiveDotClickData) => { 
                                if (dotProps.payload && dotProps.payload.month) {
                                    handleGetInsightForMonth(dotProps.payload.month);
                                }
                            } 
                        }} 
                        dot={{ r: 4, fill: chartColors.linePrimary, style: { cursor: 'pointer'} }}
                  />
                  <Line type="monotone" dataKey="confidence_interval[0]" stroke={chartColors.lineSecondary1} strokeDasharray="5 5" name="Lower Confidence" strokeOpacity={0.7} dot={false} activeDot={false} />
                  <Line type="monotone" dataKey="confidence_interval[1]" stroke={chartColors.lineSecondary2} strokeDasharray="5 5" name="Upper Confidence" strokeOpacity={0.7} dot={false} activeDot={false} />
                </LineChart>
              ) : (
                <BarChart data={currentForecast.monthly_cash_flow}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} stroke={chartColors.grid} />
                    <XAxis dataKey="month" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} tickFormatter={formatNumber} />
                    <Tooltip
                        formatter={(value: number) => formatNumber(value)}
                        contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '0.5rem', boxShadow: 'var(--color-shadow-card)' }}
                        labelStyle={{ color: chartColors.tooltipLabel, fontWeight: 'bold' }}
                         itemStyle={{ color: chartColors.tooltipItem }}
                    />
                    <Legend wrapperStyle={{color: chartColors.text}}/>
                    <Bar dataKey="prediction" fill={chartColors.barFill} name="Predicted Cash Flow" style={{ cursor: 'pointer' }} onClick={(data, index) => { if(data.month) handleGetInsightForMonth(data.month)}} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Card>

          {selectedMonthForInsight && (
            <Card 
                title={isLoadingInsight ? `Fetching AI Insight for ${selectedMonthForInsight}...` : `💡 AI Insight for ${selectedMonthForInsight}`} 
                icon={<Lightbulb className={`w-6 h-6 ${isLoadingInsight ? 'animate-pulse' : ''} ${!isLoadingInsight ? 'text-[var(--color-text-accent)]' : '' }`} />}
                className="mt-6 border-l-4 border-[var(--color-text-accent)] bg-[var(--color-background-secondary)]"
            >
                {isLoadingInsight && <div className="flex items-center text-[var(--color-text-secondary)]"><Spinner size="sm" /><p className="ml-3">The AI is analyzing this month...</p></div>}
                {insightError && <p className="text-red-600 dark:text-red-400 text-sm flex items-center"><AlertTriangle size={18} className="mr-2"/>{insightError}</p>}
                {monthSpecificInsight && !isLoadingInsight && !insightError && (
                    <p className="text-[var(--color-text-secondary)] text-sm whitespace-pre-wrap">{monthSpecificInsight}</p>
                )}
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        setSelectedMonthForInsight(null);
                        setMonthSpecificInsight(null);
                        setInsightError(null);
                    }}
                    className="mt-4"
                    leftIcon={<XCircle size={16}/>}
                    disabled={isLoadingInsight}
                >
                    Close Insight
                </Button>
            </Card>
          )}


          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Key Drivers (AI Identified)" icon={<Rocket className="w-5 h-5 text-green-500" />}>
              <ul className="space-y-2">
                {currentForecast.key_drivers.map((driver, index) => (
                  <li key={index} className="text-[var(--color-text-secondary)] flex items-start text-sm">
                    <span className="mr-2 text-lg">📈</span> {driver}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Potential Risk Factors (AI Identified)" icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}>
              <ul className="space-y-2">
                {currentForecast.risk_factors.map((factor, index) => (
                  <li key={index} className="text-[var(--color-text-secondary)] flex items-start text-sm">
                     <span className="mr-2 text-lg">⚠️</span> {factor}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          
          <Card title="Monthly Breakdown" icon={<BookOpen className="w-6 h-6" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-[var(--color-text-secondary)]">
                <thead className="text-xs text-[var(--color-text-secondary)] uppercase bg-[var(--color-background-secondary)]">
                  <tr>
                    <th scope="col" className="px-6 py-3">Month</th>
                    <th scope="col" className="px-6 py-3 text-right">Prediction</th>
                    <th scope="col" className="px-6 py-3 text-right">Confidence Low</th>
                    <th scope="col" className="px-6 py-3 text-right">Confidence High</th>
                    <th scope="col" className="px-6 py-3 text-center">Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {currentForecast.monthly_cash_flow.map((item: MonthlyCashFlow) => (
                    <tr key={item.month} className="bg-[var(--color-background-card-opaque)] border-b border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)]">
                      <td className="px-6 py-4 font-medium text-[var(--color-text-primary)] whitespace-nowrap">{item.month}</td>
                      <td className="px-6 py-4 text-right text-[var(--color-text-accent)] font-semibold">{formatNumber(item.prediction)}</td>
                      <td className="px-6 py-4 text-right">{formatNumber(item.confidence_interval[0])}</td>
                      <td className="px-6 py-4 text-right">{formatNumber(item.confidence_interval[1])}</td>
                      <td className="px-6 py-4 text-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="!p-1.5 !rounded-full" 
                            title={`Get AI insight for ${item.month}`}
                            onClick={() => handleGetInsightForMonth(item.month)}
                            disabled={isLoadingInsight && selectedMonthForInsight === item.month}
                        >
                            {isLoadingInsight && selectedMonthForInsight === item.month 
                                ? <Spinner size="sm"/> 
                                : <Lightbulb size={16} className="text-[var(--color-text-accent)] hover:opacity-80"/>
                            }
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ForecastPage;