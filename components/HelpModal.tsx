import React from 'react';
import { XIcon, HelpCircleIcon } from './Icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-scale-up">
        <div className="bg-purple-50 p-4 flex items-center justify-between border-b border-purple-100">
          <div className="flex items-center gap-2 text-purple-700">
            <HelpCircleIcon className="w-5 h-5" />
            <h3 className="font-semibold">Ajuda: {title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-purple-100 rounded-full text-purple-600 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-slate-600 text-sm leading-relaxed">
          {content}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
            >
                Entendi
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;