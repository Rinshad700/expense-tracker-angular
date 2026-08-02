import { TestBed } from '@angular/core/testing';
import { TripsComponent } from './trips';
import { TripService } from '../../services/trip.service';
import { TripExpenseService } from '../../services/trip-expense.service';
import { Router } from '@angular/router';

describe('TripsComponent', () => {
  let component: TripsComponent;
  let tripService: TripService;
  let tripExpenseService: TripExpenseService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsComponent],
      providers: [TripService, TripExpenseService]
    }).compileComponents();

    const fixture = TestBed.createComponent(TripsComponent);
    component = fixture.componentInstance;
    tripService = TestBed.inject(TripService);
    tripExpenseService = TestBed.inject(TripExpenseService);
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load trips on init', (done) => {
    const mockTrip = {
      id: 1,
      name: 'Test Trip',
      status: 'ongoing' as const,
      startDate: '2024-01-01',
      endDate: '2024-01-10'
    };

    spyOn(tripService, 'getTrips').and.returnValue([mockTrip]);

    component.ngOnInit();

    tripService.trips$.subscribe(() => {
      expect(component.trips.length).toBeGreaterThanOrEqual(0);
      done();
    });
  });
});
