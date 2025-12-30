import React, { useEffect } from 'react';
import { CheckCircleIcon, AlertCircleIcon, XIcon } from './Icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : 'bg-blue-50';
  const borderColor = type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-blue-200';
  const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
  const Icon = type === 'success' ? CheckCircleIcon : AlertCircleIcon;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] flex items-center p-4 mb-4 rounded-lg shadow-lg border ${bgColor} ${borderColor} ${textColor} animate-fade-in-down`}>
      <Icon className="w-5 h-5 flex-shrink-0 mr-3" />
      <div className="text-sm font-medium">{message}</div>
      <button 
        onClick={onClose} 
        className="ml-4 -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-white/50 focus:ring-2 focus:ring-gray-300"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;