import React, { useState, useRef, useEffect } from 'react';
import { GeneratedPlan, ChatMessage } from '../types';
import { GoogleGenAI, Chat } from "@google/genai";
import { SendIcon, SparklesIcon } from './Icons';

interface AIChatProps {
  plan: GeneratedPlan | null;
}

const AIChat: React.FC<AIChatProps> = ({ plan }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou seu nutricionista virtual. Como posso te ajudar com seu plano alimentar e hábitos hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (plan && !chatSessionRef.current) {
        const apiKey = process.env.API_KEY;
        if (apiKey) {
            const ai = new GoogleGenAI({ apiKey });
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: {
                    systemInstruction: `
                        Você é um Nutricionista e Coach de Estilo de Vida especializado em emagrecimento saudável.
                        
                        REGRAS DE COMPORTAMENTO:
                        1. Aja de forma objetiva, sucinta e direta.
                        2. Se o usuário fizer uma pergunta específica, dê a resposta direta seguida de uma breve explicação.
                        3. NÃO mencione, recomende ou discuta o medicamento Tirzepatida, Mounjaro ou qualquer outro fármaco. 
                        4. USE FORMATAÇÃO: Use quebras de linha para separar parágrafos. Use marcadores (hifens ou asteriscos) para listas. Destaque palavras-chave com **negrito**.
                        
                        CONTEXTO DO USUÁRIO (PLANO GERADO):
                        ${plan.summary}
                        
                        ESTRATÉGIA:
                        ${plan.nutritionalStrategy}
                        
                        DICAS GERAIS:
                        ${plan.sideEffectManagement}
                        
                        Responda sempre em Português do Brasil.
                    `
                }
            });
        }
    }
  }, [plan]);

  const handleSend = async () => {
    if (!input.trim() || !plan || !chatSessionRef.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
        const result = await chatSessionRef.current.sendMessage({ message: userMsg });
        const responseText = result.text;
        
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
        console.error("Chat error", error);
        setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um problema ao processar sua resposta. Tente novamente." }]);
    } finally {
        setIsLoading(false);
    }
  };

  // Improved renderer for basic markdown-like syntax
  const renderMessageContent = (text: string) => {
    // Split by lines to handle paragraphs and lists
    const lines = text.split('\n');
    
    return lines.map((line, lineIdx) => {
        if (!line.trim()) return <br key={lineIdx} />;

        // Handle list items (starting with - or *)
        const isList = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isList ? line.trim().substring(2) : line;

        // Process Bold segments within the line
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const renderedParts = parts.map((part, partIdx) => {
             if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIdx} className="font-bold">{part.slice(2, -2)}</strong>;
             }
             return part;
        });

        if (isList) {
            return (
                <div key={lineIdx} className="flex gap-2 ml-2 mb-1">
                    <span className="text-purple-500">•</span>
                    <span>{renderedParts}</span>
                </div>
            );
        }

        return <div key={lineIdx} className="mb-1 min-h-[1.2em]">{renderedParts}</div>;
    });
  };

  if (!plan) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 text-slate-500 animate-fade-in">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
                <SparklesIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">IA Indisponível</h3>
            <p className="max-w-xs mt-2">Gere seu plano nutricional primeiro para habilitar o chat com o especialista.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50">
        <div className="bg-white p-4 border-b border-slate-100 shadow-sm flex items-center gap-3">
             <div className="bg-purple-100 p-2 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
             </div>
             <div>
                 <h3 className="font-semibold text-slate-800">Especialista IA</h3>
                 <p className="text-xs text-slate-500">Tire dúvidas sobre seu protocolo</p>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                    }`}>
                        {renderMessageContent(msg.text)}
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite sua dúvida..."
                    className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base"
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default AIChat;