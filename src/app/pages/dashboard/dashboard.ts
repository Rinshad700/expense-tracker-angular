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

totalIncome = 0;
totalExpense = 0;
balance = 0;

recentTransactions: Transaction[] = [];


  constructor(
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {

  this.transactionService.transactions$
    .subscribe(data => {

      this.transactions = data;

      this.calculateSummary();

    });

}

  calculateSummary() {

  this.totalIncome = this.transactions
    .filter(x => x.type === 'income')
    .reduce((sum, x) => sum + x.amount, 0);

  this.totalExpense = this.transactions
    .filter(x => x.type === 'expense')
    .reduce((sum, x) => sum + x.amount, 0);

  this.balance = this.totalIncome - this.totalExpense;

  this.recentTransactions = [...this.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

}

}