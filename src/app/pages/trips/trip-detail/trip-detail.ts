import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TripService } from '../../../services/trip.service';
import { TripExpenseService } from '../../../services/trip-expense.service';
import { Trip } from '../../../models/trip';
import { TripExpense } from '../../../models/trip-expense';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './trip-detail.html',
  styleUrls: ['./trip-detail.css']
})
export class TripDetailComponent implements OnInit {
  trip: Trip | null = null;
  expenses: TripExpense[] = [];
  tripId: number = 0;
  Math = Math;

  // Form state
  showExpenseForm = false;
  showTripForm = false;
  editingExpense: TripExpense | null = null;

  // Form data
  tripFormData = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: undefined as number | undefined,
    status: 'ongoing' as 'planned' | 'ongoing' | 'completed',
    location: ''
  };

  expenseFormData = {
    title: '',
    category: 'Food',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paidBy: '',
    currency: 'USD'
  };

  categories = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Other'];

  constructor(
    private tripService: TripService,
    private tripExpenseService: TripExpenseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tripId = parseInt(params['id']);
      this.loadTrip();
      this.loadExpenses();
    });
  }

  loadTrip() {
    const trip = this.tripService.getTrip(this.tripId);
    if (trip) {
      this.trip = trip;
      this.populateTripForm();
    }
  }

  loadExpenses() {
    this.tripExpenseService.expenses$.subscribe(() => {
      this.expenses = this.tripExpenseService.getExpensesByTrip(this.tripId);
    });
  }

  populateTripForm() {
    if (this.trip) {
      this.tripFormData = {
        name: this.trip.name,
        description: this.trip.description || '',
        startDate: this.trip.startDate,
        endDate: this.trip.endDate,
        budget: this.trip.budget,
        status: this.trip.status,
        location: this.trip.location || ''
      };
    }
  }

  toggleTripForm() {
    this.showTripForm = !this.showTripForm;
  }

  toggleExpenseForm(expense?: TripExpense) {
    this.showExpenseForm = !this.showExpenseForm;
    if (expense) {
      this.editingExpense = expense;
      this.expenseFormData = {
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        notes: expense.notes || '',
        paidBy: expense.paidBy || '',
        currency: expense.currency || 'USD'
      };
    } else {
      this.editingExpense = null;
      this.resetExpenseForm();
    }
  }

  resetExpenseForm() {
    this.expenseFormData = {
      title: '',
      category: 'Food',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      paidBy: '',
      currency: 'USD'
    };
  }

  saveTripChanges() {
    if (!this.trip) return;

    const updatedTrip: Trip = {
      ...this.trip,
      ...this.tripFormData
    };

    this.tripService.updateTrip(updatedTrip);
    this.trip = updatedTrip;
    this.showTripForm = false;
  }

  saveExpense() {
    if (!this.expenseFormData.title || this.expenseFormData.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.editingExpense) {
      const updated: TripExpense = {
        ...this.editingExpense,
        ...this.expenseFormData
      };
      this.tripExpenseService.updateExpense(updated);
    } else {
      this.tripExpenseService.addExpense({
        tripId: this.tripId,
        ...this.expenseFormData
      });
    }

    this.showExpenseForm = false;
    this.resetExpenseForm();
    this.editingExpense = null;
  }

  deleteExpense(id: number) {
    if (confirm('Delete this expense?')) {
      this.tripExpenseService.deleteExpense(id);
    }
  }

  getTotalSpent(): number {
    return this.tripExpenseService.getTripExpenseTotal(this.tripId);
  }

  getRemainingBudget(): number {
    if (!this.trip?.budget) return 0;
    return this.trip.budget - this.getTotalSpent();
  }

  getBudgetPercentage(): number {
    if (!this.trip?.budget) return 0;
    return (this.getTotalSpent() / this.trip.budget) * 100;
  }

  getExpensesByCategory() {
    return Array.from(this.tripExpenseService.getTripExpensesByCategory(this.tripId).entries());
  }

  deleteTrip() {
    if (confirm('Are you sure you want to delete this trip and all its expenses?')) {
      this.tripExpenseService.deleteExpensesByTrip(this.tripId);
      this.tripService.deleteTrip(this.tripId);
      this.router.navigate(['/trips']);
    }
  }

  goBack() {
    this.router.navigate(['/trips']);
  }
}
