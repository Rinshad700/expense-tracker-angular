import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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

  // Signals hook directly into Angular's own zoneless change-detection
  // scheduler, so updates from a raw Firestore callback (which Angular can't
  // otherwise see) repaint the view safely — no manual ApplicationRef.tick()
  // needed, and no risk of it racing Angular's own scheduled ticks.
  private expensesSignal = signal<TripExpense[]>([]);
  // Prefer reading this signal directly in templates — Angular tracks that
  // natively and coalesces updates safely. expenses$ stays around only for
  // places still consuming it as a stream.
  expenses = this.expensesSignal.asReadonly();
  expenses$ = toObservable(this.expensesSignal);

  // True while a freshly-attached listener hasn't received its first snapshot yet
  // (e.g. right after logging in) — lets pages show a spinner instead of a
  // misleading "no expenses" state during that first round trip to Firestore.
  private loadingSignal = signal<boolean>(true);
  loading$ = toObservable(this.loadingSignal);

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor(private authService: AuthService) {

    this.authService.user$.subscribe(user => {

      // undefined means Firebase hasn't finished checking for a saved
      // session yet — treating that the same as "logged out" would clear
      // data/flip loading off for a moment before the real answer arrives.
      if (user === undefined) {
        return;
      }

      this.unsubscribeSnapshot?.();
      this.unsubscribeSnapshot = null;

      if (!user) {
        this.expensesSignal.set([]);
        this.loadingSignal.set(false);
        return;
      }

      this.loadingSignal.set(true);

      const q = query(
        collection(db, 'users', user.uid, 'tripExpenses'),
        orderBy('date', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(
        q,
        snapshot => {
          const expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TripExpense));
          this.expensesSignal.set(expenses);
          this.loadingSignal.set(false);
        },
        error => {
          console.error('Trip expenses listener failed', error);
          this.loadingSignal.set(false);
        }
      );

    });

  }

  getExpenses(): TripExpense[] {
    return this.expensesSignal();
  }

  getExpensesByTrip(tripId: string): TripExpense[] {
    return this.expensesSignal().filter(e => e.tripId === tripId);
  }

  getExpense(id: string): TripExpense | undefined {
    return this.expensesSignal().find(e => e.id === id);
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
