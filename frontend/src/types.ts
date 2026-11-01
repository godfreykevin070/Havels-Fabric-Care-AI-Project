export interface User {
  id: number;
  name: string;
  email: string;
  household_id?: string | null;
  created_at: string;
}

export interface Garment {
  id: number;
  user_id: number;
  name: string;
  fabric_type: string;
  color_group: string;
  brand?: string | null;
  wear_count: number;
  wash_count: number;
  health_score: number;
  last_wash_at?: string | null;
  created_at: string;
}

export interface PerGarmentAdvice {
  garment_id: number;
  name: string;
  fabric_type: string;
  water_temp: number;
  spin_rpm: number;
  duration_min: number;
  cycle_type: string;
  alerts: string[];
}

export interface Advisory {
  id: number | null;
  engine: 'rule' | 'adaptive';
  confidence: number;
  cycle_type: string;
  water_temp: number;
  spin_rpm: number;
  duration_min: number;
  detergent: string;
  drying: string;
  ironing: string;
  alerts: string[];
  reasons: string[];
  per_garment: PerGarmentAdvice[];
  adaptive_applied: boolean;
  created_at?: string | null;
}

export interface WashCycle {
  id: number;
  user_id: number;
  cycle_type: string;
  water_temp: number;
  spin_rpm: number;
  duration_min: number;
  engine_used: string;
  created_at: string;
  garment_ids: number[];
}

export interface FabricInfo {
  key: string;
  label: string;
  durability: number;
  base_temp_c: number;
  temp_range: [number, number];
  max_spin_rpm: number;
  cycle_type: string;
  detergent: string;
  drying: string;
  ironing: string;
  alerts: string[];
}

export interface MetaEnums {
  color_groups: string[];
  soiling_levels: string[];
  load_sizes: string[];
  care_groups: string[];
}

export interface UserProfile {
  id: number;
  user_id: number;
  care_group: string;
  preferred_temp: number;
  preferred_spin: number;
  preferred_duration: number;
  total_washes: number;
  total_feedbacks: number;
  avg_cleaning_satisfaction: number;
  avg_defect_score: number;
  gentle_index: number;
  metrics: Record<string, number>;
  model_version: string;
  updated_at: string;
}

export interface Dashboard {
  user: { id: number; name: string; email: string };
  profile: {
    care_group: string;
    preferred_temp: number;
    preferred_spin: number;
    preferred_duration: number;
    gentle_index: number;
    model_version: string;
    avg_defect_score: number;
    avg_cleaning_satisfaction: number;
    updated_at: string;
  } | null;
  wardrobe: {
    total_garments: number;
    average_health: number;
    by_fabric: { fabric: string; count: number; avg_health: number; total_washes: number }[];
    health_distribution: { bucket: string; count: number }[];
    items: {
      id: number;
      name: string;
      fabric_type: string;
      health_score: number;
      band: string;
      wash_count: number;
      wear_count: number;
      age_days: number;
    }[];
  };
  usage: {
    total_washes: number;
    total_wears: number;
    total_feedbacks: number;
    avg_temp: number;
    avg_spin: number;
    avg_duration: number;
    avg_satisfaction: number;
    washes_by_fabric: { fabric: string; washes: number }[];
    temp_trend: { date: string; water_temp: number; spin_rpm: number }[];
  };
  recent_recommendations: {
    id: number;
    engine: string;
    confidence: number;
    accepted: boolean;
    created_at: string;
    settings: Record<string, unknown>;
  }[];
  recent_wash_cycles: {
    id: number;
    cycle_type: string;
    water_temp: number;
    spin_rpm: number;
    duration_min: number;
    engine_used: string;
    created_at: string;
  }[];
  alerts: string[];
}

export interface TrainResult {
  trained: boolean;
  n_samples: number;
  trained_at?: string | null;
  reason?: string | null;
}