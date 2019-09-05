import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { MarketInfoComponent } from './market-info.component';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderModule } from '../header/header.module'; 
import { FooterModule } from '../footer/footer.module'
import { RunningTradeModule } from '../running-trade/running-trade.module'
import { StockQuoteModule } from '../stock-quote/stock-quote.module'
import { CoreModule } from '../core/core.module';
import {  
  DxButtonModule,
  DxDataGridModule, 
  DxSelectBoxModule,
  DxBoxModule,
} from "devextreme-angular";

export const ROUTES: Routes = [{ path: '', component: MarketInfoComponent}];

@NgModule({
  declarations: [ 
    MarketInfoComponent, 
  ],
  imports: [
    RouterModule.forChild(ROUTES),
    CommonModule,
    CoreModule,
    FlexLayoutModule,
    HeaderModule,
    FooterModule,
    RunningTradeModule,
    StockQuoteModule,
    DxButtonModule, 
    DxDataGridModule,
    DxSelectBoxModule,
    DxBoxModule,
  ],
  providers:[  
  ]

})
export class MarketInfoModule { }
