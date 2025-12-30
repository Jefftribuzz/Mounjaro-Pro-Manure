import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, Goal, GeneratedPlan } from './types';
import { ScaleIcon, RulerIcon, ActivityIcon, SyringeIcon, CheckCircleIcon, ChevronRightIcon, ChevronLeftIcon, HomeIcon, DocumentIcon, ShieldCheckIcon, AppLogo, SparklesIcon, TrendingUpIcon, RefreshCwIcon, HelpCircleIcon, AlertCircleIcon } from './components/Icons';
import PlanResult from './components/PlanResult';
import AIChat from './components/AIChat';
import ProgressTracker from './components/ProgressTracker';
import Toast from './components/Toast';
import HelpModal from './components/HelpModal';
import { generateDietPlan } from './services/geminiService';

const INITIAL_STATE: UserProfile = {
  name: '',
  age: 30,
  gender: Gender.Female,
  height: 165,
  currentWeight: 80,
  goalWeight: 65,
  activityLevel: ActivityLevel.Light,
  goal: Goal.WeightLoss,
  dietaryRestrictions: '',
  waterIntake: '2L',
};

enum Step {
  Personal = 1,
  Body,
  Lifestyle,
  Terms,
  Processing,
  Result,
  Chat,
  Progress
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Personal);
  const [formData, setFormData] = useState<UserProfile>(INITIAL_STATE);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [navTab, setNavTab] = useState<'home' | 'plan' | 'chat' | 'progress'>('home');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  // Reset Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingResetFull, setPendingResetFull] = useState(true);
  
  // Key to force component remount on reset
  const [resetKey, setResetKey] = useState(0);

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!termsAccepted) {
        showToast("Você precisa aceitar os termos para continuar.", "error");
        return;
    }
    setCurrentStep(Step.Processing);
    setNavTab('home');
    setError(null);
    try {
      const generatedPlan = await generateDietPlan(formData);
      setPlan(generatedPlan);
      setCurrentStep(Step.Result);
      setNavTab('plan');
      showToast("Plano gerado com sucesso!", "success");
    } catch (err) {
      setError("Ocorreu um erro ao gerar seu plano. Verifique se a chave de API está configurada corretamente e tente novamente.");
      showToast("Erro ao conectar com a IA.", "error");
      setCurrentStep(Step.Terms); // Go back to last step
    }
  };

  // Trigger the modal instead of window.confirm
  const handleResetClick = (fullReset: boolean = true) => {
    setPendingResetFull(fullReset);
    setShowResetConfirm(true);
  };

  // Execute logic after modal confirmation
  const executeReset = () => {
    setFormData({ ...INITIAL_STATE });
    setPlan(null);
    setTermsAccepted(false);
    setCurrentStep(Step.Personal);
    setNavTab('home');
    setResetKey(prev => prev + 1); // Force remount of components
    setShowResetConfirm(false); // Close modal
    
    if (pendingResetFull) {
        // Clear progress history for a true fresh start
        localStorage.removeItem('mounjaro_progress');
        showToast("Protocolo e histórico resetados com sucesso.", "info");
    } else {
        showToast("Formulário limpo.", "info");
    }
    
    window.scrollTo(0, 0);
  };

  const getHelpContent = () => {
    switch (currentStep) {
        case Step.Personal:
            return (
                <div className="space-y-3">
                    <p>Preencha com seus dados básicos.</p>
                    <p><strong>Nome:</strong> Como você gostaria de ser chamado pelo app.</p>
                    <p><strong>Idade/Gênero:</strong> Importantes para o cálculo de metabolismo basal.</p>
                </div>
            );
        case Step.Body:
             return (
                <div className="space-y-3">
                    <p>Estes dados são essenciais para calcular suas necessidades calóricas.</p>
                    <p><strong>Altura:</strong> Use centímetros (ex: 165).</p>
                    <p><strong>Peso Meta:</strong> Um objetivo realista para o seu plano inicial.</p>
                </div>
            );
        case Step.Lifestyle:
             return (
                <div className="space-y-3">
                    <p>Ajuste o plano à sua rotina real.</p>
                    <p><strong>Nível de Atividade:</strong> Seja honesto para evitar dietas com excesso ou falta de energia.</p>
                    <p><strong>Restrições:</strong> Liste alergias (ex: amendoim) ou preferências (ex: vegetariano) para a IA adaptar o cardápio.</p>
                </div>
            );
        case Step.Terms:
            return (
                <div className="space-y-3">
                    <p>Este aplicativo usa Inteligência Artificial para gerar sugestões.</p>
                    <p>Ele não substitui um médico. Ao aceitar, você confirma que entende que estas são apenas sugestões de bem-estar.</p>
                </div>
            );
        default:
            return <p>Preencha os dados solicitados para que nossa IA possa criar o melhor plano para você.</p>;
    }
  };

  const renderContent = () => {
    // If a plan exists, we show the tabbed interface
    if (plan) {
        return (
            <div className="pt-20 pb-24" key={`plan-view-${resetKey}`}>
                {navTab === 'chat' && <AIChat plan={plan} />}
                {navTab === 'progress' && <ProgressTracker />}
                {(navTab === 'plan' || navTab === 'home') && <PlanResult plan={plan} />}
            </div>
        );
    }

    // Processing State
    if (currentStep === Step.Processing) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center pb-24">
          <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                  <SyringeIcon className="w-8 h-8 text-purple-600" />
              </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Analisando seu perfil...</h2>
          <p className="text-slate-500 max-w-md">Nossa IA está criando um plano nutricional personalizado com base nos seus dados metabólicos e objetivos.</p>
        </div>
      );
    }

    // Wizard Form
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans pb-32" key={`wizard-${resetKey}`}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-between items-center mb-8 px-2">
             <div className="w-8"></div> {/* Spacer for centering */}
             <AppLogo />
             {currentStep > Step.Personal ? (
                 <button 
                    onClick={() => handleResetClick(false)} 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Limpar formulário"
                 >
                    <RefreshCwIcon className="w-5 h-5" />
                 </button>
             ) : (
                <div className="w-8"></div>
             )}
          </div>

          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100 relative overflow-hidden">
            
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
              <div 
                  className="h-full bg-purple-600 transition-all duration-500 ease-in-out"
                  style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />
            </div>

            <form className="space-y-6 pt-4" onSubmit={(e) => e.preventDefault()}>
              
              {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                      <div className="flex-shrink-0"><ShieldCheckIcon className="w-4 h-4"/></div>
                      {error}
                  </div>
              )}

              {currentStep === Step.Personal && (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Sobre Você</h2>
                      </div>
                      <button onClick={() => setHelpModalOpen(true)} className="text-slate-400 hover:text-purple-600">
                        <HelpCircleIcon className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nome ou Apelido</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3 transition-colors"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Idade</label>
                          <input
                              type="number"
                              value={formData.age}
                              onChange={(e) => updateField('age', Number(e.target.value))}
                              className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Gênero</label>
                          <select
                              value={formData.gender}
                              onChange={(e) => updateField('gender', e.target.value)}
                              className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                          >
                              {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                      </div>
                  </div>
                </div>
              )}

              {currentStep === Step.Body && (
                <div className="space-y-5 animate-fade-in-up">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                              <ScaleIcon className="w-5 h-5" />
                          </div>
                          <h2 className="text-lg font-semibold text-slate-800">Medidas Corporais</h2>
                      </div>
                      <button onClick={() => setHelpModalOpen(true)} className="text-slate-400 hover:text-purple-600">
                        <HelpCircleIcon className="w-5 h-5" />
                      </button>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700">Altura (cm)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <RulerIcon className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                              type="number"
                              value={formData.height}
                              onChange={(e) => updateField('height', Number(e.target.value))}
                              className="block w-full pl-10 rounded-lg border-slate-200 bg-slate-50 focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                              placeholder="165"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Peso Atual (kg)</label>
                          <input
                              type="number"
                              value={formData.currentWeight}
                              onChange={(e) => updateField('currentWeight', Number(e.target.value))}
                              className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Peso Meta (kg)</label>
                          <input
                              type="number"
                              value={formData.goalWeight}
                              onChange={(e) => updateField('goalWeight', Number(e.target.value))}
                              className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                          />
                      </div>
                  </div>
                </div>
              )}

              {currentStep === Step.Lifestyle && (
                <div className="space-y-5 animate-fade-in-up">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                              <ActivityIcon className="w-5 h-5" />
                          </div>
                          <h2 className="text-lg font-semibold text-slate-800">Estilo de Vida</h2>
                      </div>
                      <button onClick={() => setHelpModalOpen(true)} className="text-slate-400 hover:text-purple-600">
                        <HelpCircleIcon className="w-5 h-5" />
                      </button>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700">Nível de Atividade</label>
                      <select
                          value={formData.activityLevel}
                          onChange={(e) => updateField('activityLevel', e.target.value)}
                          className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                      >
                          {Object.values(ActivityLevel).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700">Objetivo Principal</label>
                      <select
                          value={formData.goal}
                          onChange={(e) => updateField('goal', e.target.value)}
                          className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                      >
                           {Object.values(Goal).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700">Restrições Alimentares (Opcional)</label>
                      <textarea
                          value={formData.dietaryRestrictions}
                          onChange={(e) => updateField('dietaryRestrictions', e.target.value)}
                          rows={2}
                          className="mt-1 block w-full rounded-lg border-slate-200 bg-slate-50 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-3"
                          placeholder="Ex: Sem glúten, vegetariano, alergia a amendoim..."
                      />
                  </div>
                </div>
              )}

              {currentStep === Step.Terms && (
                <div className="space-y-5 animate-fade-in-up">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                              <ShieldCheckIcon className="w-5 h-5" />
                          </div>
                          <h2 className="text-lg font-semibold text-slate-800">Termo de Responsabilidade</h2>
                      </div>
                      <button onClick={() => setHelpModalOpen(true)} className="text-slate-400 hover:text-purple-600">
                        <HelpCircleIcon className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm text-yellow-800 space-y-3">
                      <p className="font-semibold">
                          Por favor, leia atentamente antes de prosseguir:
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                          <li>Você é responsável pela execução deste protocolo.</li>
                          <li>Os resultados podem ser consideravelmente positivos em pouco tempo.</li>
                          <li>Este protocolo gerado por IA <strong>não substitui</strong> o acompanhamento profissional de um médico nutrólogo ou nutricionista.</li>
                          <li>Qualquer alteração na sua dieta deve ser acompanhada por um profissional de saúde.</li>
                      </ul>
                  </div>

                  <div className="flex items-start gap-3 p-2">
                      <input
                          id="terms"
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="h-5 w-5 mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer select-none">
                          Li, compreendi e aceito que sou responsável pelo uso deste protocolo e que devo procurar orientação profissional.
                      </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                  {currentStep > Step.Personal && (
                      <button
                          type="button"
                          onClick={prevStep}
                          className="flex-1 py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors flex items-center justify-center gap-2"
                      >
                          <ChevronLeftIcon className="w-4 h-4" />
                          Voltar
                      </button>
                  )}
                  <button
                      type="button"
                      onClick={() => {
                          if (currentStep === Step.Terms) {
                              handleSubmit();
                          } else {
                              nextStep();
                          }
                      }}
                      className={`flex-1 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-colors flex items-center justify-center gap-2
                        ${(currentStep === Step.Terms && !termsAccepted) 
                            ? 'bg-slate-300 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                        }`}
                  >
                      {currentStep === Step.Terms ? 'Gerar Plano' : 'Próximo'}
                      {currentStep !== Step.Terms && <ChevronRightIcon className="w-4 h-4" />}
                  </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmação</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {pendingResetFull 
                ? "Tem certeza? Isso apagará seu plano ATUAL e todo o histórico de PROGRESSO permanentemente." 
                : "Tem certeza que deseja limpar todos os campos do formulário?"}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeReset}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                {pendingResetFull ? 'Sim, Resetar' : 'Limpar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpModal 
        isOpen={helpModalOpen} 
        onClose={() => setHelpModalOpen(false)} 
        title="Instruções de Uso"
        content={getHelpContent()}
      />

      {plan && (
        <div className="fixed top-0 left-0 right-0 bg-white z-40 border-b border-slate-200 px-4 py-2 shadow-sm">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <AppLogo className="h-10 w-auto" />
                <button
                    onClick={() => handleResetClick(true)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2 text-sm"
                >
                    <RefreshCwIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Resetar Protocolo</span>
                </button>
            </div>
        </div>
      )}

      {renderContent()}
      
      {/* Mobile Bottom Navigation - Only show if plan exists */}
      {plan && (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button 
            onClick={() => setNavTab('home')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              navTab === 'home'
                ? 'text-purple-600' 
                : 'text-slate-400 hover:text-purple-500'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Início</span>
          </button>
          
          <button 
            onClick={() => setNavTab('plan')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              navTab === 'plan' 
                ? 'text-purple-600' 
                : 'text-slate-400 hover:text-purple-500' 
            }`}
          >
            <DocumentIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Meu Plano</span>
          </button>

          <button 
            onClick={() => setNavTab('chat')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              navTab === 'chat' 
                ? 'text-purple-600' 
                : 'text-slate-400 hover:text-purple-500' 
            }`}
          >
            <SparklesIcon className="w-6 h-6" />
            <span className="text-xs font-medium">IA</span>
          </button>

          <button 
            onClick={() => setNavTab('progress')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              navTab === 'progress' 
                ? 'text-purple-600' 
                : 'text-slate-400 hover:text-purple-500'
            }`}
          >
            <TrendingUpIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Progresso</span>
          </button>
        </div>
      </div>
      )}
    </>
  );
}