import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerSummaryComponent } from './broker-summary.component';

describe('BrokerSummaryComponent', () => {
  let component: BrokerSummaryComponent;
  let fixture: ComponentFixture<BrokerSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrokerSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrokerSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
