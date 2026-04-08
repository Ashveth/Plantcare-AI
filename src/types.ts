export interface Plant {
  id: string;
  ownerUid: string;
  name: string;
  species: string;
  isIndoor: boolean;
  plantationDate: string;
  location: string;
  potSize?: string;
  imageUrl?: string;
  expectedLifespan?: string;
  healthStatus?: string;
  description?: string;
  smartCareTips?: string[];
  careRequirements?: CareRequirements;
  fertilizerSchedule?: FertilizerSchedule;
  futurePredictions?: FuturePredictions;
  notificationsEnabled?: boolean;
  createdAt: string;
}

export interface FuturePredictions {
  nextRepotting: string;
  seasonalTips: string;
  growthExpectations: string;
  riskAlerts: string;
}

export interface CareRequirements {
  wateringFrequency: string;
  sunlightRequirement: string;
  idealTemperatureRange: string;
  humidityRequirement: string;
  soilType: string;
  repottingFrequency: string;
}

export interface FertilizerSchedule {
  fertilizerType: string;
  seasonalSchedule: {
    springSummer: string;
    monsoon: string;
    winter: string;
  };
  quantityGuidance: string;
}

export interface PlantEvent {
  id: string;
  plantId: string;
  type: 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'health_issue' | 'milestone';
  date: string;
  status: 'pending' | 'completed' | 'skipped' | 'snoozed' | 'resolved';
  notes?: string;
  aiDiagnosis?: string;
  aiSolution?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  farmName?: string;
  location?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt?: string;
}

export interface Land {
  id: string;
  ownerUid: string;
  name: string;
  area: string;
  areaUnit: 'acres' | 'hectares' | 'sq_meters' | 'bigha';
  cropType: string;
  treesPlanted?: string;
  soilType?: string;
  location?: string;
  aiReport?: LandAIReport;
  createdAt: string;
}

export interface LandAIReport {
  wateringSchedule: string;
  fertilizerNeeds: string;
  pestAlerts: string;
  harvestPrediction: string;
  generalAdvice: string;
  roadmap: { month: string, action: string, details: string }[];
}

export interface FarmerLog {
  id: string;
  ownerUid: string;
  date: string;
  type: 'planting' | 'fertilizing' | 'harvesting' | 'expense' | 'irrigation' | 'pest_control' | 'general' | 'income';
  title: string;
  cropName?: string;
  productName?: string;
  quantity?: string;
  areaCovered?: string;
  expense?: number;
  income?: number;
  notes?: string;
  createdAt: string;
}
