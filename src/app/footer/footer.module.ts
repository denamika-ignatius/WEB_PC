import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FooterComponent} from './footer.component';
import { NgMarqueeModule } from 'ng-marquee';
import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
  declarations: [FooterComponent],
  exports: [
    FooterComponent,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    NgMarqueeModule,
    
  ]
})
export class FooterModule { }
