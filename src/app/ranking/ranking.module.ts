import { NgModule, } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { Routes, RouterModule, Router } from '@angular/router'; 
import { RankingComponent } from './ranking.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderModule } from '../header/header.module';
import { FooterModule } from '../footer/footer.module'
import { CoreModule } from '../core/core.module';
import { 
  DxButtonModule, 
  DxTabsModule,
  DxFormModule,
  DxRadioGroupModule,
  DxDataGridModule,
  DxTextBoxModule,
} from "devextreme-angular";


export const ROUTES: Routes = [{ path: '', component: RankingComponent}];
@NgModule({
  declarations: [RankingComponent],
  imports: [
    RouterModule.forChild(ROUTES),
    CoreModule,
    CommonModule,
    FlexLayoutModule,
    DxButtonModule,
    HeaderModule,
    FooterModule,
    DxTabsModule,
    DxFormModule,
    DxRadioGroupModule,
    DxDataGridModule,
    DxTextBoxModule,
  ],
  providers:[  
  ]
})
export class RankingModule { }
