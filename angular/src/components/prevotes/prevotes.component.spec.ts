import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevotesComponent } from './prevotes.component';

describe('PrevotesComponent', () => {
  let component: PrevotesComponent;
  let fixture: ComponentFixture<PrevotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrevotesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrevotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
