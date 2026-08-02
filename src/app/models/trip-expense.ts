export interface TripExpense {
  id: number;
  tripId: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  paidBy?: string;
  currency?: string;
}
