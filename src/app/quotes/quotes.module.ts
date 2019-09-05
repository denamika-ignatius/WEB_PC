import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { Routes, RouterModule, Router } from '@angular/router';
import { QuotesComponent } from './quotes.component'; 
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderModule } from '../header/header.module';
import { FooterModule } from '../footer/footer.module'
import { CoreModule } from '../core/core.module';
import {  
  DxButtonModule,  
  DxTabsModule, 
  DxDataGridModule,
  DxPopupModule,
  DxListModule,
  DxSelectBoxModule,
  DxTooltipModule,
  DxCheckBoxModule,
} from "devextreme-angular";
export const ROUTES: Routes = [{ path: '', component: QuotesComponent}];
@NgModule({
  declarations: [
    QuotesComponent, 
    ],
  imports: [
    RouterModule.forChild(ROUTES),
    CoreModule,
    CommonModule,
    FlexLayoutModule,
    DxButtonModule,
    HeaderModule,
    FooterModule,
    DxButtonModule,  
    DxTabsModule, 
    DxDataGridModule,
    DxPopupModule, 
    DxListModule,
    DxSelectBoxModule,
    DxTooltipModule,
    DxCheckBoxModule,
  ],
  providers:[  
  ]
})
export class QuotesModule { }
