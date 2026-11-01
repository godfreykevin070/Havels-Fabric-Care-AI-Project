import axios from 'axios';
import type {
  Advisory,
  Dashboard,
  FabricInfo,
  Garment,
  MetaEnums,
  TrainResult,
  User,
  UserProfile,
  WashCycle,
} from '../types';

const baseURL = import.meta.env.VITE_API_BASE ?? '/api/v1';

export const api = axios.create({ baseURL });

// ---------------------------------------------------------------- users
export const listUsers = () => api.get<User[]>('/users').then((r) => r.data);
export const createUser = (payload: { name: string; email: string }) =>
  api.post<User>('/users', payload).then((r) => r.data);

// ----------------------------------------------------------------- meta
export const getFabrics = () =>
  api.get<{ fabrics: FabricInfo[] }>('/meta/fabrics').then((r) => r.data.fabrics);
export const getEnums = () => api.get<MetaEnums>('/meta/enums').then((r) => r.data);

// ------------------------------------------------------------- garments
export const listGarments = (userId: number) =>
  api.get<Garment[]>('/garments', { params: { user_id: userId } }).then((r) => r.data);

export const createGarment = (payload: {
  user_id: number;
  name: string;
  fabric_type: string;
  color_group: string;
  purchase_date?: string | null;
}) => api.post<Garment>('/garments', payload).then((r) => r.data);

export const logWear = (garmentId: number) =>
  api.post<Garment>(`/garments/${garmentId}/wear`).then((r) => r.data);

export const garmentHealth = (garmentId: number) =>
  api
    .get<{
      garment_id: number;
      name: string;
      health_score: number;
      band: string;
      drivers: string[];
      recommendation: string;
    }>(`/garments/${garmentId}/health`)
    .then((r) => r.data);

export const deleteGarment = (garmentId: number) =>
  api.delete(`/garments/${garmentId}`).then(() => undefined);

// ------------------------------------------------------------- advisory
export const getAdvisory = (payload: {
  user_id: number;
  garment_ids: number[];
  soiling_level: string;
  load_size: string;
  use_adaptive: boolean;
}) => api.post<Advisory>('/advisory/recommend', payload).then((r) => r.data);

// ---------------------------------------------------------- wash cycles
export const createWashCycle = (payload: {
  user_id: number;
  garment_ids: number[];
  cycle_type: string;
  water_temp: number;
  spin_rpm: number;
  duration_min: number;
  engine_used: string;
  recommendation_id?: number | null;
  load_size?: string;
  soiling_level?: string;
}) => api.post<WashCycle>('/wash-cycles', payload).then((r) => r.data);

export const listWashCycles = (userId: number) =>
  api.get<WashCycle[]>('/wash-cycles', { params: { user_id: userId } }).then((r) => r.data);

// ------------------------------------------------------------- feedback
export const submitFeedback = (payload: {
  user_id: number;
  wash_cycle_id: number;
  garment_id?: number | null;
  cleaning_satisfaction: number;
  fading: number;
  shrinkage: number;
  roughness: number;
  pilling: number;
  color_loss: number;
  notes?: string;
}) => api.post('/feedback', payload).then((r) => r.data);

// ------------------------------------------------------------- profiles
export const getProfile = (userId: number) =>
  api.get<UserProfile>(`/profiles/${userId}`).then((r) => r.data);

export const rebuildProfile = (userId: number) =>
  api.post<UserProfile>(`/profiles/${userId}/rebuild`).then((r) => r.data);

export const trainModel = (userId: number) =>
  api.post<TrainResult>(`/profiles/${userId}/train`).then((r) => r.data);

// ------------------------------------------------------------ dashboard
export const getDashboard = (userId: number) =>
  api.get<Dashboard>(`/dashboard/${userId}`).then((r) => r.data);