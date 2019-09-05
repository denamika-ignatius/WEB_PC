import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule, Router } from '@angular/router';
import { MyAccountComponent } from './my-account.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderModule } from '../header/header.module';
import { FooterModule } from '../footer/footer.module'
import { CoreModule } from '../core/core.module';
import {  
  DxButtonModule, 
  DxTabsModule,
  DxDataGridModule,
  DxSelectBoxModule,
  DxFormModule,
  DxDateBoxModule,
  DxTextBoxModule
} from "devextreme-angular";
export const ROUTES: Routes = [{ path: '', component: MyAccountComponent}];
@NgModule({
  declarations: [
    MyAccountComponent, 
    ],
  imports: [
    RouterModule.forChild(ROUTES),
    CommonModule,
    CoreModule,
    FlexLayoutModule,
    DxButtonModule,
    HeaderModule,
    FooterModule,
    DxTabsModule,
    DxDataGridModule,
    DxSelectBoxModule,
    DxFormModule,
    DxDateBoxModule,
    DxTextBoxModule
  ]
})
export class MyAccountModule { }
