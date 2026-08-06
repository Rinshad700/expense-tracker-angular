import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

import { TripExpense } from '../models/trip-expense';
import { calculateSettlements } from '../utils/trip-settlement';
import { db } from '../firebase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TripExpenseService {

  private expensesSubject = new BehaviorSubject<TripExpense[]>([]);
  expenses$ = this.expensesSubject.asObservable();

  // True while a freshly-attached listener hasn't received its first snapshot yet
  // (e.g. right after logging in) — lets pages show a spinner instead of a
  // misleading "no expenses" state during that first round trip to Firestore.
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {

    this.authService.user$.subscribe(user => {

      this.unsubscribeSnapshot?.();
      this.unsubscribeSnapshot = null;

      if (!user) {
        this.expensesSubject.next([]);
        this.loadingSubject.next(false);
        return;
      }

      this.loadingSubject.next(true);

      const q = query(
        collection(db, 'users', user.uid, 'tripExpenses'),
        orderBy('date', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(q, snapshot => {
        const expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TripExpense));
        this.ngZone.run(() => {
          this.expensesSubject.next(expenses);
          this.loadingSubject.next(false);
        });
      });

    });

  }

  getExpenses(): TripExpense[] {
    return this.expensesSubject.value;
  }

  getExpensesByTrip(tripId: string): TripExpense[] {
    return this.expensesSubject.value.filter(e => e.tripId === tripId);
  }

  getExpense(id: string): TripExpense | undefined {
    return this.expensesSubject.value.find(e => e.id === id);
  }

  getTripExpenseTotal(tripId: string): number {
    return this.getExpensesByTrip(tripId).reduce((sum, e) => sum + e.amount, 0);
  }

  getTripExpensesByCategory(tripId: string): Map<string, number> {
    const expenses = this.getExpensesByTrip(tripId);
    const categoryMap = new Map<string, number>();

    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    return categoryMap;
  }

  getTripBalances(tripId: string): Array<{ participantName: string; amount: number }> {
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

  getTripSettlements(tripId: string) {
    return calculateSettlements(this.getTripBalances(tripId));
  }

  addExpense(expense: Omit<TripExpense, 'id'>) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    return addDoc(collection(db, 'users', uid, 'tripExpenses'), expense);
  }

  updateExpense(updated: TripExpense) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    const { id, ...data } = updated;
    return updateDoc(doc(db, 'users', uid, 'tripExpenses', id), data);
  }

  deleteExpense(id: string) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    return deleteDoc(doc(db, 'users', uid, 'tripExpenses', id));
  }

  async deleteExpensesByTrip(tripId: string) {
    const uid = this.authService.currentUid;
    if (!uid) return;

    const toDelete = this.getExpensesByTrip(tripId);
    if (toDelete.length === 0) return;

    const batch = writeBatch(db);
    toDelete.forEach(expense => {
      batch.delete(doc(db, 'users', uid, 'tripExpenses', expense.id));
    });

    await batch.commit();
  }
}
