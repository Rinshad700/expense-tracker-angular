import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TransactionService } from '../../services/transaction.service';
import { IncomeService } from '../../services/income.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnDestroy {

  private transactionService = inject(TransactionService);
  private incomeService = inject(IncomeService);

  currentDate = new Date();

  // Reading the service's signals directly (rather than copying into plain
  // fields via .subscribe()) is what lets Angular's zoneless change
  // detection track and safely coalesce these updates on its own.
  transactions = this.transactionService.transactions;
  income = this.incomeService.income;
  loading = computed(() => this.transactionService.loading() || this.incomeService.loading());

  recentTransactions = computed(() =>
    [...this.transactions()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );

  currentMonthExpense = computed(() => {
    const today = new Date();
    return this.transactions()
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  });

  todayExpense = computed(() => {
    const today = new Date();
    return this.transactions()
      .filter(t => {
        const date = new Date(t.date);
        return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  });

  totalIncome = computed(() => this.income().reduce((sum, i) => sum + i.amount, 0));

  totalExpenses = computed(() => this.transactions().reduce((sum, t) => sum + t.amount, 0));

  totalBalance = computed(() => this.totalIncome() - this.totalExpenses());

  loadingSeconds = signal(0);
  private loadingTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {

    effect(() => {

      if (this.loading()) {
        this.loadingSeconds.set(0);
        this.loadingTimer ??= setInterval(() => this.loadingSeconds.update(s => s + 1), 1000);
      } else if (this.loadingTimer) {
        clearInterval(this.loadingTimer);
        this.loadingTimer = null;
      }

    });

  }

  ngOnDestroy(): void {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
    }
  }

}
