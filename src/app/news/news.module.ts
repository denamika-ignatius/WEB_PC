import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NewsComponent } from './news.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderModule } from '../header/header.module'; 
import { FooterModule } from '../footer/footer.module'
import { CoreModule } from '../core/core.module';
import {  
  DxButtonModule,
  DxTabsModule,
  DxDataGridModule,
  DxPopupModule,
} from "devextreme-angular";
export const ROUTES: Routes = [{ path: '', component: NewsComponent}];

@NgModule({
  declarations: [NewsComponent],
  imports: [
    RouterModule.forChild(ROUTES),
    CommonModule,
    CoreModule,
    FlexLayoutModule,
    HeaderModule,
    FooterModule,
    DxButtonModule,
    DxTabsModule,
    DxDataGridModule,
    DxPopupModule,
  ]
})
export class NewsModule { }
