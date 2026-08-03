import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TripService } from '../../../services/trip.service';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-form.html',
  styleUrls: ['./trip-form.css']
})
export class TripFormComponent {
  formData = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: undefined as number | undefined,
    status: 'planned' as const,
    location: '',
    participantsText: ''
  };

  submitted = false;

  constructor(
    private tripService: TripService,
    private router: Router
  ) {}

  submitForm() {
    if (!this.formData.name || !this.formData.startDate || !this.formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    const participants = this.formData.participantsText
      .split(',')
      .map(name => name.trim())
      .filter(Boolean);

    this.tripService.addTrip({
      ...this.formData,
      participants
    });
    this.router.navigate(['/trips']);
  }

  cancel() {
    this.router.navigate(['/trips']);
  }
}
