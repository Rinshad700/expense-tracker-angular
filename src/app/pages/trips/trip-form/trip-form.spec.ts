import { TestBed } from '@angular/core/testing';
import { TripFormComponent } from './trip-form';

describe('TripFormComponent', () => {
  let component: TripFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripFormComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(TripFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
