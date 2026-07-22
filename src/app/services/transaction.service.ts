import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Transaction } from '../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private storageKey = 'transactions';

  private transactionsSubject = new BehaviorSubject<Transaction[]>(this.loadTransactions());

  transactions$ = this.transactionsSubject.asObservable();

  private loadTransactions(): Transaction[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private save(transactions: Transaction[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(transactions));
    this.transactionsSubject.next(transactions);
  }

  getTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  addTransaction(transaction: Transaction) {
    const transactions = [...this.transactionsSubject.value, transaction];
    this.save(transactions);
  }

  deleteTransaction(id: number) {
    const transactions = this.transactionsSubject.value.filter(x => x.id !== id);
    this.save(transactions);
  }
  updateTransaction(updated: Transaction) {

  const transactions = this.transactionsSubject.value.map(t =>
    t.id === updated.id ? updated : t
  );

  this.save(transactions);

}

getTransaction(id: number): Transaction | undefined {

  return this.transactionsSubject.value.find(x => x.id === id);

}
}