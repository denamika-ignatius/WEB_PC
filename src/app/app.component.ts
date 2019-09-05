import { Component, OnInit } from '@angular/core';
import * as messageCenter from './messageCenter';
import { Socket } from './socket';
import { Router } from '@angular/router';
import { global } from './global';
import * as tools from './tools';
import {enableProdMode} from '@angular/core'; 
import { Title }     from '@angular/platform-browser';
// import { DxFormComponent } from 'devextreme-angular';
import TextBox from 'devextreme/ui/text_box';
import { alert,confirm } from 'devextreme/ui/dialog'; 
import hotkeys from 'hotkeys-js';

enableProdMode();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // @ViewChild(DxFormComponent,null) form:DxFormComponent
  title = 'WEB PC'; 
  version = '0.0.01';

	composite: any = [];
	rawComposite: any = [];
	compositeDisplay: any = [];
	isChangeData = false;
  updateThread;
  runningText = "Running Text";
  checkSocketThread;
  isLoadPanelVisible = false;
  input={
    pin:"",
    isVisible_PIN:false,
    pageTo:"",
    buyselltitle:"buy",
    isVisible_buysell:false,
    board:"RG",
    code:"",
    account:"",
    accountType:"R",
    isVisible_orderStatus:false,
    startDate:new Date(),
    endDate:this.global.getNextWeekDate(), 
    price:"",
    quantity:"",
    value: 0,
    tif:"0",
    session:"Day", 
    split:"Split",
    splitInput:"1",
    randomFrom:" ",
    randomTo:" ",
    isVisible_SplitRandom:true,
    isVisible_SplitInput:false,
    isVisible_orderHistory:false,
    isVisible_orderAmend:false,
    newPrice:"",
    newVol:0,
    confirmation:false,
    accountName:'',

    isVisible_PWD:false,
    isVisible_CPIN:false,
    oldPassword:"",
    newPassword:"",
    confirmPassword:"",
    oldPIN:"",
    newPIN:"",
    confirmPIN:"",
    isVisible_Option:false,
  } 
  minDate = new Date(2000, 0, 1);
  maxDate = new Date(2029, 11, 31);
  boardList = ["RG", "TN" ]
  dsStockList;
  dsStockOnlyList;
  dsSession = ["Day","Session"];
  dsSplitRandom = ["Split"];
  dsAccountList;
  threadTimeoutLogin;
  data={
    data1:{},
    data2:{},
    data431:{},
    data434:{},
    data494:{},
    data443:{},
    data444:{},
    dataAmend:{},
    orderAmmount:0,
    remainingLimit:0,
    tradingRatio:0,
    remainingLimitSell:0,
    tradingRatioSell:0,
    availableQty:0
  };
  orderHistoryData;

  ngOnInit() {
    this.titleService.setTitle(this.title + " - " + this.version);
  }
  ngAfterViewInit() {
     
  }
  ngAfterViewChecked() {

  }

  constructor(
    private socket: Socket,
    private router: Router,
    private global: global,
    private titleService: Title
  ){    
    hotkeys('f2', (event) => {
      // Prevent the default refresh event under WINDOWS system
      event.preventDefault() 
      if(this.socket.username!="")
      {
        if(!this.global.getIsLoginPIN()){ 
          this.input.isVisible_PIN=true;
        }
        else{
          this.openPopup("buy");
        }
      }
    });

    hotkeys('f4', (event) => {
      // Prevent the default refresh event under WINDOWS system
      event.preventDefault()  
      if(this.socket.username!="")
      {
    
        if(!this.global.getIsLoginPIN()){ 
          this.input.isVisible_PIN=true;
        }
        else{
          this.openPopup("sell");
        }
      }

    });
    messageCenter.addRespone('LoginMsg', (obj)=>{

      this.isLoadPanelVisible = true;
      if(this.socket.isOpen) this.socket.stop();
      socket.username = obj['username'];
      socket.password = obj['password'];
      this.socket.isLB = true; 
      this.socket.start("ConnectToLb");
      this.threadTimeoutLogin = setTimeout(()=>{ this.timeoutLogin()},30000);

    });

    messageCenter.addRespone('viewLoginToLB', (obj)=>{

      if(obj["ResponseFlag"]=="0")
      {
        this.isLoadPanelVisible = false;
        if( obj['FailedLoginReasonFlag']=='A' ){
          alert("Failed server (No Server ready)","Login Error");
        }
        else if( obj['FailedLoginReasonFlag']=='C') {
            alert("Already connected","Login Error"); 
        }
        else if( obj['FailedLoginReasonFlag']=='D') {
            alert("Not allow to connect","Login Error"); 
        }
        else if( obj['FailedLoginReasonFlag']=='E') {
            alert("Please try again","Login Error");
            
        }
        else if( obj['FailedLoginReasonFlag']=='F'||
            obj['FailedLoginReasonFlag']=='J'){
            alert("Wrong Client Version","Login Error");  
        }
        else if( obj['FailedLoginReasonFlag']=='F') {
            alert("Invalid client version","Login Error"); 
        }
        else if( obj['FailedLoginReasonFlag']=='G') {
            alert("Server in maintenance","Login Error"); 
        }
        else if( obj['FailedLoginReasonFlag']=='H') {
            alert("Unregistered ip address","Login Error"); 
        }
        else if( obj['FailedLoginReasonFlag']=='I') {
            alert("User id is locked","Login Error"); 
        }
        else if( obj['FailedLoginReasonFlag']=='K' ){
          alert("Max Retry, User id is locked","Login Error");
        } 
        else 
        {
          alert("Wrong Username and Password","Login Error");
        }
      }
    }); 
    messageCenter.addRespone('viewLoginToServer', (obj)=>{

      if(obj['ResponseFlag']==1) {
        if(obj['NoAccount']>0) {
          // this.global.setAccountList(obj['ArrayNoAccount']);
          this.global.setSelectedAccount(obj['ArrayNoAccount'][0]);
        }
        else {
          // this.global.setAccountList([]);
          this.global.setSelectedAccount("");
        } 
        // this.setButtonReconnect(); 
        // let lastPage = localStorage.getItem("lastPage"); 
        // if(lastPage && lastPage != "LoginPage"){ 
        //   this.global.changeMenu(lastPage);
        // }else{
        //   this.global.changeMenu('HomePage');
        // } 
        
        // messageCenter.runCallback('reconnectTrigger', "Recconnect");
      }
      else if(obj['ResponseFlag']=='A' ||obj['ResponseFlag']=='B') {
        this.input.isVisible_PWD = true;
        if(obj['NoAccount']>0) {
          this.global.setAccountList(obj['ArrayNoAccount']);
          this.global.setSelectedAccount(obj['ArrayNoAccount'][0]);
        }
        else {
          // this.global.setAccountList([]);
          this.global.setSelectedAccount("");
        }
        //let modal = this.modalCtrl.create('ChangePassword',{Socket:this.socket, Global:this.global, Title:obj['ResponseFlag']=='A'?"First Time Login":"Password Expired"});
        //modal.present();

        // modal.onWillDismiss((data: any[]) => {
        //   if (data['result']=='1') {
        //     //this.global.isReconnectAble = true;
        //     this.global.changeMenu('HomePage');
        //   }
        //   else {
        //     this.global.isReconnectAble = false;
        //     this.socket.stop();

        //   }
        // });
      } 
      // this.router.navigate(['/marketInfo']);
      // this.router.navigate(['/option']);
    }); 
    messageCenter.addRespone('view701', (obj)=>{

      this.global.setAccountList(obj['ArrayNoAccount']);
    });
    messageCenter.addRespone('infoPage', (obj)=>{
      let info = obj.toString(); 
    }); 

    messageCenter.addRespone('loginProgress', (obj)=>{
       let tempData = obj.toString(); 
      if(tempData=="Broker Data") {
        if(this.threadTimeoutLogin) clearTimeout(this.threadTimeoutLogin);
        this.isLoadPanelVisible = false;
        this.router.navigate(['/marketInfo']);
        // this.router.navigate(['/quotes']);
      }
    }); 
    // messageCenter.addRespone('setPage', (obj)=>{
    //   this.openPage(obj);
    // });
    messageCenter.addRespone('view1a', (obj)=>{

      if(obj['ProductCode']==this.input.code && obj['BoardCode']==this.input.board)
      {
        if(this.input.buyselltitle == "BUY"){
          this.input.price = obj['BestBidPrice'];
        }
        else{
          this.input.price = obj['BestOfferPrice'];
        }
        this.data.data1 = obj;
      }
      
    });

    messageCenter.addRespone('view2a', (obj)=>{

      if(obj['ProductCode']==this.input.code && obj['BoardCode']==this.input.board)
      { 
        this.generateOrderBookData(obj); 
      }
      
    });
    messageCenter.addRespone('autoUpdate3a', (obj)=>{ 
      if(obj['ProductCode']==this.input.code && obj['BoardCode']==this.input.board)
      { 
        setTimeout(() => {this.generateOrderBookData(obj) ;}, 1000); 
      }
    }); 
    messageCenter.addRespone('view90', (obj)=>{
      let msg = "";
      msg += "Order : "+obj['BuySell']+"<br>";
      msg += "Code : "+obj['ProductCode']+"<br>";
      msg += "JSX ID : "+obj['OrderNo']+"<br>";
      msg += "Price : "+obj['Price']+"<br>";
      msg += "Open : "+obj['OVolume']+"<br>";
      msg += "Remain : "+obj['RVolume']+"<br>";
      msg += "Traded : "+obj['TVolume']+"<br>";
      msg += "Status : "+this.global.getOrderTrackingStatusName(obj['Status'])+"<br>";
      msg += "Q Vol : "+obj['EstPriceQueueVolumes']+"<br>";
      msg += "Q Orders : "+obj['EstPriceQueueOrders']+"<br>";
      

      alert(msg, "Order Tracking");
    });
    messageCenter.addRespone('view323', (obj)=>{

      if(obj['ResultFlag']=="Y") { 
        this.global.setPINValue(this.input.pin);
        this.input.pin="";
        this.global.setIsLoginPIN(true);
        this.input.isVisible_PIN=false;
        if(this.input.pageTo=="my account"){
          this.router.navigate(['/myAccount']);
        }
        else{
          this.openPopup(this.input.pageTo);
        }
      }
      else{
        let msg = "";
        if(obj['ResultFlag']=="Z"){
          msg = "Max Retry input PIN, PIN Locked";
        }
        else if(obj['ResultFlag']=="X"){
          msg = "PIN Expired, please change PIN first!";
          this.input.isVisible_CPIN = true;
        }
        else {
          msg = "Wrong PIN";
        }
        
        alert(msg, "PIN");
        this.input.pin="";
      }
      // this.global.setIsLoginPIN(this.isLoginPIN);
      // if(this.fromPinPage!="" && this.isLoginPIN){
      //     localStorage.setItem("lastPage",this.fromPinPage);
      //     this.nav.setRoot(this.fromPinPage,{code:this.toTradeCode,board:this.toTradeBoard});
      //     this.fromPinPage="";
      // } else{
      //     if(obj['ResultFlag']=="X"){
      //       this.nav.setRoot("ChangePinPage");
      //     }else{
      //       this.cekPINPage();
      //     }
      // }
    });
    messageCenter.addRespone('view443', (obj)=>{

      this.data.data443=obj['NoRecordArray'];
    });
    messageCenter.addRespone('view444', (obj)=>{

      this.data.data444=obj['NoRecordArray'];
    });
    messageCenter.addRespone('view494a', (obj)=>{

      let item = obj;
      item['StockValuationRatioDisplay']=item['StockValuationRatio']*100;
      this.data.data494 = item;
    });

    messageCenter.addRespone('view434a', (obj)=>{ 

      this.data.data434=obj; 
      
      for(let i =0;i<obj['NoProductArray'].length;i++){
        let item = obj['NoProductArray'][i];
        if(item['Product']==this.input.code) {
          this.data.availableQty=item['BalanceVolume']/100;
          break;
        }
      }
    }); 
    messageCenter.addRespone('view431a', (obj)=>{ 

      this.data.data431=obj; 
      let orderStatusPending = 0;
      for(let i =0;i<obj['NoOrdersArray'].length;i++){
        let item = obj['NoOrdersArray'][i];
        if(item['Product']==this.input.code) {
          if(item['OrderStatus']== "P" || item['OrderStatus']== "0" || item['OrderStatus']== "1"){
            orderStatusPending = orderStatusPending + 1;
          }
        }
      }
      this.data.availableQty = this.data.availableQty - orderStatusPending ;
   }); 
   messageCenter.addRespone('view951a', (obj)=>{

    // alert(obj.toString(),"951");
    if(obj['SuccessFlag']=="N"){
      alert(obj['Text'].toString(),"New Order");
    }
    else{
      alert("Success send order","New Order");
      this.input.isVisible_buysell=false;
    }
    this.requestOrderStatusData();
  });
  messageCenter.addRespone('view952', (obj)=>{

    // alert(obj.toString(),"951");
    if(obj['SuccessFlag']=="N"){
      alert(obj['Text'].toString(),"Amend Order");
    }
    else{
      alert("Success send order","Amend Order");
      this.input.isVisible_orderAmend=false;
    }
    this.requestOrderStatusData();
  });
  messageCenter.addRespone('view953', (obj)=>{

    // alert(obj.toString(),"951");
    if(obj['SuccessFlag']=="N"){
      alert(obj['Text'].toString(),"Withdraw Order");
    }
    else{
      alert("Success withdraw order","Withdraw Order");

    }
    setTimeout(() => {this.requestOrderStatusData() ;}, 1000);
  });
    messageCenter.addRespone('checkSocketStatus', (obj)=>{
      if(this.socket.isOpen) messageCenter.runCallback('checkSocketStatusRespon', "Open");
      else messageCenter.runCallback('checkSocketStatusRespon', "Close");;
    }); 
    messageCenter.addRespone('x', (obj)=>{
      
      // if(obj.toString()=="option") {
      //   this.showOption();
      // }
      // else{
          
        if(!this.global.getIsLoginPIN()){
          this.input.pageTo=obj.toString();
          this.input.isVisible_PIN=true;
        }
        else{
          this.openPopup(obj.toString());
        }
      // }
      
    }); 
    messageCenter.addRespone('view301', (obj)=>{

      if(obj['ResultFlag']=='1'){
        alert("Success", "Change Password");
      }
      else{
        var reasonInfo;
        if(obj['ResultFlag']=='2') reasonInfo = 'Wrong Password';
        else if(obj['ResultFlag']=='3') reasonInfo = 'Min Length problem';
        else if(obj['ResultFlag']=='4') reasonInfo = 'Password History problem';
        else if(obj['ResultFlag']=='5') reasonInfo = 'Password Complexity problem';
        else if(obj['ResultFlag']=='6') reasonInfo = 'Password same as user id';
        else if(obj['ResultFlag']=='7') reasonInfo = 'Password not allowed';
        else reasonInfo = 'Failed Other Reason';
        
        alert(reasonInfo, "Failed Change Password"); 
      }
    });
    messageCenter.addRespone('view311', (obj)=>{ 
      if(obj['ResultFlag']=='1'){

        alert("Success", "Change PIN"); 
 
      }
      else{
        var reasonInfo;
        if(obj['ResultFlag']=='2') reasonInfo = 'Wrong PIN';
        else if(obj['ResultFlag']=='3') reasonInfo = 'Min Length problem';
        else if(obj['ResultFlag']=='4') reasonInfo = 'PIN History problem';
        else if(obj['ResultFlag']=='5') reasonInfo = 'PIN Complexity problem';
        else if(obj['ResultFlag']=='6') reasonInfo = 'PIN same as user id';
        else if(obj['ResultFlag']=='7') reasonInfo = 'PIN not allowed';
        else reasonInfo = 'Failed Other Reason';
        
        alert(reasonInfo, "Failed Change PIN");  
      }
    });

    messageCenter.addRespone('forceKill', (obj)=>{
      this.eventLogout();
      alert(obj['KillMessage'], "Kill Message");  
    }); 

    this.data.data494['StockValuationRatioDisplay']=0;
    this.data.data494['LimitAvailable']=0;
    this.data.data494['LimitByRatio']=0;
 

    this.checkSocketThread = setInterval(()=>{ this.checkSocket(); }, 5000);
  } 
  openPopup(_input){

    this.dsAccountList=this.global.getAccountList();
    this.input.account = this.global.getSelectedAccount();
    this.dsStockList=this.global.getdsStockList();
    this.dsStockOnlyList = this.global.getdsStockOnlyList();

    if(_input.toString()=="buy"){
      this.input.price="";
      this.input.quantity=""; 
      this.input.splitInput="1";
      this.input.session="Day";
      this.input.split="Split";
      this.input.isVisible_SplitRandom=false;
      this.input.buyselltitle="BUY";
      this.input.isVisible_buysell=true;
    }
    else if(_input.toString()=="sell"){
      this.input.price="";
      this.input.quantity="";
      this.input.splitInput="1";
      this.input.session="Day";
      this.input.split="Split";
      this.input.isVisible_SplitRandom=false;
      this.input.buyselltitle="SELL";
      this.input.isVisible_buysell=true;
    }
    else if(_input.toString()=="order status"){ 
      this.input.isVisible_orderStatus=true;
    }
  }

  eventLogout(){
    this.input.isVisible_PIN=false; 
    this.input.isVisible_buysell=false; 
    this.input.isVisible_orderStatus=false; 
    this.input.isVisible_SplitRandom=true;
    this.input.isVisible_SplitInput=false;
    this.input.isVisible_orderHistory=false;
    this.input.isVisible_orderAmend=false; 
    this.input.isVisible_Option=false;
    this.global.setPINValue("");
    this.global.setIsLoginPIN(false);
    this.input.pin="";

    if(this.socket.isOpen) this.socket.stop();
    this.global.isReconnectAble = false;
    localStorage.removeItem("userRecon");
    localStorage.removeItem("passRecon");
    localStorage.removeItem("lastPage"); 
    this.router.navigate(['/login']);
  }  

  clickSelectMenu(_input){  
    // messageCenter.runCallback('setPage', "LoginPage");
    this.router.navigate([_input]);
  }
  clickLogout(){ 
    // messageCenter.runCallback('setPage', "LoginPage");
    this.eventLogout();
  }
  checkSocket(){
    if(!this.socket.isOpen) this.router.navigate(['/login']);
  }
  signinPIN(){  
    this.socket.requestView323(this.input.pin);
    
  }
  getBuySellClass(){
    if(this.input.buyselltitle =="BUY") return "g-background-red";
    else if( this.input.buyselltitle=="SELL") return "g-background-green";
    return "";
  }
  onShownPIN(e){
    // let tbElement = e.component.content().parentNode.querySelector(".dx-textbox");
        
    // if (tbElement) {
    //   let tbInstance = TextBox.getInstance(tbElement);
    //   // tbInstance.focus();
    // }
    
    const inputPIN: any = document.querySelector('input[name=inputPIN]');
    inputPIN.focus();

  }
  onShownOrderStatus(e){
    // let startDate:any = tools.trusDateFromDateTime(this.input.startDate);
    // let endDate:any = tools.trusDateFromDateTime(this.input.endDate);
    
    // this.socket.requestView431(this.input.account,startDate,endDate);

    this.requestOrderStatusData();

    
  }
  dateBox_valueChanged(e){
    this.requestOrderStatusData();
  } 

  timeoutLogin(){
    this.isLoadPanelVisible = false;
  }  
  onShownBuySell(e){
    this.requestBuySellDataFromServer();
  }
  initBuySellData(){
    this.data.availableQty=0;
  }
  requestBuySellDataFromServer(){
    this.initBuySellData();

    this.socket.requestView1(this.input.code,this.input.board);
    this.socket.requestView2(this.input.code,this.input.board,10);
    this.socket.requestAutoUpdate3(1,this.input.code,this.input.board);

    this.socket.requestView494(this.input.account,this.input.code,);
    if( this.input.buyselltitle=="SELL"){
      let startDate:any = tools.currentDate();
      let endDate:any = this.global.getNextWeekDate();
      this.socket.requestView434(this.input.account) ;
      this.socket.requestView431(this.input.account, startDate, endDate);

    }

  }
  onPriceValueChanged(e){

    this.calcOrderAmmount();
  }
  onQtyValueChanged(e){

    this.calcOrderAmmount();

  }
  calcOrderAmmount(){
    this.data.orderAmmount=parseFloat(this.input.price)*parseFloat(this.input.quantity)*100;
    this.data.remainingLimit=this.data.data494['LimitAvailable']-this.data.orderAmmount;
    this.data.tradingRatio=this.data.data494['CashAndPendingBuyIncFee']-(this.data.orderAmmount*(1+this.data.data494['FeeBuy']));
    this.input.value =parseFloat(this.input.price)*parseFloat(this.input.quantity)*100;
    if(this.data.tradingRatio>=0) this.data.tradingRatio=0;
    else{
      this.data.tradingRatio = this.data.tradingRatio/(this.data.data494['PortoValuatedAndPendingBuyValuated']+(this.data.orderAmmount*this.data.data494['StockValuationRatio']))*-100;
    }

    //Sell
    this.data.remainingLimitSell = this.data.data494['LimitAvailable']+(this.data.orderAmmount*(1-(this.data.data494['FeeBuy']+0.001)));
    this.data.tradingRatioSell=this.data.data494['CashAndPendingBuyIncFee']+(this.data.orderAmmount*(1-(this.data.data494['FeeBuy']+0.001)));
    if(this.data.tradingRatioSell>=0) this.data.tradingRatioSell=0;
    else{
      this.data.tradingRatioSell = this.data.tradingRatioSell/(this.data.data494['PortoValuatedAndPendingBuyValuated']-(this.data.orderAmmount*this.data.data494['StockValuationRatio']))*-100;
    }
    if(isNaN(this.data.orderAmmount))this.data.orderAmmount=0;
    if(isNaN(this.data.remainingLimit))this.data.remainingLimit=0;
    if(isNaN(this.data.tradingRatio))this.data.tradingRatio=0;
    if(isNaN(this.data.remainingLimitSell))this.data.remainingLimitSell=0;
    if(isNaN(this.data.tradingRatioSell))this.data.tradingRatioSell=0;
    if(this.input.code=="") this.data.availableQty=0;
  }
  account_onChange(e){
    this.global.setSelectedAccount(this.input.account);
    this.requestOrderStatusData();
    this.requestBuySellDataFromServer();
  }
  requestOrderStatusData(){
    let startDate:any = tools.trusDateFromDateTime(this.input.startDate);
    let endDate:any = tools.trusDateFromDateTime(this.input.endDate);
    
    this.socket.requestView431(this.input.account,startDate,endDate);    
  }

  sendOrder(_input){
    if(_input=="buy"){
      this.orderConfirmation();
    }
    else if(_input=="sell"){
      this.orderConfirmation();
    }
  }
  orderConfirmation(){
    
    let confirmationHTML = "Stock	:	"+this.input.code+"<br>";
    confirmationHTML += "Board	:	"+this.input.board+"<br>";
    confirmationHTML += "Price	:	"+this.global.numberFormat0(parseFloat(this.input.price),0)+"<br>";
    confirmationHTML += "Quantity	:	"+this.global.numberFormat0(parseFloat(this.input.quantity),0)+" lot(s)<br>";
    confirmationHTML += "This order will be split into "+this.input.splitInput+" orders<br>";
    confirmationHTML += "Order amount is "+this.global.numberFormat0(parseFloat(this.input.price)*parseFloat(this.input.quantity)*100,0)+" IDR<br>";
    confirmationHTML += "Account Code	:	"+this.input.account+"<br>";
    confirmationHTML += "Account Type	:	"+this.input.accountType+"<br>"; 
    let result = confirm(confirmationHTML, "Confirm Order");
    result.then((dialogResult) => {
        // alert(dialogResult ? "Confirmed" : "Canceled","Confirmation");
        if(dialogResult)
        {
          if(this.input.buyselltitle=="BUY") {
            this.sendingBuy();
          }
          else if(this.input.buyselltitle=="SELL") {
            this.sendingSell();
          }
        }
    });
  }
  sendingBuy(){

    this.socket.requestView951(this.input.account,this.input.code,this.input.board,"1",parseFloat(this.input.quantity)*100,this.input.price,this.input.tif,this.input.splitInput,this.input.isVisible_SplitRandom?"Y":"N",20,this.global.getPINValue());
  }
  sendingSell(){

    this.socket.requestView951(this.input.account,this.input.code,this.input.board,"2",parseFloat(this.input.quantity)*100,this.input.price,this.input.tif,this.input.splitInput,this.input.isVisible_SplitRandom?"Y":"N",20,this.global.getPINValue());
  }
 
  inputSplit_onChange(e){
    if(this.input.split=="Split") {
      this.input.isVisible_SplitInput = false;
      this.input.isVisible_SplitRandom = true;

    }
    else{
      this.input.isVisible_SplitInput = true;
      this.input.isVisible_SplitRandom = false;

    }
  }

  openTracking(e){

    this.socket.requestView90(e);
  }
  openHistory(e){ 

    this.orderHistoryData=e;
    
    this.socket.requestView443(e['OrderId']);
    this.socket.requestView444(e['OrderId']);
    this.input.isVisible_orderHistory = true;

  }
  statusName(status){
    if(status == 'T') return  'Successful';
    else if(status == 'P') return 'On Process';
    else if(status == 'C') return 'Cancelled';
    else if(status == 'R') return 'Rejected';
  }
  
  onShownOrderHistory(e){

  }
  isAllowAmmend(_input){
    if(_input=="P") return true;
    else if(_input=="0") return true;
    else if(_input=="1") return true;
    return false;
  }

  opeWithdraw(e){

    let confirmationHTML = "Order Type	:	"+this.global.getSideName(e.Side)+"<br>";
    confirmationHTML += "Stock	:	"+e.Product+"<br>";
    confirmationHTML += "Board	:	"+e.Board+"<br>";
    confirmationHTML += "Price	:	"+this.global.numberFormat0(parseFloat(e.Price),0)+" lot(s)<br>"; 
    confirmationHTML += "Volume	:	"+e.OrderVolume+"<br>";
    confirmationHTML += "Order Amount	:	"+this.global.numberFormat0(e.OrderVolume*e.Price,0)+"<br>";
    confirmationHTML += "Order Id	:	"+e.OrderId+"<br>";
    confirmationHTML += "Order Number	:	"+e.IdxOrderId+"<br>";
    confirmationHTML += "Account No	:	"+this.input.account+"<br>";
    let result = confirm(confirmationHTML, "Withdraw Confirmation");
    result.then((dialogResult) => {
        // alert(dialogResult ? "Confirmed" : "Canceled","Confirmation");
        if(dialogResult)
        {
          this.socket.requestView953(e.OrderId,this.input.account,e.Product,e.Board,e.Side,e.Price,e.IdxOrderId,e.Tif,this.global.getPINValue());
        }
    });
    

  }
  isAllowWithdraw(_input){
    if(_input=="P") return true;
    if(_input=="0") return true;
    if(_input=="1") return true;
    if(_input=="7") return true;
    return false;
  }
  openAmmend(e){ 
    this.data.dataAmend = e;
    this.input.code=e['Product'];
    this.input.board=e['Board'];
    this.socket.requestView2(e['Product'],e['Board'],20);
    this.input.newPrice = e.Price;
    this.input.newVol = parseFloat(e.OrderVolume)/100;

    this.global.getAccountList().store().byKey(this.global.getSelectedAccount()).then(dataitem=>{
      this.input.accountName =  dataitem.AccountName;
      
    });

    this.input.isVisible_orderAmend = true;
  } 

  doAmend(){
    if(parseInt(this.input.newVol.toString())>this.data.dataAmend['OrderVolume']/100)
    {
      alert("Error New Vol", "Error"); 
    }
    else{
      
      if(this.input.confirmation) {
        let confirmationHTML = "Order Type	:	"+this.data.dataAmend['Side']=='1'?'BUY':'SELL'+"<br>";
        confirmationHTML += "Stock	:	"+this.data.dataAmend['Product']+"<br>";
        confirmationHTML += "Board	:	"+this.data.dataAmend['Board']+"<br>";
        confirmationHTML += "New Price	:	"+this.global.numberFormat0(parseFloat(this.input.newPrice),0)+"<br>";
        confirmationHTML += "New Volume / Remain	:	"+this.input.newVol+" / "+this.data.dataAmend['RemainVolume']/100+"<br>";
        confirmationHTML += "New Order Amount"+this.global.numberFormat0(this.input.newVol*100*parseFloat(this.input.newPrice),0)+"<br>";
        confirmationHTML += "Order Id "+this.data.dataAmend['OrderId']+"<br>";
        confirmationHTML += "Order Number"+this.data.dataAmend['IdxOrderId']+"<br>";
        confirmationHTML += "Account No	:	"+this.global.getSelectedAccount()+"<br>";
        confirmationHTML += "Account Holder	:	"+this.input.accountName+"<br>";
        let result = confirm(confirmationHTML, "Confirm Amend");
        result.then((dialogResult) => { 
            if(dialogResult)
            {
              this.socket.requestView952(this.data.dataAmend['OrderId'],this.global.getSelectedAccount(),this.data.dataAmend['Product'],this.data.dataAmend['Board'],this.data.dataAmend['Side'],this.input.newVol*100,this.input.newPrice,this.data.dataAmend['IdxOrderId'],"0","",this.global.getPINValue());
      
            }
        });
      }
      else{
        this.socket.requestView952(this.data.dataAmend['OrderId'],this.global.getSelectedAccount(),this.data.dataAmend['Product'],this.data.dataAmend['Board'],this.data.dataAmend['Side'],this.input.newVol*100,this.input.newPrice,this.data.dataAmend['IdxOrderId'],"0","",this.global.getPINValue());
        
      }
      
    }
  }

  doCancelAmend(){
    this.input.isVisible_orderAmend = false;
  }

  onShownOrderAmend(e){
  }
  inputCodeChange(e){

    this.requestBuySellDataFromServer();
  }
  inputCodeOpen(e){
    let x = document.getElementById("inputBoxCode") as HTMLInputElement; 
    // x.element().find('input')
    x.select();
  }

  generateOrderBookData(obj){  

    let tempData=[];

    if(obj['NoBid']==obj['NoOffer']){
      for(let i=0;i<obj['NoBid'];i++){
        let tempArray = [];
        tempArray['BidPrice']=obj['NoBidArray'][i]['BidPrice'];
        tempArray['BidLot']=obj['NoBidArray'][i]['BidLot'];
        tempArray['BidVol']=obj['NoBidArray'][i]['BidVol'];
        tempArray['BidLotChange']=obj['NoBidArray'][i]['BidLotChange'];
        tempArray['OfferPrice']=obj['NoOfferArray'][i]['OfferPrice'];
        tempArray['OfferLot']=obj['NoOfferArray'][i]['OfferLot'];
        tempArray['OfferVol']=obj['NoOfferArray'][i]['OfferVol'];
        tempArray['OfferLotChange']=obj['NoOfferArray'][i]['OfferLotChange'];
        tempData.push(tempArray);
      }
    }
    else if(obj['NoBid']>obj['NoOffer']){
      let j=0;
      for(let i=0;i<obj['NoOffer'];i++,j++){
        let tempArray = [];
        tempArray['BidPrice']=obj['NoBidArray'][i]['BidPrice'];
        tempArray['BidLot']=obj['NoBidArray'][i]['BidLot'];
        tempArray['BidVol']=obj['NoBidArray'][i]['BidVol'];
        tempArray['BidLotChange']=obj['NoBidArray'][i]['BidLotChange'];
        tempArray['OfferPrice']=obj['NoOfferArray'][i]['OfferPrice'];
        tempArray['OfferLot']=obj['NoOfferArray'][i]['OfferLot'];
        tempArray['OfferVol']=obj['NoOfferArray'][i]['OfferVol'];
        tempArray['OfferLotChange']=obj['NoOfferArray'][i]['OfferLotChange'];
        tempData.push(tempArray);
      }
      for(let i=j;i<obj["NoBid"];i++){
        let tempArray = [];
        tempArray['BidPrice']=obj['NoBidArray'][i]['BidPrice'];
        tempArray['BidLot']=obj['NoBidArray'][i]['BidLot'];
        tempArray['BidVol']=obj['NoBidArray'][i]['BidVol'];
        tempArray['BidLotChange']=obj['NoBidArray'][i]['BidLotChange'];
        tempArray['OfferPrice']=" ";
        tempArray['OfferLot']=" ";
        tempArray['OfferVol']=" ";
        tempArray['OfferLotChange']=" ";
        tempData.push(tempArray);
      }
    } 
    else if(obj['NoBid']<obj['NoOffer']){
      let j=0;
      for(let i=0;i<obj['NoBid'];i++,j++){
        let tempArray = [];
        tempArray['BidPrice']=obj['NoBidArray'][i]['BidPrice'];
        tempArray['BidLot']=obj['NoBidArray'][i]['BidLot'];
        tempArray['BidVol']=obj['NoBidArray'][i]['BidVol'];
        tempArray['BidLotChange']=obj['NoBidArray'][i]['BidLotChange'];
        tempArray['OfferPrice']=obj['NoOfferArray'][i]['OfferPrice'];
        tempArray['OfferLot']=obj['NoOfferArray'][i]['OfferLot'];
        tempArray['OfferVol']=obj['NoOfferArray'][i]['OfferVol'];
        tempArray['OfferLotChange']=obj['NoOfferArray'][i]['OfferLotChange'];
        tempData.push(tempArray);
      }
      for(let i=j;i<obj['NoOffer'];i++){
        let tempArray = [];
        tempArray['BidPrice']=" ";
        tempArray['BidLot']=" ";
        tempArray['BidVol']=" ";
        tempArray['BidLotChange']=" ";
        tempArray['OfferPrice']=obj['NoOfferArray'][i]['OfferPrice'];
        tempArray['OfferLot']=obj['NoOfferArray'][i]['OfferLot'];
        tempArray['OfferVol']=obj['NoOfferArray'][i]['OfferVol'];
        tempArray['OfferLotChange']=obj['NoOfferArray'][i]['OfferLotChange'];
        tempData.push(tempArray);
      }
    }
    if(this.input['code']==obj['ProductCode']){
      this.data.data2=tempData; 
    }
  
  // this.isChangeData = true;
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
  changePWD(){

    this.input.oldPassword="",
    this.input.newPassword="",
    this.input.confirmPassword="",
    this.input.isVisible_PWD=true;
  }
  changeCPIN(){
    this.input.oldPIN="",
    this.input.newPIN="",
    this.input.confirmPIN="",
    this.input.isVisible_CPIN=true;
  }
  onShownCPIN(e){
    
  }
  sendChangeCPIN(){
    if(this.input.newPIN.length<8){
      alert("New PIN Length Minimum 8 character", "Error"); 
       
	  }else if(this.input.newPIN==this.input.confirmPIN) {
      this.socket.requestView311(this.input.oldPIN,this.input.newPIN);
      
    } else{
      alert("New PIN and Confirm PIN is not same", "Error"); 
       
    }
  }
  showOption(){
    this.input.isVisible_Option=true;
  }
  onShownPWD(e){

  }
  isAllowResend(_input){ 
    if(_input=="8") return true;
    if(_input=="9") return true;
    return false; 
  }
  openResend(data){



    if(data['Side']=="1")
      this.openPopup("sell");
    else if(data['Side']=="2")
      this.openPopup("buy");

    this.input.code=data['Product'];
    this.input.price=data['Price'];
    this.input.quantity=(data['OrderVolume']/100)+"";
    this.input.tif=data['Tif'];
  }
  closeOrder(){
    this.input.isVisible_buysell=false;
  }
  refreshButton_Clicked(e){
    this.requestOrderStatusData();
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
