import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule, Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { CoreModule } from '../core/core.module';

export const ROUTES: Routes = [{ path: '', component: LoginComponent}];

@NgModule({
  declarations: [LoginComponent],
  imports: [
    RouterModule.forChild(ROUTES),
    CoreModule,
    CommonModule,
    FormsModule
  ]
})
export class LoginModule { }
