import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Transaction } from '../../models/transaction';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  transactions: Transaction[] = [];
  todayExpense = 0;
  currentMonthExpense = 0;
  currentDate = new Date();

  recentTransactions: Transaction[] = [];

  constructor(
    private transactionService: TransactionService
  ) { }

  ngOnInit(): void {

    this.transactionService.transactions$
      .subscribe(data => {

        this.transactions = data;

        this.calculateSummary();

      });

  }

 calculateSummary(): void {

  const today = new Date();

  // Current Month Expense
  this.currentMonthExpense = this.transactions
    .filter(t => {

      const date = new Date(t.date);

      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );

    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Today's Expense
  this.todayExpense = this.transactions
    .filter(t => {

      const date = new Date(t.date);

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );

    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Recent Expenses
  this.recentTransactions = [...this.transactions]
    .sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 5);

}

}