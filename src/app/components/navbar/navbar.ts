import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {

  navItems = [
    { path: '/', icon: 'bi-speedometer2', label: 'Dashboard', exact: true },
    { path: '/transactions', icon: 'bi-cash-stack', label: 'Expenses', exact: false },
    { path: '/trips', icon: 'bi-map', label: 'Trips', exact: false },
    { path: '/reports', icon: 'bi-bar-chart-line', label: 'Reports', exact: false },
    { path: '/settings', icon: 'bi-gear', label: 'Settings', exact: false },
  ];

}
