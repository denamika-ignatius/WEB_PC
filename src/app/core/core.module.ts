import { NgModule,ModuleWithProviders  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Socket } from '../socket';
import { global } from '../global';

@NgModule({

})
export class CoreModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [ 
        Socket,
        global
       ]
    }
  }
}
