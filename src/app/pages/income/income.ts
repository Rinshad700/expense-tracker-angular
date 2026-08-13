import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { Income } from '../../models/income';
import { IncomeService } from '../../services/income.service';

function currentMonth(): string {
  return new Date().toISOString().substring(0, 7);
}

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './income.html',
  styleUrl: './income.css'
})
export class IncomeComponent {

  private service = inject(IncomeService);
  private router = inject(Router);

  // Reading the service's signals directly (rather than copying into plain
  // fields via .subscribe()) is what lets Angular's zoneless change
  // detection track and safely coalesce these updates on its own.
  income = this.service.income;
  loading = this.service.loading;

  isEditing = false;
  showForm = false;

  entry: Income = {
    id: '',
    amount: 0,
    month: currentMonth(),
    note: ''
  };

  save(form: NgForm): void {

    if (!form.valid) {
      return;
    }

    if (this.isEditing) {

      this.service.updateIncome({ ...this.entry });

    } else {

      this.service.addIncome({ ...this.entry });

    }

    this.resetForm(form);

    this.showForm = false;

  }

  edit(entry: Income): void {

    this.entry = { ...entry };

    this.isEditing = true;

    this.showForm = true;

  }

  toggleForm(): void {

    this.showForm = !this.showForm;

    if (!this.showForm) {
      this.resetForm();
    }

  }

  resetForm(form?: NgForm): void {

    this.entry = {
      id: '',
      amount: 0,
      month: currentMonth(),
      note: ''
    };

    this.isEditing = false;

    form?.resetForm({
      id: '',
      amount: 0,
      month: currentMonth(),
      note: ''
    });

  }

  delete(id: string): void {

    if (confirm('Delete this income entry?')) {

      this.service.deleteIncome(id);

    }

  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

}
