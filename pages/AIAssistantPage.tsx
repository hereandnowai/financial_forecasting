

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
// Spinner component is not used here directly, but Button has its own
import { GEMINI_API_KEY } from '../constants';
import { GeminiModel } from '../types';
import { MessageSquareHeart, User, Bot, Send, Mic, MicOff, AlertCircle } from 'lucide-react';

// Type definitions for Web Speech API
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported";

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  grammars: any; // SpeechGrammarList; (simplified for this context)
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  abort(): void;
  start(): void;
  stop(): void;

  addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface SpeechRecognitionEventMap {
  "audiostart": Event;
  "audioend": Event;
  "end": Event;
  "error": SpeechRecognitionErrorEvent;
  "nomatch": SpeechRecognitionEvent;
  "result": SpeechRecognitionEvent;
  "soundstart": Event;
  "soundend": Event;
  "speechstart": Event;
  "speechend": Event;
  "start": Event;
}


interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const AIAssistantPage: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
  const [chat, setChat] = useState<Chat | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false; 
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0].item(0).transcript; 
        setUserInput(transcript); 
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errMsg = 'Speech recognition error.';
        if (event.error === 'no-speech') errMsg = 'No speech was detected. Please try again.';
        else if (event.error === 'audio-capture') errMsg = 'Microphone problem. Ensure it is connected and enabled.';
        else if (event.error === 'not-allowed') errMsg = 'Microphone access denied. Please allow microphone permission in your browser settings.';
        else if (event.error === 'network') errMsg = 'Network error during speech recognition.';
        setMicError(errMsg);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setMicError("Speech recognition is not supported in your browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  useEffect(() => {
    if (ai && !chat) {
        const systemPrompt = `You are a helpful AI assistant for the 'IntelliForecast AI' application. 'IntelliForecast AI' is a conceptual financial forecasting tool.
Users can input historical financial data (text, various file types including images and PDFs for data extraction), and the AI generates a 12-month cash flow forecast.
Users can also use natural language to define scenarios that adjust this AI-generated forecast (e.g., 'what if sales increase 10%').
Generated forecasts can be downloaded as CSV files or as a more comprehensive Markdown (.md) file detailing the full analysis (including interpretations, key drivers, risks, etc.) from the Forecast Dashboard.
The app features:
1.  Forecast Dashboard: For data input (text or file upload), AI forecast generation, scenario analysis, and downloading forecasts (CSV and full analysis Markdown). It also allows users to get AI insights on specific months of the forecast or an overall insight for the entire 12-month period.
2.  Analysis History: To view past analyses. Generated forecasts are automatically saved locally in the user's browser and can be viewed or deleted from this page. A historical analysis can also be loaded back to the Forecast Dashboard for review.
3.  AI Assistant (this chat): To answer user questions about the app.
If asked about microphone functionality, confirm it's available for text input via speech in this chat window.
Answer user questions about the app's purpose, its features, and how to use the demonstrated functionalities. Be concise, informative, and friendly.`;
        
        const newChat = ai.chats.create({
            model: GeminiModel.TEXT_GENERATION,
            config: { systemInstruction: systemPrompt },
            history: [] 
        });
        setChat(newChat);
        setMessages([{ id: 'init-ai-msg', text: "Hello! 👋 I'm the IntelliForecast AI assistant. How can I help you today? You can type or use the microphone to ask questions.", sender: 'ai' }]);
    }
  }, [ai, chat]);


  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim()) return;
    if (!ai) {
      setError("Gemini API key not configured. AI Assistant is unavailable.");
      return;
    }
    if (!chat) {
      setError("AI Chat not initialized. Please wait a moment or refresh.");
      return;
    }

    const newUserMessage: Message = { id: Date.now().toString(), text: userInput, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);
    setError(null);
    setMicError(null);

    try {
      const response: GenerateContentResponse = await chat.sendMessage({message: currentInput });
      const aiResponseText = response.text;
      const newAiMessage: Message = { id: (Date.now() + 1).toString(), text: aiResponseText, sender: 'ai' };
      setMessages(prev => [...prev, newAiMessage]);

    } catch (e: any) {
      console.error("Error with AI Assistant:", e);
      setError(`AI Assistant Error: ${e.message}`);
      const errorAiMessage: Message = { id: (Date.now() + 1).toString(), text: "Sorry, I encountered an error. Please try again.", sender: 'ai' };
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, ai, chat]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      setMicError("Speech recognition is not available or not initialized.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserInput(''); 
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        setMicError(`Could not start microphone: ${e.message}. Please check permissions.`);
        setIsListening(false);
      }
    }
  };

  return (
    <Card title="AI Assistant" icon={<MessageSquareHeart className="w-6 h-6" />}>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Ask me anything about the IntelliForecast AI application. Use the text input below or click the microphone icon to speak.
      </p>
      
      <div className="h-[500px] flex flex-col bg-[var(--color-background-secondary)] p-4 rounded-lg shadow-inner">
        <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-500">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-[var(--color-text-accent)] text-[var(--color-text-on-accent)] rounded-br-none' 
                  : 'bg-[var(--color-background-card-opaque)] text-[var(--color-text-primary)] rounded-bl-none'
              }`}>
                <div className="flex items-center mb-1">
                  {msg.sender === 'user' ? <User size={14} className="mr-1.5 opacity-90" /> : <Bot size={14} className="mr-1.5 opacity-90" />}
                  <span className="text-xs font-medium opacity-90">{msg.sender === 'user' ? 'You' : 'IntelliForecast AI'}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {error && <p className="text-red-500 text-xs mb-2 text-center animate-pulse">{error}</p>}
        {micError && (
            <p className="text-amber-600 dark:text-amber-500 text-xs mb-2 text-center flex items-center justify-center">
                <AlertCircle size={14} className="mr-1.5"/> {micError}
            </p>
        )}
        {isListening && <p className="text-[var(--color-text-accent)] text-xs mb-2 text-center animate-pulse">Listening...</p>}


        <div className="flex items-center gap-2 border-t border-[var(--color-border-primary)] pt-4">
          <Input
            id="ai-assistant-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isListening && handleSendMessage()}
            placeholder={isListening ? "Listening..." : "Type or use mic..."}
            className="flex-grow"
            disabled={isLoading || isListening || !chat}
          />
          <Button 
            variant="secondary" 
            size="md" 
            onClick={handleMicClick} 
            title={isListening ? "Stop listening" : "Use Microphone"}
            disabled={!recognitionRef.current || isLoading} 
          >
            {isListening ? <MicOff size={20} className="text-red-500"/> : <Mic size={20} />}
          </Button>
          <Button 
            onClick={handleSendMessage} 
            isLoading={isLoading && !isListening} 
            disabled={isLoading || isListening || !userInput.trim() || !chat} 
            leftIcon={<Send size={18}/>}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AIAssistantPage;
