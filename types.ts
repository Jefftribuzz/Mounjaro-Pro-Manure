export enum Gender {
  Male = 'Masculino',
  Female = 'Feminino',
  Other = 'Outro'
}

export enum ActivityLevel {
  Sedentary = 'Sedentário (pouco ou nenhum exercício)',
  Light = 'Levemente ativo (exercício leve 1-3 dias/semana)',
  Moderate = 'Moderadamente ativo (exercício moderado 3-5 dias/semana)',
  VeryActive = 'Muito ativo (exercício pesado 6-7 dias/semana)',
  ExtraActive = 'Extremamente ativo (trabalho físico ou treino muito pesado)'
}

export enum Goal {
  WeightLoss = 'Perda de Peso Acelerada',
  Maintenance = 'Manutenção de Peso',
  MuscleGain = 'Ganho de Massa Magra',
  MetabolicHealth = 'Controle Metabólico/Glicêmico'
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // cm
  currentWeight: number; // kg
  goalWeight: number; // kg
  activityLevel: ActivityLevel;
  goal: Goal;
  dietaryRestrictions: string;
  waterIntake: string; // Optional manual override or preference
}

export interface Meal {
  name: string;
  description: string;
  calories: number;
  protein: string;
}

export interface DailyPlan {
  day: string;
  theme: string; // e.g., "Dia de Foco em Hidratação"
  totalCalories: number;
  breakfast: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
  hydrationTip: string;
  exerciseSuggestion: string;
}

export interface GeneratedPlan {
  summary: string;
  dailyPlans: DailyPlan[];
  nutritionalStrategy: string;
  sideEffectManagement: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
  photos?: {
    front?: string;
    back?: string;
    side?: string;
  };
}