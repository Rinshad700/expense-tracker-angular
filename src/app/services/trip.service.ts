import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Trip } from '../models/trip';

@Injectable({
  providedIn: 'root'
})
export class TripService {

  private storageKey = 'trips';
  private tripsSubject = new BehaviorSubject<Trip[]>(this.loadTrips());
  trips$ = this.tripsSubject.asObservable();

  private loadTrips(): Trip[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private save(trips: Trip[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(trips));
    this.tripsSubject.next(trips);
  }

  getTrips(): Trip[] {
    return this.tripsSubject.value;
  }

  getTrip(id: number): Trip | undefined {
    return this.tripsSubject.value.find(t => t.id === id);
  }

  getActiveTrips(): Trip[] {
    return this.tripsSubject.value.filter(t => t.status === 'ongoing' || t.status === 'planned');
  }

  addTrip(trip: Omit<Trip, 'id' | 'createdAt'>): Trip {
    const newTrip: Trip = {
      ...trip,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    const trips = [...this.tripsSubject.value, newTrip];
    this.save(trips);
    return newTrip;
  }

  updateTrip(updated: Trip) {
    const trips = this.tripsSubject.value.map(t =>
      t.id === updated.id ? updated : t
    );
    this.save(trips);
  }

  deleteTrip(id: number) {
    const trips = this.tripsSubject.value.filter(t => t.id !== id);
    this.save(trips);
  }
}
