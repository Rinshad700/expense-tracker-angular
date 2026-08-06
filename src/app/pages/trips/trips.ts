import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { TripExpenseService } from '../../services/trip-expense.service';
import { Trip } from '../../models/trip';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  trips: Trip[] = [];
  activeTrips: Trip[] = [];
  completedTrips: Trip[] = [];
  loading = true;
  Math = Math;

  constructor(
    private tripService: TripService,
    private tripExpenseService: TripExpenseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.tripService.trips$.subscribe(trips => {
      this.trips = trips;
      this.activeTrips = trips.filter(t => t.status === 'ongoing' || t.status === 'planned');
      this.completedTrips = trips.filter(t => t.status === 'completed');
    });

    this.tripService.loading$.subscribe(loading => this.loading = loading);
  }

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

  deleteTrip(id: string) {
    if (confirm('Are you sure you want to delete this trip?')) {
      this.tripExpenseService.deleteExpensesByTrip(id);
      this.tripService.deleteTrip(id);
    }
  }
}
