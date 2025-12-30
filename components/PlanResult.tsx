import React, { useState } from 'react';
import { GeneratedPlan, DailyPlan } from '../types';
import { CheckCircleIcon, FoodIcon, ActivityIcon, DownloadIcon } from './Icons';
import { jsPDF } from 'jspdf';

interface PlanResultProps {
  plan: GeneratedPlan;
}

const PlanResult: React.FC<PlanResultProps> = ({ plan }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDay = plan.dailyPlans[activeDayIndex];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setTextColor(128, 0, 128); // Purple
    doc.setFontSize(22);
    doc.text("Plano Mounjaro Pro", margin, yPos);
    yPos += 10;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(plan.summary, contentWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += (summaryLines.length * 6) + 10;

    // Strategies
    doc.setTextColor(255, 102, 0); // Orange
    doc.setFontSize(14);
    doc.text("Estratégia Nutricional", margin, yPos);
    yPos += 7;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const nutriLines = doc.splitTextToSize(plan.nutritionalStrategy, contentWidth);
    doc.text(nutriLines, margin, yPos);
    yPos += (nutriLines.length * 5) + 10;

    doc.setTextColor(255, 102, 0); // Orange
    doc.setFontSize(14);
    doc.text("Gestão de Efeitos", margin, yPos);
    yPos += 7;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const sideEffectLines = doc.splitTextToSize(plan.sideEffectManagement, contentWidth);
    doc.text(sideEffectLines, margin, yPos);
    yPos += (sideEffectLines.length * 5) + 10;

    // Daily Plans
    plan.dailyPlans.forEach((day, index) => {
       if (yPos > 250) {
           doc.addPage();
           yPos = 20;
       }

       doc.setDrawColor(200, 200, 200);
       doc.line(margin, yPos, pageWidth - margin, yPos);
       yPos += 10;

       doc.setTextColor(128, 0, 128); // Purple
       doc.setFontSize(16);
       doc.text(day.day, margin, yPos);
       
       doc.setFontSize(12);
       doc.setTextColor(100, 100, 100);
       doc.text(day.theme, margin + 60, yPos);
       
       // Show Total Calories in PDF
       doc.setFontSize(10);
       doc.setTextColor(50, 50, 50);
       doc.text(`Total: ${day.totalCalories} kcal`, pageWidth - margin - 40, yPos);
       
       yPos += 10;

       doc.setFontSize(10);
       doc.setTextColor(0, 0, 0);
       
       const meals = [
           { label: "Café", data: day.breakfast },
           { label: "Almoço", data: day.lunch },
           { label: "Lanche", data: day.snack },
           { label: "Jantar", data: day.dinner }
       ];

       meals.forEach(meal => {
           doc.setFont(undefined, 'bold');
           doc.text(`${meal.label}:`, margin, yPos);
           doc.setFont(undefined, 'normal');
           doc.text(`${meal.data.name} (${meal.data.calories} kcal) - ${meal.data.protein}`, margin + 20, yPos);
           yPos += 6;
       });

       yPos += 5;
       doc.setTextColor(255, 102, 0); // Orange
       doc.text(`Hidratação: ${day.hydrationTip}`, margin, yPos);
       yPos += 6;
       doc.text(`Exercício: ${day.exerciseSuggestion}`, margin, yPos);
       yPos += 10;
    });

    doc.save("meu-plano-mounjaro.pdf");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in pb-32">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
          <CheckCircleIcon className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Seu Plano Mounjaro Pro</h2>
        <p className="text-slate-500 mt-2">Personalizado para maximizar seus resultados</p>
        
        <button 
            onClick={handleDownloadPDF}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
        >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Baixar PDF do Plano
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
            <ActivityIcon className="w-5 h-5 mr-2" />
            Estratégia Nutricional
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            {plan.nutritionalStrategy}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-orange-600 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Gestão de Efeitos
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            {plan.sideEffectManagement}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Days Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-100 p-2 gap-2 scrollbar-hide">
          {plan.dailyPlans.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDayIndex(idx)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${idx === activeDayIndex 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
            >
              {day.day}
            </button>
          ))}
        </div>

        {/* Day Content */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100">
             <div>
                <h3 className="text-2xl font-bold text-slate-800">{activeDay.day}</h3>
                <p className="text-purple-600 font-medium mt-1">{activeDay.theme}</p>
             </div>
             <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
                 <div className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                     🔥 {activeDay.totalCalories} kcal
                 </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    💧 {activeDay.hydrationTip.substring(0, 30)}...
                </span>
             </div>
          </div>

          <div className="space-y-6">
            {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((mealType) => {
              const mealKey = mealType.toLowerCase() as keyof Pick<DailyPlan, 'breakfast' | 'lunch' | 'snack' | 'dinner'>;
              const meal = activeDay[mealKey];
              const labels: {[key: string]: string} = { Breakfast: 'Café da Manhã', Lunch: 'Almoço', Snack: 'Lanche', Dinner: 'Jantar' };

              return (
                <div key={mealType} className="flex gap-4 group">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                        <FoodIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-baseline">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{labels[mealType]}</h4>
                        <span className="text-xs font-medium text-slate-400">{meal.calories} kcal</span>
                    </div>
                    <h5 className="text-lg font-semibold text-slate-800">{meal.name}</h5>
                    <p className="text-slate-600 text-sm mt-1">{meal.description}</p>
                    <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        Proteína: {meal.protein}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="bg-orange-50 rounded-xl p-4 flex gap-4 items-start">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <ActivityIcon className="w-5 h-5" />
                </div>
                <div>
                    <h5 className="font-semibold text-orange-900 text-sm">Movimento Sugerido</h5>
                    <p className="text-orange-800 text-sm mt-1">{activeDay.exerciseSuggestion}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanResult;