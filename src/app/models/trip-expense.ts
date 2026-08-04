export interface TripExpenseSplit {
  participantName: string;
  amount: number;
}

export interface TripExpense {
  id: string;
  tripId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  paidBy?: string;
  currency?: string;
  participants?: string[];
  splits?: TripExpenseSplit[];
  splitType?: 'equal' | 'custom';
}
