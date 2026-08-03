export interface Trip {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  status: 'planned' | 'ongoing' | 'completed';
  location?: string;
  participants?: string[];
  createdAt?: string;
}
