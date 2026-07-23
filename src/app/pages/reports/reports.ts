import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';

import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit, AfterViewInit {

  transactions: Transaction[] = [];

  totalIncome = 0;
  totalExpense = 0;
  balance = 0;

  barChart!: Chart;
  pieChart!: Chart;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {

    this.transactionService.transactions$.subscribe(data => {

      this.transactions = data;

      this.calculateSummary();

      // Update charts only after they have been created
      if (this.barChart) {
        this.loadBarChart();
      }

      if (this.pieChart) {
        this.loadPieChart();
      }

    });

  }

  ngAfterViewInit(): void {

    this.loadBarChart();

    this.loadPieChart();

  }

  calculateSummary(): void {

    this.totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalExpense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    this.balance = this.totalIncome - this.totalExpense;

  }

  loadBarChart(): void {

    if (this.barChart) {
      this.barChart.destroy();
    }

    const income = new Array(12).fill(0);
    const expense = new Array(12).fill(0);

    this.transactions.forEach(t => {

      const month = new Date(t.date).getMonth();

      if (t.type === 'income') {
        income[month] += t.amount;
      } else {
        expense[month] += t.amount;
      }

    });

    this.barChart = new Chart('barChart', {

      type: 'bar',

      data: {

        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],

        datasets: [
          {
            label: 'Income',
            data: income,
            backgroundColor: '#22c55e'
          },
          {
            label: 'Expense',
            data: expense,
            backgroundColor: '#ef4444'
          }
        ]

      },

      options: {
        responsive: true
      }

    });

  }

  loadPieChart(): void {

    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const categories: { [key: string]: number } = {};

    this.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {

        categories[t.category] =
          (categories[t.category] || 0) + t.amount;

      });

    this.pieChart = new Chart('pieChart', {

      type: 'pie',

      data: {

        labels: Object.keys(categories),

        datasets: [{
          data: Object.values(categories),
          backgroundColor: [
            '#6366f1',
            '#22c55e',
            '#ef4444',
            '#f59e0b',
            '#06b6d4',
            '#8b5cf6',
            '#ec4899',
            '#14b8a6'
          ]
        }]

      },

      options: {
        responsive: true
      }

    });

  }

}