import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';

import { Transaction } from '../../models/transaction';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit, AfterViewInit {

  transactions: Transaction[] = [];

  totalExpense = 0;
  todayExpense = 0;
  currentMonthExpense = 0;

  topCategories: { category: string; amount: number }[] = [];

  barChart!: Chart;
  pieChart!: Chart;

  constructor(private service: TransactionService) {}

  ngOnInit(): void {

    this.service.transactions$.subscribe(data => {

      this.transactions = data;

      this.calculateSummary();

      if (this.barChart) this.loadBarChart();

      if (this.pieChart) this.loadPieChart();

    });

  }

 ngAfterViewInit(): void {

  setTimeout(() => {

    this.loadBarChart();
    this.loadPieChart();

  });

}

  calculateSummary(): void {

    const today = new Date();

    this.totalExpense = this.transactions.reduce((sum, t) => sum + t.amount, 0);

    this.todayExpense = this.transactions
      .filter(t => {

        const d = new Date(t.date);

        return d.toDateString() === today.toDateString();

      })
      .reduce((sum, t) => sum + t.amount, 0);

    this.currentMonthExpense = this.transactions
      .filter(t => {

        const d = new Date(t.date);

        return d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();

      })
      .reduce((sum, t) => sum + t.amount, 0);

    const map: { [key: string]: number } = {};

    this.transactions.forEach(t => {

      map[t.category] = (map[t.category] || 0) + t.amount;

    });

    this.topCategories = Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

  }

  loadBarChart() {

    if (this.barChart) this.barChart.destroy();

    const monthly = new Array(12).fill(0);

    this.transactions.forEach(t => {

      monthly[new Date(t.date).getMonth()] += t.amount;

    });

    this.barChart = new Chart('barChart', {

      type: 'bar',

      data: {

        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],

        datasets: [

          {

            label: 'Expenses',

            data: monthly,

            backgroundColor: '#2563eb'

          }

        ]

      },

      options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

    });

  }

  loadPieChart() {

    if (this.pieChart) this.pieChart.destroy();

    const map: { [key: string]: number } = {};

    this.transactions.forEach(t => {

      map[t.category] = (map[t.category] || 0) + t.amount;

    });

    this.pieChart = new Chart('pieChart', {

      type: 'pie',

      data: {

        labels: Object.keys(map),

        datasets: [{

          data: Object.values(map),

          backgroundColor: [

            '#2563eb',
            '#ef4444',
            '#22c55e',
            '#f59e0b',
            '#8b5cf6',
            '#06b6d4',
            '#ec4899'

          ]

        }]

      },

      options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

    });

  }

}