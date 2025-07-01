
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { History as HistoryIcon, BarChartBig, Trash2, Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { HistoricalAnalysis } from '../types'; 
import { LOCAL_STORAGE_HISTORY_KEY } from '../constants';

const HistoryPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<HistoricalAnalysis[]>([]);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [analysisIdToConfirmDelete, setAnalysisIdToConfirmDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setAnalyses(JSON.parse(storedHistory));
      } else {
        setAnalyses([]);
      }
    } catch (e) {
      console.error("Error loading history from localStorage:", e);
      setAnalyses([]); 
    }
  };

  const executeDeleteAnalysis = (id: string) => {
    try {
        const updatedAnalyses = analyses.filter(analysis => analysis.id !== id);
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedAnalyses));
        setAnalyses(updatedAnalyses);
        setAnalysisIdToConfirmDelete(null); // Reset confirmation
    } catch (e) {
        console.error("Error deleting analysis from localStorage:", e);
        // Optionally show an error to the user
    }
  };

  const handleClearAllHistory = () => {
    if (confirmClearAll) { // Second click: "Confirm Clear All?" was clicked
        try {
            localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
            setAnalyses([]);
            setConfirmClearAll(false); // Reset button state
        } catch (e) {
            console.error("Error clearing all history from localStorage:", e);
            // Optionally show an error to the user
        }
    } else { // First click: "Clear All History" was clicked
        setConfirmClearAll(true); // Change button to "Confirm Clear All?"
        setAnalysisIdToConfirmDelete(null); // Cancel any individual delete confirmations
    }
  };
  
  const handleViewOnDashboard = (analysis: HistoricalAnalysis) => {
    navigate('/forecast', { state: { historicalAnalysis: analysis } });
  };

  const getSummary = (analysis: HistoricalAnalysis): string => {
    if (analysis.aiInterpretation) {
        if (analysis.aiInterpretation.toLowerCase().startsWith("scenario:")) {
            return analysis.aiInterpretation.length > 150 
                ? analysis.aiInterpretation.substring(0, 147) + "..." 
                : analysis.aiInterpretation;
        }
        return analysis.aiInterpretation.length > 150 
            ? analysis.aiInterpretation.substring(0, 147) + "..." 
            : analysis.aiInterpretation;
    }
    if (analysis.forecastData.key_drivers && analysis.forecastData.key_drivers.length > 0) {
        return `Key drivers: ${analysis.forecastData.key_drivers.join(', ').substring(0,100)}...`;
    }
    return "No detailed summary available.";
  }

  return (
    <div className="space-y-8">
      <Card title="Analysis History" icon={<HistoryIcon className="w-6 h-6" />}>
        {analyses.length === 0 ? (
          <div className="text-center py-10">
            <HistoryIcon className="w-16 h-16 text-[var(--color-text-secondary)] opacity-50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No Analysis History Yet</h3>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
              Generate a forecast on the 'Forecast Dashboard' and it will be saved here automatically. 
              Your analysis history is stored locally in your browser.
            </p>
            <Button onClick={() => navigate('/forecast')} variant="primary" leftIcon={<BarChartBig size={18}/>}>
              Go to Forecast Dashboard
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
                <p className="text-[var(--color-text-secondary)]">
                Review previously generated forecasts. History is stored locally in your browser.
                </p>
                <Button 
                    variant={confirmClearAll ? "danger" : "outline"} 
                    size="sm" 
                    onClick={handleClearAllHistory}
                    leftIcon={confirmClearAll ? <CheckCircle size={16}/> : <Trash2 size={16}/>}
                    title={confirmClearAll ? "Click again to permanently delete all history" : "Clear all analysis history"}
                >
                    {confirmClearAll ? "Confirm Clear All?" : "Clear All History"}
                </Button>
            </div>
            {confirmClearAll && (
                <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                    <AlertTriangle size={20} className="mr-2"/>
                    Warning: Clicking "Confirm Clear All?" will permanently delete all your saved analyses. This action cannot be undone.
                </div>
            )}
            <div className="space-y-6">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="bg-[var(--color-background-card-opaque)] border border-[var(--color-border-secondary)] hover:shadow-lg transition-shadow duration-200">
                  <div className="flex flex-col md:flex-row justify-between md:items-start">
                    <div className="flex-grow mb-4 md:mb-0 md:mr-4">
                      <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                        <span role="img" aria-label="Analysis document" className="mr-1.5">📜</span>
                        {analysis.title}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-2">Generated on: {new Date(analysis.date).toLocaleString()}</p>
                      <p className="text-sm text-[var(--color-text-secondary)] max-w-xl">{getSummary(analysis)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 flex-shrink-0">
                       <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleViewOnDashboard(analysis)}
                          leftIcon={<Eye size={16}/>}
                          className="w-full sm:w-auto md:w-full"
                          disabled={analysisIdToConfirmDelete === analysis.id || confirmClearAll}
                        >
                          View on Dashboard
                        </Button>
                        {analysisIdToConfirmDelete === analysis.id ? (
                            <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto md:w-full">
                                <Button 
                                    variant="danger" 
                                    size="sm" 
                                    onClick={() => executeDeleteAnalysis(analysis.id)}
                                    leftIcon={<CheckCircle size={16}/>}
                                    className="w-full"
                                >
                                    Confirm Delete?
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => setAnalysisIdToConfirmDelete(null)}
                                    leftIcon={<XCircle size={16}/>}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setAnalysisIdToConfirmDelete(analysis.id);
                                  setConfirmClearAll(false); // Cancel clear all confirmation if individual delete is initiated
                                }}
                                leftIcon={<Trash2 size={16}/>}
                                className="w-full sm:w-auto md:w-full"
                                disabled={confirmClearAll}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
