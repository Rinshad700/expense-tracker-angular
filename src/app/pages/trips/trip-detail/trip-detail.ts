import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TripService } from '../../../services/trip.service';
import { TripExpenseService } from '../../../services/trip-expense.service';
import { Trip } from '../../../models/trip';
import { TripExpense } from '../../../models/trip-expense';
import { calculateExpenseShares, validateCustomSplit } from '../../../utils/trip-settlement';

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
  settlementBalances: Array<{ participantName: string; amount: number }> = [];
  settlementPlan: Array<{ from: string; to: string; amount: number }> = [];

  showExpenseForm = false;
  showTripForm = false;
  editingExpense: TripExpense | null = null;

  tripFormData = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: undefined as number | undefined,
    status: 'ongoing' as 'planned' | 'ongoing' | 'completed',
    location: '',
    participantsText: ''
  };

  expenseFormData = {
    title: '',
    category: 'Food',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paidBy: '',
    currency: 'INR',
    splitType: 'equal' as 'equal' | 'custom',
    participants: [] as string[],
    customSplits: [] as Array<{ participantName: string; amount: number }>
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
      this.refreshSettlementSummary();
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
        location: this.trip.location || '',
        participantsText: (this.trip.participants || []).join(', ')
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
      currency: expense.currency || 'INR',
        splitType: expense.splitType || 'equal',
        participants: [...(expense.participants || this.getTripParticipants())],
        customSplits: this.buildCustomSplits(expense.participants || this.getTripParticipants(), expense.splits || [])
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
      paidBy: this.getTripParticipants()[0] || '',
      currency: 'INR',
      splitType: 'equal',
      participants: [...this.getTripParticipants()],
      customSplits: this.buildCustomSplits(this.getTripParticipants())
    };
    this.participantSearchText = '';
  }

  syncCustomSplits() {
    const participants = this.getExpenseParticipants();
    const existing = this.expenseFormData.customSplits || [];
    const existingMap = new Map(existing.map(split => [split.participantName, split.amount]));

    this.expenseFormData.customSplits = participants.map(participantName => ({
      participantName,
      amount: existingMap.get(participantName) || 0
    }));
  }

  saveTripChanges() {
    if (!this.trip) return;

    const participants = this.tripFormData.participantsText
      .split(',')
      .map(name => name.trim())
      .filter(Boolean);

    const updatedTrip: Trip = {
      ...this.trip,
      ...this.tripFormData,
      participants
    };

    this.tripService.updateTrip(updatedTrip);
    this.trip = updatedTrip;
    this.showTripForm = false;
  }

  saveExpense() {
    this.showParticipantDropdown = false;

    if (!this.expenseFormData.title || this.expenseFormData.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    const participants = this.getExpenseParticipants();
    if (participants.length === 0) {
      alert('Add at least one participant before saving the expense');
      return;
    }

    const splitType = this.expenseFormData.splitType || 'equal';
    let splits: Array<{ participantName: string; amount: number }> = [];

    if (splitType === 'equal') {
      splits = calculateExpenseShares(this.expenseFormData.amount, participants, 'equal');
    } else {
      this.syncCustomSplits();
      const customSplits = (this.expenseFormData.customSplits || []).filter(split => split.participantName);
      const total = customSplits.reduce((sum, split) => sum + Number(split.amount || 0), 0);

      const validation = validateCustomSplit(total, this.expenseFormData.amount);
      if (!validation.isValid) {
        const difference = Math.abs(validation.difference);
        const formattedDifference = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2
        }).format(difference);

        alert(
          validation.type === 'exceeds'
            ? `Custom split exceeds the expense by ${formattedDifference}.`
            : `Custom split is short by ${formattedDifference}.`
        );
        return;
      }

      splits = customSplits;
    }

    const payload = {
      tripId: this.tripId,
      title: this.expenseFormData.title,
      category: this.expenseFormData.category,
      amount: this.expenseFormData.amount,
      date: this.expenseFormData.date,
      notes: this.expenseFormData.notes,
      paidBy: this.expenseFormData.paidBy,
      currency: this.expenseFormData.currency,
      participants,
      splits,
      splitType
    };

    if (this.editingExpense) {
      const updated: TripExpense = {
        ...this.editingExpense,
        ...payload
      };
      this.tripExpenseService.updateExpense(updated);
    } else {
      this.tripExpenseService.addExpense(payload);
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

  getTripParticipants(): string[] {
    return this.trip?.participants?.filter(Boolean) || [];
  }

  showParticipantDropdown = false;
  participantSearchText = '';

  toggleParticipantDropdown() {
    this.showParticipantDropdown = !this.showParticipantDropdown;
    if (!this.showParticipantDropdown) {
      this.participantSearchText = '';
    }
  }

  toggleParticipant(participantName: string) {
    const index = (this.expenseFormData.participants || []).indexOf(participantName);
    if (index > -1) {
      this.expenseFormData.participants?.splice(index, 1);
    } else {
      this.expenseFormData.participants?.push(participantName);
    }
    this.syncCustomSplits();
  }

  isParticipantSelected(participantName: string): boolean {
    return (this.expenseFormData.participants || []).includes(participantName);
  }

  getFilteredParticipants(): string[] {
    const searchLower = this.participantSearchText.toLowerCase();
    return this.getTripParticipants().filter(p => p.toLowerCase().includes(searchLower));
  }

  getExpenseParticipants(): string[] {
    return (this.expenseFormData.participants || []).filter(Boolean);
  }

  buildCustomSplits(participants: string[], existingSplits: Array<{ participantName: string; amount: number }> = []): Array<{ participantName: string; amount: number }> {
    const existingMap = new Map(existingSplits.map(split => [split.participantName, split.amount]));
    return participants.map(participantName => ({
      participantName,
      amount: existingMap.get(participantName) || 0
    }));
  }

  getExpenseSplitSummary(expense: TripExpense): string {
    return (expense.splits || [])
      .map(split => `${split.participantName}: ${split.amount.toFixed(2)}`)
      .join(', ');
  }

  getCustomSplitValidationMessage(): string | null {
    if (this.expenseFormData.splitType !== 'custom') {
      return null;
    }

    const total = (this.expenseFormData.customSplits || []).reduce((sum, split) => sum + Number(split.amount || 0), 0);
    const validation = validateCustomSplit(total, this.expenseFormData.amount);

    if (validation.isValid) {
      return null;
    }

    const difference = Math.abs(validation.difference);
    const formattedDifference = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(difference);

    return validation.type === 'exceeds'
      ? `Custom split exceeds the expense by ${formattedDifference}.`
      : `Custom split is short by ${formattedDifference}.`;
  }

  refreshSettlementSummary() {
    this.settlementBalances = this.tripExpenseService.getTripBalances(this.tripId);
    this.settlementPlan = this.tripExpenseService.getTripSettlements(this.tripId);
  }

  closeTrip() {
    if (!this.trip) return;

    const updatedTrip: Trip = {
      ...this.trip,
      status: 'completed'
    };

    this.tripService.updateTrip(updatedTrip);
    this.trip = updatedTrip;
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
