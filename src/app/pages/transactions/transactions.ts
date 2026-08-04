import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

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
  showValidation = false;
  showForm = false;

  transaction: Transaction = {
    id: '',
    title: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().substring(0, 10)
  };

  categories: string[] = [
    'Food',
    'Rent',
    'Transport',
    'Shopping',
    'Medical',
    'Entertainment',
    'Utilities',
    'Education',
    'Petrol',
    'Travel',
    'Other'
  ];

  constructor(private service: TransactionService) {}

  ngOnInit(): void {

    this.service.transactions$
      .subscribe(data => this.transactions = data);

  }

  save(form: NgForm): void {

    this.showValidation = true;

    if (!form.valid) {
      return;
    }

    if (this.isEditing) {

      this.service.updateTransaction({ ...this.transaction });

    } else {

      this.service.addTransaction({ ...this.transaction });

    }

    this.resetForm(form);

    this.showForm = false;

  }

  edit(transaction: Transaction): void {

    this.transaction = { ...transaction };

    this.isEditing = true;

    this.showValidation = false;

    this.showForm = true;

  }

  toggleForm(): void {

    this.showForm = !this.showForm;

    if (!this.showForm) {
      this.resetForm();
    }

  }

  resetForm(form?: NgForm): void {

    this.transaction = {
      id: '',
      title: '',
      category: '',
      amount: 0,
      date: new Date().toISOString().substring(0, 10)
    };

    this.isEditing = false;

    this.showValidation = false;

    form?.resetForm({
      id: '',
      title: '',
      category: '',
      amount: 0,
      date: new Date().toISOString().substring(0, 10)
    });

  }

  delete(id: string): void {

    if (confirm('Delete this expense?')) {

      this.service.deleteTransaction(id);

    }

  }

}