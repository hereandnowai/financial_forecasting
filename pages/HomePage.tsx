
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { APP_NAME, COMPANY_NAME } from '../constants';
import { TrendingUp, MessagesSquare, GitCompareArrows, Archive, BrainCircuit, Users, BookOpen } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    { name: "AI-Powered Forecasting", description: "Leverage advanced AI to generate 12-month cash flow predictions.", icon: <TrendingUp className="w-8 h-8 text-[var(--color-text-accent)]" />, emoji: "✨" },
    { name: "Natural Language Queries", description: "Interact with your financial data using simple, everyday language.", icon: <MessagesSquare className="w-8 h-8 text-sky-500" />, emoji: "🗣️" },
    { name: "Scenario Analysis", description: "Explore 'what-if' scenarios to understand potential impacts on your cash flow.", icon: <GitCompareArrows className="w-8 h-8 text-amber-500" />, emoji: "🤔" },
    { name: "Historical Insights", description: "Review past analyses and track forecasting performance over time.", icon: <Archive className="w-8 h-8 text-indigo-500" />, emoji: "💾" }
  ];

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-b from-[var(--color-background-primary)] via-transparent to-transparent rounded-xl">
        <div className="flex justify-center mb-6">
            <BrainCircuit className="w-24 h-24 text-[var(--color-text-accent)]" />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-[var(--color-text-primary)]">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-text-logo-gradient-from)] via-[var(--color-text-logo-gradient-via)] to-[var(--color-text-logo-gradient-to)]">{APP_NAME}</span>
        </h1>
        <p className="text-xl text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto">
          Your intelligent partner for financial forecasting and cash flow optimization. 
          Built by {COMPANY_NAME}.
        </p>
        <div className="space-x-4">
          <Button size="lg" variant="primary" as={Link} to="/forecast">
            Get Started
          </Button>
          <Button size="lg" variant="secondary" as={Link} to="/assistant">
            Ask AI Assistant
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-10 text-[var(--color-text-primary)]">
            <span role="img" aria-label="Tools" className="mr-2">🛠️</span> Core Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Card key={feature.name} className="hover:shadow-blue-500/20 transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-[var(--color-background-secondary)] rounded-full mb-4 inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                  {feature.emoji && <span role="img" aria-label="" className="mr-1.5">{feature.emoji}</span>}
                  {feature.name}
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
         <Card title="ℹ️ About This Application" icon={<BookOpen className="w-6 h-6" />}>
          <p className="text-[var(--color-text-secondary)] mb-4">
            {APP_NAME} is a sophisticated financial forecasting application designed to provide businesses with AI-generated 12-month cash flow predictions. 
            By analyzing user-provided data and market context, our AI aims to deliver insightful forecasts.
          </p>
          <p className="text-[var(--color-text-secondary)] mb-4">
            This application demonstrates how Generative AI can be used for financial forecasting tasks. Users can input their historical data, and the AI will generate a forecast. 
            It also includes natural language query processing for scenario analysis and an AI assistant.
          </p>
          <p className="text-[var(--color-text-secondary)]">
            Explore the <Link to="/forecast" className="text-[var(--color-text-accent)] hover:underline">Forecast Dashboard</Link> to input data and generate predictions, or chat with our <Link to="/assistant" className="text-[var(--color-text-accent)] hover:underline">AI Assistant</Link> to learn more.
          </p>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
