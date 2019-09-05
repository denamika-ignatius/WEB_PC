import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as messageCenter from '../messageCenter';
import { Socket } from '../socket'; 
import { isNull } from 'util';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  input={
    username:"",
    password:"",
    // username:"DEVELTRUS",
    // password:"123456",
    rememberMe:false
  }
  constructor(
    public router: Router, 
    private socket: Socket 
  ) { }

  ngOnInit() {
    let temp = localStorage.getItem('Login-rememberMe');
    if(!isNull(temp)){
      let tempData = JSON.parse(localStorage.getItem('Login-data'));
      if(!isNull(tempData)){
        this.input.username=tempData['username'];
        this.input.password=tempData['password'];
      }
      this.input.rememberMe=true;
    }
    messageCenter.addRespone('checkSocketStatusRespon', (obj)=>{
      let result = obj.toString();
      if(result=="Open") messageCenter.runCallback('setPage', "Reconnect"); 
    });  
    messageCenter.runCallback('infoPage', "LoginPage");
  }

  ngOnDestroy(){
    messageCenter.delRespone('checkSocketStatusRespon');
  }

  ngAfterViewInit(){
    messageCenter.runCallback('checkSocketStatus', ""); 
  }

  login_click(){
    let loginInfo = {
      username:this.input.username,
      password:this.input.password
    };
    messageCenter.runCallback('LoginMsg', loginInfo);
    if(this.input.rememberMe){
      localStorage.setItem('Login-data',JSON.stringify(loginInfo));
      localStorage.setItem('Login-rememberMe',"true");
    }
    else{
      localStorage.removeItem('Login-data');
      localStorage.removeItem('Login-rememberMe');
    }

    // this.router.navigate(['/market_info']);

  }
  updateUsername(e){
    this.input.username = this.input.username.toUpperCase();
  }
  
  updatePassword(e){
  }
  handleClickRememberme(e){

    let loginInfo = {
      username:this.input.username,
      password:this.input.password
    };
    if(!this.input.rememberMe){
      localStorage.setItem('Login-data',JSON.stringify(loginInfo));
      localStorage.setItem('Login-rememberMe',"true");
    }
    else{
      localStorage.removeItem('Login-data');
      localStorage.removeItem('Login-rememberMe');
    }
  }
  enterUsername(e){
    const inputPass: any = document.querySelector('input[name=password]');
    inputPass.focus();
  }
  enterPassword(e){
    // const inputPass: any = document.querySelector('input[name=password]');
    // inputPass.focus();
    this.login_click();
  }
}
