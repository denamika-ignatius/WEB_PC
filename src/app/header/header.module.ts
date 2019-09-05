import { NgModule,ModuleWithProviders  } from '@angular/core';
import { HeaderComponent } from './header.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgMarqueeModule } from 'ng-marquee';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxNavBarModule } from 'devextreme-angular/ui/nav-bar';



import {  
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from "devextreme-angular";

@NgModule({
  declarations: [ HeaderComponent ],
  exports: [
    HeaderComponent
  ],
  imports:[
    DxButtonModule,
    FlexLayoutModule,
    DxNavBarModule,
    NgMarqueeModule,
    DxPopupModule,
    DxSelectBoxModule,
    CommonModule,
    FormsModule,
    DxTextBoxModule, 
  ]
})
export class HeaderModule { 
 
}
