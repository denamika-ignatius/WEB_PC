import { BrowserModule,Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core'; 
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component'; 
import { FlexLayoutModule } from '@angular/flex-layout';  
import { CoreModule } from './core/core.module';


import {  
  DxButtonModule, 
  DxLoadPanelModule,
  DxPopupModule,
  DxFormModule,
  DxSelectBoxModule,
  DxRadioGroupModule,
  DxDateBoxModule,
  DxDataGridModule,
  DxTextBoxModule,
  DxCheckBoxModule,
  
} from "devextreme-angular";

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    FlexLayoutModule,
    DxButtonModule, 
    CoreModule.forRoot(),
    DxLoadPanelModule,
    DxPopupModule,
    DxFormModule,
    DxSelectBoxModule,
    DxRadioGroupModule,
    DxDateBoxModule,
    DxDataGridModule,
    DxTextBoxModule,
    DxCheckBoxModule,
  ],
  providers: [ 
    Title
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
