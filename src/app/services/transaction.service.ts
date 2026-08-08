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
  updateDoc
} from 'firebase/firestore';

import { Transaction } from '../models/transaction';
import { db } from '../firebase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  // Signals hook directly into Angular's own zoneless change-detection
  // scheduler, so updates from a raw Firestore callback (which Angular can't
  // otherwise see) repaint the view safely — no manual ApplicationRef.tick()
  // needed, and no risk of it racing Angular's own scheduled ticks.
  private transactionsSignal = signal<Transaction[]>([]);
  // Prefer reading this signal directly in templates — Angular tracks that
  // natively and coalesces updates safely. transactions$ stays around only
  // for places still consuming it as a stream.
  transactions = this.transactionsSignal.asReadonly();
  transactions$ = toObservable(this.transactionsSignal);

  // True while a freshly-attached listener hasn't received its first snapshot yet
  // (e.g. right after logging in) — lets pages show a spinner instead of a
  // misleading "no data" state during that first round trip to Firestore.
  private loadingSignal = signal<boolean>(true);
  loading = this.loadingSignal.asReadonly();
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
        this.transactionsSignal.set([]);
        this.loadingSignal.set(false);
        return;
      }

      this.loadingSignal.set(true);

      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        orderBy('date', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(
        q,
        snapshot => {
          const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
          this.transactionsSignal.set(transactions);
          this.loadingSignal.set(false);
        },
        error => {
          // Without this handler, a rejected listener (e.g. a permission check
          // that races a just-issued login token) dies silently and loading$
          // would stay true forever with nothing to retry it.
          console.error('Transactions listener failed', error);
          this.loadingSignal.set(false);
        }
      );

    });

  }

  getTransactions(): Transaction[] {
    return this.transactionsSignal();
  }

  getTransaction(id: string): Transaction | undefined {
    return this.transactionsSignal().find(x => x.id === id);
  }

  addTransaction(transaction: Transaction) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    const { id, ...data } = transaction;
    return addDoc(collection(db, 'users', uid, 'transactions'), data);
  }

  updateTransaction(updated: Transaction) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    const { id, ...data } = updated;
    return updateDoc(doc(db, 'users', uid, 'transactions', id), data);
  }

  deleteTransaction(id: string) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    return deleteDoc(doc(db, 'users', uid, 'transactions', id));
  }

}
