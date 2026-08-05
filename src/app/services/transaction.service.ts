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
  updateDoc
} from 'firebase/firestore';

import { Transaction } from '../models/transaction';
import { db } from '../firebase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {

    this.authService.user$.subscribe(user => {

      this.unsubscribeSnapshot?.();
      this.unsubscribeSnapshot = null;

      if (!user) {
        this.transactionsSubject.next([]);
        return;
      }

      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        orderBy('date', 'desc')
      );

      // Firestore's realtime channel isn't reliably zone.js-patched, so push the
      // resulting update back into Angular's zone or the view just won't repaint
      // until something unrelated (like a route change) forces a tick.
      this.unsubscribeSnapshot = onSnapshot(q, snapshot => {
        const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        this.ngZone.run(() => this.transactionsSubject.next(transactions));
      });

    });

  }

  getTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  getTransaction(id: string): Transaction | undefined {
    return this.transactionsSubject.value.find(x => x.id === id);
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
