import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { TripExpenseService } from '../../services/trip-expense.service';
import { Trip } from '../../models/trip';
import { TripPreviewComponent } from '../../components/trip-preview/trip-preview';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, TripPreviewComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent {

  private tripService = inject(TripService);
  private tripExpenseService = inject(TripExpenseService);
  private router = inject(Router);

  Math = Math;

  // Reading the service's signals directly (rather than copying into plain
  // fields via .subscribe()) is what lets Angular's zoneless change
  // detection track and safely coalesce these updates on its own.
  trips = this.tripService.trips;
  loading = this.tripService.loading;

  activeTrips = computed(() => this.trips().filter(t => t.status === 'ongoing' || t.status === 'planned'));
  completedTrips = computed(() => this.trips().filter(t => t.status === 'completed'));

  previewingTrip = signal<Trip | null>(null);

  getTripTotal(tripId: string): number {
    return this.tripExpenseService.getTripExpenseTotal(tripId);
  }

  getRemainingBudget(trip: Trip): number {
    if (!trip.budget) return 0;
    const spent = this.getTripTotal(trip.id);
    return trip.budget - spent;
  }

  getBudgetPercentage(trip: Trip): number {
    if (!trip.budget) return 0;
    const spent = this.getTripTotal(trip.id);
    return (spent / trip.budget) * 100;
  }

  addTrip() {
    this.router.navigate(['/trips/new']);
  }

  viewTrip(id: string) {
    this.router.navigate(['/trips', id]);
  }

  previewTrip(id: string) {
    this.previewingTrip.set(this.trips().find(t => t.id === id) || null);
  }

  deleteTrip(id: string) {
    if (confirm('Are you sure you want to delete this trip?')) {
      this.tripExpenseService.deleteExpensesByTrip(id);
      this.tripService.deleteTrip(id);
    }
  }
}
