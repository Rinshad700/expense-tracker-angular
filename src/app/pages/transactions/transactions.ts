import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Transaction } from '../../models/transaction';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css'
})
export class TransactionsComponent implements OnInit {

  transactions: Transaction[] = [];
  isEditing = false;

  transaction: Transaction = {
    id: 0,
    title: '',
    category: '',
    amount: 0,
    type: 'expense',
    date: new Date().toISOString().substring(0, 10)
  };

  incomeCategories: string[] = [
    'Salary',
    'Bonus',
    'Freelance',
    'Interest',
    'Investment',
    'Other'
  ];

  expenseCategories: string[] = [
    'Food',
    'Rent',
    'Transport',
    'Shopping',
    'Medical',
    'Entertainment',
    'Utilities',
    'Other'
  ];

  constructor(private service: TransactionService) {}

  ngOnInit(): void {
    this.service.transactions$
      .subscribe(data => this.transactions = data);
  }

  get categories(): string[] {
    return this.transaction.type === 'income'
      ? this.incomeCategories
      : this.expenseCategories;
  }

onTypeChange(): void {

  if (!this.isEditing) {
    this.transaction.category = '';
  }

}

  save(): void {

    if (this.isEditing) {
      this.service.updateTransaction({ ...this.transaction });
    } else {
      this.transaction.id = Date.now();
      this.service.addTransaction({ ...this.transaction });
    }

    this.resetForm();

  }

  edit(transaction: Transaction): void {

    this.transaction = { ...transaction };

    this.isEditing = true;

  }

  resetForm(): void {

    this.transaction = {
      id: 0,
      title: '',
      category: '',
      amount: 0,
      type: 'expense',
      date: new Date().toISOString().substring(0, 10)
    };

    this.isEditing = false;

  }

  delete(id: number): void {

    if (confirm('Delete this transaction?')) {
      this.service.deleteTransaction(id);
    }

  }

}