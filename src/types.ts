export type PlantType = 'Flowering' | 'Indoor' | 'Outdoor' | 'Medicinal' | 'Succulent';
export type HealthStatus = 'Good' | 'Moderate' | 'Poor';

export interface Plant {
  id: string;
  ownerUid: string;
  name: string;
  type: PlantType;
  height: number;
  age: number;
  lastWatered: string; // ISO 8601
  wateringFrequency: number; // in days
  healthStatus: HealthStatus;
  notes: string;
  imageUrl: string;
  lastFertilized: string; // ISO 8601
}

export interface GrowthLog {
  id: string;
  plantId: string;
  height: number;
  timestamp: string; // ISO 8601
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
}
