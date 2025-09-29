import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WinddirComponent } from './winddir-component';

describe('WinddirComponent', () => {
  let component: WinddirComponent;
  let fixture: ComponentFixture<WinddirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WinddirComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WinddirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
