import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TripExpense } from '../models/trip-expense';

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
