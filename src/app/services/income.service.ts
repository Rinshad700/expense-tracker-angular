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

import { Income } from '../models/income';
import { db } from '../firebase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {

  // Signals hook directly into Angular's own zoneless change-detection
  // scheduler, so updates from a raw Firestore callback (which Angular can't
  // otherwise see) repaint the view safely — no manual ApplicationRef.tick()
  // needed, and no risk of it racing Angular's own scheduled ticks.
  private incomeSignal = signal<Income[]>([]);
  income = this.incomeSignal.asReadonly();
  income$ = toObservable(this.incomeSignal);

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
        this.incomeSignal.set([]);
        this.loadingSignal.set(false);
        return;
      }

      this.loadingSignal.set(true);

      const q = query(
        collection(db, 'users', user.uid, 'income'),
        orderBy('month', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(
        q,
        snapshot => {
          const income = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Income));
          this.incomeSignal.set(income);
          this.loadingSignal.set(false);
        },
        error => {
          // Without this handler, a rejected listener (e.g. a permission check
          // that races a just-issued login token) dies silently and loading$
          // would stay true forever with nothing to retry it.
          console.error('Income listener failed', error);
          this.loadingSignal.set(false);
        }
      );

    });

  }

  getIncome(id: string): Income | undefined {
    return this.incomeSignal().find(x => x.id === id);
  }

  addIncome(income: Income) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    const { id, ...data } = income;
    return addDoc(collection(db, 'users', uid, 'income'), data);
  }

  updateIncome(updated: Income) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    const { id, ...data } = updated;
    return updateDoc(doc(db, 'users', uid, 'income', id), data);
  }

  deleteIncome(id: string) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    return deleteDoc(doc(db, 'users', uid, 'income', id));
  }

}
