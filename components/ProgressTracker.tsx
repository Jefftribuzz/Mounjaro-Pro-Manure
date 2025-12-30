import React, { useState, useEffect, useRef } from 'react';
import { ProgressEntry } from '../types';
import { TrendingUpIcon, ScaleIcon, CameraIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgressTracker: React.FC = () => {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Photo states
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reload from local storage when component mounts
    // This ensures that if the parent resets and clears LS, this component sees empty state on remount
    const saved = localStorage.getItem('mounjaro_progress');
    if (saved) {
        try {
            setEntries(JSON.parse(saved));
        } catch (e) {
            console.error("Error parsing saved progress", e);
            setEntries([]);
        }
    } else {
        setEntries([]);
    }
  }, []);

  // Compress image using Canvas to avoid LocalStorage quota limits
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'side') => {
    const file = e.target.files?.[0];
    if (file) {
        setIsCompressing(true);
        try {
            const compressedBase64 = await compressImage(file);
            if (type === 'front') setFrontPhoto(compressedBase64);
            if (type === 'back') setBackPhoto(compressedBase64);
            if (type === 'side') setSidePhoto(compressedBase64);
        } catch (error) {
            console.error("Error compressing image", error);
            alert("Erro ao processar imagem. Tente outra foto.");
        } finally {
            setIsCompressing(false);
        }
    }
  };

  const saveEntry = () => {
    if (!weight) return;
    
    const newEntry: ProgressEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        weight: parseFloat(weight),
        photos: {
            front: frontPhoto || undefined,
            back: backPhoto || undefined,
            side: sidePhoto || undefined
        }
    };
    
    try {
        const updated = [...entries, newEntry];
        const serialized = JSON.stringify(updated);
        
        // Simple check to warn user about potential storage limits, though compression helps a lot
        if (serialized.length > 4500000) { // ~4.5MB safe limit
             alert("Atenção: O armazenamento local está quase cheio. Considere excluir registros antigos.");
        }

        localStorage.setItem('mounjaro_progress', serialized);
        setEntries(updated);
        
        // Reset form
        setWeight('');
        setFrontPhoto(null);
        setBackPhoto(null);
        setSidePhoto(null);
    } catch (e) {
        console.error("Storage error", e);
        alert("Erro crítico: Espaço de armazenamento cheio. Não foi possível salvar este registro.");
    }
  };

  const renderPhotoInput = (label: string, photo: string | null, inputRef: React.RefObject<HTMLInputElement>, type: 'front' | 'back' | 'side') => (
    <div className="flex flex-col items-center gap-2">
        <div 
            onClick={() => inputRef.current?.click()}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative transition-colors
                ${photo ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}
                ${isCompressing ? 'opacity-50 cursor-wait' : ''}`}
        >
            {photo ? (
                <img src={photo} alt={label} className="w-full h-full object-cover" />
            ) : (
                <CameraIcon className="w-6 h-6 text-slate-400" />
            )}
        </div>
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <input 
            type="file" 
            ref={inputRef}
            className="hidden" 
            accept="image/*"
            onChange={(e) => handlePhotoChange(e, type)}
        />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 md:p-8 pb-32 animate-fade-in">
        <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-3">
                 <TrendingUpIcon className="w-6 h-6" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800">Seu Progresso</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <h3 className="font-semibold text-slate-700 mb-4">Novo Registro</h3>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-600 mb-2">Peso Atual</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ScaleIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="kg"
                        className="block w-full pl-10 rounded-lg border-slate-200 bg-slate-50 focus:border-purple-500 focus:ring-purple-500 text-base p-3"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-600 mb-3">Fotos de Evolução (Opcional)</label>
                <div className="flex justify-between md:justify-start md:gap-8">
                    {renderPhotoInput("Frente", frontPhoto, frontInputRef, 'front')}
                    {renderPhotoInput("Costas", backPhoto, backInputRef, 'back')}
                    {renderPhotoInput("Lado", sidePhoto, sideInputRef, 'side')}
                </div>
                {isCompressing && <p className="text-xs text-purple-600 mt-2 animate-pulse">Comprimindo imagem...</p>}
            </div>

            <button
                onClick={saveEntry}
                disabled={!weight || isCompressing}
                className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Salvar Registro
            </button>
        </div>

        {entries.length > 1 ? (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 h-64">
                <h3 className="font-semibold text-slate-700 mb-4">Evolução de Peso</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={entries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#7c3aed" 
                            strokeWidth={3}
                            dot={{ fill: '#7c3aed', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
             </div>
        ) : (
             <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300 mb-6">
                 <p className="text-slate-400">Adicione pelo menos 2 registros para ver o gráfico.</p>
             </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="font-semibold text-slate-700">Histórico</h3>
             </div>
             <div className="divide-y divide-slate-100">
                 {entries.length === 0 && (
                     <p className="p-6 text-center text-sm text-slate-400">Nenhum registro ainda.</p>
                 )}
                 {entries.slice().reverse().map((entry) => (
                     <div key={entry.id} className="p-4">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-slate-500 text-sm">{entry.date}</span>
                             <span className="font-bold text-slate-800">{entry.weight} kg</span>
                         </div>
                         {entry.photos && (entry.photos.front || entry.photos.back || entry.photos.side) && (
                             <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                 {entry.photos.front && (
                                     <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                                         <img src={entry.photos.front} alt="Frente" className="w-full h-full object-cover" />
                                     </div>
                                 )}
                                 {entry.photos.back && (
                                     <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                                         <img src={entry.photos.back} alt="Costas" className="w-full h-full object-cover" />
                                     </div>
                                 )}
                                 {entry.photos.side && (
                                     <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                                         <img src={entry.photos.side} alt="Lado" className="w-full h-full object-cover" />
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                 ))}
             </div>
        </div>
    </div>
  );
};

export default ProgressTracker;