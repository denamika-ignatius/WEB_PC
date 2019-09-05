import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule, Router } from '@angular/router';
import { AnalysisComponent } from './analysis.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderModule } from '../header/header.module';
import { FooterModule } from '../footer/footer.module'
import { CoreModule } from '../core/core.module';
import {  
  DxButtonModule, 
  DxFormModule,
  DxTabsModule,
  DxDateBoxModule,
  DxDataGridModule,
  DxSelectBoxModule,
  DxChartModule,
  DxPivotGridModule,
} from "devextreme-angular";
export const ROUTES: Routes = [{ path: '', component: AnalysisComponent}];
@NgModule({
  declarations: [
    AnalysisComponent, 
    ],
  imports: [
    RouterModule.forChild(ROUTES),
    CommonModule,
    CoreModule,
    FlexLayoutModule,
    DxButtonModule,
    HeaderModule,
    FooterModule,
    DxFormModule,
    DxTabsModule,
    DxDateBoxModule,
    DxDataGridModule,
    DxSelectBoxModule,
    DxChartModule,
    DxPivotGridModule,
  ]
})
export class AnalysisModule { }
