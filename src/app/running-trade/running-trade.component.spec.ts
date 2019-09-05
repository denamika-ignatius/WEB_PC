import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RunningTradeComponent } from './running-trade.component';

describe('RunningTradeComponent', () => {
  let component: RunningTradeComponent;
  let fixture: ComponentFixture<RunningTradeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RunningTradeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RunningTradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
