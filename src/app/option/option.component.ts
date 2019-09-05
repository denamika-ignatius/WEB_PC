import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import { Router } from '@angular/router';
import { global } from '../global'; 
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';

import { alert,confirm } from 'devextreme/ui/dialog'; 

@Component({
  selector: 'app-option',
  templateUrl: './option.component.html',
  styleUrls: ['./option.component.scss']
})
export class OptionComponent implements OnInit {

  tabs = [
    { text: "Change Password", display: "Change Password", icon: "user", url: "/assets/icons/Personal2.png", act:"/assets/icons/Personal.png" },
    { text: "Change PIN", display: "Change PIN", icon: "comment", url: "/assets/icons/Sector2.png", act:"/assets/icons/Sector.png" },
  ];
  selectTab = "Change Password";

  input ={
    userId:'',
    isVisible_PWD:false,
    isVisible_PIN:false,
    oldPassword:"",
    newPassword:"",
    confirmPassword:"",
    oldPIN:"",
    newPIN:"",
    confirmPIN:"",
  }

  constructor(
    private router: Router,
    private socket:Socket,
    public global:global,
  ) { }


  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);
    messageCenter.addRespone('view301', (obj)=>{
      if(obj['ResultFlag']=='1'){
        // alert("Success", "Change Password");
        this.input.oldPassword="";
        this.input.newPassword="";
        this.input.confirmPassword="";
      }
      else{
        var reasonInfo;
        if(obj['ResultFlag']=='2') reasonInfo = 'Failed Other Reason';
        else if(obj['ResultFlag']=='3') reasonInfo = 'Min Length problem';
        else if(obj['ResultFlag']=='4') reasonInfo = 'Password History problem';
        else if(obj['ResultFlag']=='5') reasonInfo = 'Password Complexity problem';
        else if(obj['ResultFlag']=='6') reasonInfo = 'Password same as user id';
        else if(obj['ResultFlag']=='7') reasonInfo = 'Password not allowed';
        else reasonInfo = 'Failed Other Reason';
        
        // alert(reasonInfo, "Failed Change Password"); 
      }
    });
    messageCenter.addRespone('view311', (obj)=>{ 
      if(obj['ResultFlag']=='1'){

        // alert("Success", "Change PIN"); 
        this.input.oldPIN="";
        this.input.newPIN="";
        this.input.confirmPIN="";
      }
      else{
        var reasonInfo;
        if(obj['ResultFlag']=='2') reasonInfo = 'Failed';
        else if(obj['ResultFlag']=='3') reasonInfo = 'Min Length problem';
        else if(obj['ResultFlag']=='4') reasonInfo = 'PIN History problem';
        else if(obj['ResultFlag']=='5') reasonInfo = 'PIN Complexity problem';
        else if(obj['ResultFlag']=='6') reasonInfo = 'PIN same as user id';
        else if(obj['ResultFlag']=='7') reasonInfo = 'PIN not allowed';
        else reasonInfo = 'Failed Other Reason';
        
        // alert(reasonInfo, "Failed Change PIN");  
      }
  });
  
    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);
    this.input.userId=this.socket.username;
  }
  ngOnDestroy(){
 
    messageCenter.delRespone('view301');
    messageCenter.delRespone('view311');
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]); 
 

  }
  changePWD(){

    this.input.oldPassword="",
    this.input.newPassword="",
    this.input.confirmPassword="",
    this.input.isVisible_PWD=true;
  }
  onShownPWD(e){

  }
  sendChangePassword(){
    if(this.input.newPassword.length<8){
      alert("New Password Length Minimum 8 character", "Error"); 
       
	  }else if(this.input.newPassword==this.input.confirmPassword) {
      this.socket.requestView301(this.socket.username,this.input.oldPassword,this.input.newPassword);
      
    } else{
      alert("New Password and Confirm Password is not same", "Error"); 
       
    }
  }

  changePIN(){
    this.input.oldPIN="",
    this.input.newPIN="",
    this.input.confirmPIN="",
    this.input.isVisible_PIN=true;
  }
  onShownPIN(e){

  }
  sendChangePIN(){
    if(this.input.newPIN.length<8){
      alert("New PIN Length Minimum 8 character", "Error"); 
       
	  }else if(this.input.newPIN==this.input.confirmPIN) {
      this.socket.requestView311(this.input.oldPIN,this.input.newPIN);
      
    } else{
      alert("New PIN and Confirm PIN is not same", "Error"); 
       
    }
  }

  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text;
  }
  enterOldPassword(e){

    const inputPassOld :any = document.querySelector('input[name=newPassword');
    inputPassOld.focus();
  }
  enterNewPassword(e){

    const inputPassNew :any = document.querySelector('input[name=confirmPassword');
    inputPassNew.focus();
  }

  enterOldPin(e){
    const inputPinOld :any = document.querySelector('input[name=newPIN');
    inputPinOld.focus();
  }
  enterNewPin(e){
    const inputPinNew :any = document.querySelector('input[name=confirmPIN');
    inputPinNew.focus();
  }

}
