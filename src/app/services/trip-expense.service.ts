import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TripExpense } from '../models/trip-expense';
import { calculateSettlements } from '../utils/trip-settlement';

@Injectable({
  providedIn: 'root'
})
export class TripExpenseService {

  private storageKey = 'tripExpenses';
  private expensesSubject = new BehaviorSubject<TripExpense[]>(this.loadExpenses());
  expenses$ = this.expensesSubject.asObservable();

  private loadExpenses(): TripExpense[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private save(expenses: TripExpense[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(expenses));
    this.expensesSubject.next(expenses);
  }

  getExpenses(): TripExpense[] {
    return this.expensesSubject.value;
  }

  getExpensesByTrip(tripId: number): TripExpense[] {
    return this.expensesSubject.value.filter(e => e.tripId === tripId);
  }

  getExpense(id: number): TripExpense | undefined {
    return this.expensesSubject.value.find(e => e.id === id);
  }

  getTripExpenseTotal(tripId: number): number {
    return this.getExpensesByTrip(tripId).reduce((sum, e) => sum + e.amount, 0);
  }

  getTripExpensesByCategory(tripId: number): Map<string, number> {
    const expenses = this.getExpensesByTrip(tripId);
    const categoryMap = new Map<string, number>();

    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    return categoryMap;
  }

  getTripBalances(tripId: number): Array<{ participantName: string; amount: number }> {
    const expenses = this.getExpensesByTrip(tripId);
    const participantNames = new Set<string>();

    expenses.forEach(expense => {
      (expense.participants || []).forEach(name => participantNames.add(name));
      if (expense.paidBy) {
        participantNames.add(expense.paidBy);
      }
    });

    const balances = Array.from(participantNames).map(participantName => ({
      participantName,
      amount: 0
    }));

    const balanceMap = new Map<string, number>(balances.map(balance => [balance.participantName, balance.amount]));

    expenses.forEach(expense => {
      if (expense.paidBy && balanceMap.has(expense.paidBy)) {
        balanceMap.set(expense.paidBy, (balanceMap.get(expense.paidBy) || 0) + expense.amount);
      }

      (expense.splits || []).forEach(split => {
        if (balanceMap.has(split.participantName)) {
          balanceMap.set(split.participantName, (balanceMap.get(split.participantName) || 0) - split.amount);
        }
      });
    });

    return Array.from(balanceMap.entries()).map(([participantName, amount]) => ({
      participantName,
      amount: Number(amount.toFixed(2))
    }));
  }

  getTripSettlements(tripId: number) {
    return calculateSettlements(this.getTripBalances(tripId));
  }

  addExpense(expense: Omit<TripExpense, 'id'>): TripExpense {
    const newExpense: TripExpense = {
      ...expense,
      id: Date.now()
    };
    const expenses = [...this.expensesSubject.value, newExpense];
    this.save(expenses);
    return newExpense;
  }

  updateExpense(updated: TripExpense) {
    const expenses = this.expensesSubject.value.map(e =>
      e.id === updated.id ? updated : e
    );
    this.save(expenses);
  }

  deleteExpense(id: number) {
    const expenses = this.expensesSubject.value.filter(e => e.id !== id);
    this.save(expenses);
  }

  deleteExpensesByTrip(tripId: number) {
    const expenses = this.expensesSubject.value.filter(e => e.tripId !== tripId);
    this.save(expenses);
  }
}
