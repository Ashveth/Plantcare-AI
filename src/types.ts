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
  careRequirements?: CareRequirements;
  fertilizerSchedule?: FertilizerSchedule;
  notificationsEnabled?: boolean;
  createdAt: string;
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
