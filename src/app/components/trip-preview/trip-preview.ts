import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Trip } from '../../models/trip';
import { TripExpenseService } from '../../services/trip-expense.service';

@Component({
  selector: 'app-trip-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-preview.html',
  styleUrl: './trip-preview.css'
})
export class TripPreviewComponent {

  @Input({ required: true }) trip!: Trip;
  @Output() close = new EventEmitter<void>();

  private tripExpenseService = inject(TripExpenseService);
  Math = Math;

  expenses = computed(() => this.tripExpenseService.getExpensesByTrip(this.trip.id));
  totalSpent = computed(() => this.tripExpenseService.getTripExpenseTotal(this.trip.id));
  remainingBudget = computed(() => this.trip.budget ? this.trip.budget - this.totalSpent() : 0);
  expensesByCategory = computed(() => Array.from(this.tripExpenseService.getTripExpensesByCategory(this.trip.id).entries()));
  settlementBalances = computed(() => this.tripExpenseService.getTripBalances(this.trip.id));
  settlementPlan = computed(() => this.tripExpenseService.getTripSettlements(this.trip.id));
  participants = computed(() => this.trip.participants?.filter(Boolean) || []);

  onClose() {
    this.close.emit();
  }

}
