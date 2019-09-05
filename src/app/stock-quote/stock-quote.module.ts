import { NgModule } from '@angular/core';
import { CommonModule, formatPercent } from '@angular/common';
import { StockQuoteComponent } from './stock-quote.component';
import { FlexLayoutModule } from '@angular/flex-layout';
 

import {  
  DxButtonModule,
  DxDataGridModule, 
  DxSelectBoxModule,
  DxBoxModule,
  DxAutocompleteModule,
  DxTextBoxModule,
  DxTabsModule,
} from "devextreme-angular";

@NgModule({
  declarations: [StockQuoteComponent],
  exports:[
    StockQuoteComponent
  ],
  imports: [
    CommonModule,
    DxButtonModule,
    DxDataGridModule, 
    DxSelectBoxModule,
    DxBoxModule,
    FlexLayoutModule,
    DxAutocompleteModule, 
    DxTextBoxModule,
    DxTabsModule,
  ]
})
export class StockQuoteModule { }