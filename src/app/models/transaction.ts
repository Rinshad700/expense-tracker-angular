export interface Transaction {
  id: number;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}