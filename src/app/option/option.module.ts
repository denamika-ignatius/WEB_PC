import { NgModule } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { Routes, RouterModule, Router } from '@angular/router';
import { OptionComponent } from './option.component'; 
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderModule } from '../header/header.module';
import { FooterModule } from '../footer/footer.module'
import { CoreModule } from '../core/core.module';
import {  
  DxButtonModule, 
  DxPopupModule,
  DxTextBoxModule,
  DxTabsModule, 
  DxDataGridModule,
  DxListModule,
  DxSelectBoxModule,
  DxTooltipModule,
  DxCheckBoxModule,
} from "devextreme-angular";
export const ROUTES: Routes = [{ path: '', component: OptionComponent}];
@NgModule({
  declarations: [
    OptionComponent, 
    ],
  imports: [
    RouterModule.forChild(ROUTES),
    CommonModule,
    CoreModule,
    FlexLayoutModule,
    DxButtonModule,
    HeaderModule,
    FooterModule,
    DxPopupModule,
    DxTextBoxModule,
    DxTabsModule, 
    DxDataGridModule,
    DxListModule,
    DxSelectBoxModule,
    DxTooltipModule,
    DxCheckBoxModule,
  ]
})
export class OptionModule { }
