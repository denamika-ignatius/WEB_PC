import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RunningTradeComponent } from './running-trade.component';
import {   
  DxDataGridModule,  
} from "devextreme-angular";
@NgModule({
  declarations: [ RunningTradeComponent ],
  exports: [
    RunningTradeComponent
  ],
  imports: [
    CommonModule,
    DxDataGridModule
  ]
})
export class RunningTradeModule { }
