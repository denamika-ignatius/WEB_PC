import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import { Router } from '@angular/router';
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { global } from '../global';
import { alert } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent implements OnInit {

  tabs = [
    { text: "Portofolio", icon: "user" },
    { text: "History Order List", icon: "user" },//P/L History
    { text: "Trade List", icon: "comment" },//Trading Summary
    { text: "History Trade List", icon: "comment" },
    { text: "Fund Withdrawal", icon: "comment" },
  ];
  selectTab = "Portofolio";

  dataPortofolioARAP: any = [
    {Title:"Received",  a:0, b:0, c:0, d:0, e:0},
    {Title:"Payment",  a:0, b:0, c:0, d:0, e:0},
    {Title:"Net",  a:0, b:0, c:0, d:0, e:0},
    {Title:" ",  a:" ", b:" ", c:" ", d:" ", e:" "},
    {Title:"Outstanding",  a:0, b:0, c:0, d:0, e:0},
    
  ];
  dataPortofolio;
  dsAccountList;
  input={
    account:"",
    transferDate:new Date(),
    bankName:"",
    bankAccountName:"",
    bankAccountNo:"",
    bankBranch:"",
    ammount:"",
    startDate:new Date(),
    startDateHistory:new Date(),
    endDate:this.global.getNextWeekDate(),
    endDateHistory:new Date(),
    startDateTrade: new Date(),
  }
  minDate = new Date(2000, 0, 1);
  maxDate = new Date(2029, 11, 31); 
  data={
    data434:{},
    data108:[],
    data494:{},
    data423:{},
    data424:{},
    data425:{},
  }

  date={
    t1: '',
    t2: '',
    t3: ''
  }

  constructor(
    private router: Router,
    private socket:Socket, 
    public global:global,
    ) { }

  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);

    messageCenter.addRespone('view108', (obj)=>{
      this.data.data108=[];
      for(let i=0;i<obj['NoWithdrawalArray'].length;i++){
        let item = obj['NoWithdrawalArray'][i];
        // item['No']=i+1;
        item['No'] = item['WithdrawalId'];
        item['status'] = this.getCashStat(item['Status']);
        item['bank'] = item['BankName'];
        item['no'] = item['BankAccountNo'];
        item['date'] = item['InputDate'];
        item['dueDate'] = tools.dateStyle(item['DueDate'],5);
        item['amount'] = item['Amount'];
        item['notes'] = item['Notes'];
      } 
      for(let j=obj['NoWithdrawalArray'].length-1;j>=0;j--){
        this.data.data108.push(obj['NoWithdrawalArray'][j]);
      }

      
    });
    messageCenter.addRespone('view109', (obj)=>{
      let msg;
      if(obj['SuccessFlag'] == "Y") {msg = "Withdraw Success";}
      else if(obj['SuccessFlag'] == "N") {msg = "Withdraw Failed";}
      else if(obj['SuccessFlag'] == "A") {msg = "If You submit a withdrawal request after 10.00 AM, please select the next trading day.";}
      else{
        msg = "Order Failed. "+obj['Text'];
      }
      // let msgAlert = this.alertCtrl.create({
      //   title: 'Information',
      //   message: msg,
      //   buttons: ['Ok']
      // });
      // msgAlert.present();
      alert(msg, "Fund Withdrawal");

      this.requestData();
    });
    messageCenter.addRespone('view110', (obj)=>{

      if(obj['Flasg']=="Y") 
        this.requestData();

    });
    messageCenter.addRespone('view434', (obj)=>{ 

      this.data.data434=obj;
      this.generate_dataPortofolio();
      console.log(this.data.data434);
    }); 
    messageCenter.addRespone('view494', (obj)=>{ 

      this.data.data494=obj; 
    }); 
    messageCenter.addRespone('view423',(obj)=>{
      for(let i=0;i<obj['NoTradesArray'].length;i++){
        let item = obj['NoTradesArray'][i];
        item['No']=i+1; 
      }
      this.data.data423=obj ;
    })
    messageCenter.addRespone('view424', (obj)=>{
      for(let i=0;i<obj['NoOrderArray'].length;i++){
        let item = obj['NoOrderArray'][i];
        item['No']=i+1; 
      }
      this.data.data424=obj ;
    })
    messageCenter.addRespone('view425',(obj)=>{
      for(let i=0;i<obj['NoTradesArray'].length;i++){
        let item = obj['NoTradesArray'][i];
        item['No']=i+1; 
      }
      this.data.data425=obj ;
    })
    this.dsAccountList=this.global.getAccountList();
    this.input.account = this.global.getSelectedAccount();

    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]); 
    this.requestData();
  }
  ngOnDestroy(){

    messageCenter.delRespone('view108');
    messageCenter.delRespone('view110');
    messageCenter.delRespone('view109');
    messageCenter.delRespone('view434');
    messageCenter.delRespone('view494');
    messageCenter.delRespone('view424');
    messageCenter.delRespone('view425');

    this.socket.requestAutoUpdate7(0,["COMPOSITE"]); 
  }
  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text; 
    this.requestData();
  }
  requestData(){
    if(this.selectTab=="Portofolio"){
      this.socket.requestView434(this.input.account);
      this.socket.requestView494(this.input.account,"");
    }
    else if(this.selectTab=="Fund Withdrawal"){
      // let today = this.global.getCurrentDate();
      // let tomorrow = tools.getBeforeDate(-1);
      let startDate:any = tools.trusDateFromDateTime(this.input.startDate);
      let endDate:any = tools.trusDateFromDateTime(this.input.endDate);
      this.socket.requestView108(this.input.account,"",startDate,endDate);
      this.socket.requestView434(this.input.account);
    }
    else if(this.selectTab=="History Order List"){//P/L History History Order List

      let startDateHistoryOrder:any = tools.trusDateFromDateTime(this.input.startDateHistory);
      let endDateHistoryOrder:any = tools.trusDateFromDateTime(this.input.endDateHistory);
      this.socket.requestView424(this.input.account,startDateHistoryOrder,endDateHistoryOrder);
    }
    else if(this.selectTab=="Trade List"){//Trading Summary Trade List
      let startDate:any = tools.trusDateFromDateTime(this.input.startDateTrade);
      this.socket.requestView423(this.input.account);//dari tanggal sampe tanggal apa
    }
    else if(this.selectTab=="History Trade List"){//"History Trade List
    let startDateHistoryTrade:any = tools.trusDateFromDateTime(this.input.startDateHistory);
    let endDateHistoryTrade:any = tools.trusDateFromDateTime(this.input.endDateHistory);  
    this.socket.requestView425(this.input.account,startDateHistoryTrade,endDateHistoryTrade);   
    }
  }
  account_onChange(e){
    this.requestData()
    this.global.setSelectedAccount(this.input.account);
  }
  generate_dataPortofolio(){
    this.dataPortofolio = [];
    for(let i=0;i<this.data.data434['NoProductArray'].length;i++){
      let item = this.data.data434['NoProductArray'][i];
      let contractSize = this.global.getContractSizeForStock(item['Product']);
      let lot = parseFloat(item['BalanceVolume']) / parseFloat(contractSize);
      if(lot >= 1){
        lot = Math.floor(lot);
      }
      else{
        lot.toFixed(2);
      }

      item['Name'] = this.global.getStockNameFromCode(item['Product']);
      item['No']=i+1;
      item['Ammount']=item['AvgPrice']*item['BalanceVolume']
      item['Value']=item['LastPrice']*item['BalanceVolume']
      item['Unrealized']= (item['LastPrice'] * lot*100) - (item['AvgPrice'] * lot*100);
      item['G/L'] = item['Value'] -item['Ammount'];
      item['G/L%'] = 100*(item['LastPrice'] - item['AvgPrice'])/item['AvgPrice'];
      item['Unrealized%'] = ((item['Unrealized'] / item['Ammount'])) * 100
      if(item['Ammount'] <=0){
        item['Unrealized%'] = 0;
      }
      item['OpenLot']=parseFloat(item['OpenVolume']) / parseFloat(contractSize);
      if(item['OpenLot'] >= 1){
        item['OpenLot'] = Math.floor(lot);
      }
      else{
        item['OpenLot'].toFixed(2);
      }
      item['BalanceLot']=parseFloat(item['BalanceVolume']) / parseFloat(contractSize);
      if(item['BalanceLot'] >= 1){
        item['BalanceLot'] = Math.floor(lot);
      }
      else{
        item['BalanceLot'].toFixed(2);
      }
      this.dataPortofolio.push(item);
    }

    this.date.t1 = this.data.data434['DateT0'];
    this.date.t2 = this.data.data434['DateT1'];
    this.date.t3 = this.data.data434['DateT2'];

    if(this.data.data494['CashAndPendingBuyIncFee'] >=0){
      this.data.data434['TradingRatio'] = 0;
    }
    else{
      if( this.data.data494['PortoValuatedAndPendingBuyValuated']!=0){
        this.data.data434['TradingRatio'] = tools.numberFormat((this.data.data494['CashAndPendingBuyIncFee'] / this.data.data494['PortoValuatedAndPendingBuyValuated'])*100,2);
        this.data.data434['TradingRatio'] = this.data.data434['TradingRatio'] *-1
      }
      else {
        this.data.data434['TradingRatio'] = 1*100;
      }
      if( this.data.data434['TradingRatio'] > 100 ){
        this.data.data434['TradingRatio'] = 1*100;
      }  
    }
 
    this.data.data434['NetT+2'] =  this.data.data434['ReceivableT2']-this.data.data434['PayableT2'];
    this.data.data434['NetT+1'] =  this.data.data434['ReceivableT1']-this.data.data434['PayableT1'];
    this.data.data434['NetT+0'] =  this.data.data434['ReceivableT0']-this.data.data434['PayableT0'];
    this.data.data434['NetT-1'] =  this.data.data434['ReceivableTMinus1']-this.data.data434['PayableTMinus1'];
    this.data.data434['NetT-2'] =  this.data.data434['ReceivableTMinus2']-this.data.data434['PayableTMinus2'];
 
    this.data.data434['OutstandingT+2'] =  this.data.data434['PayableT2']*-1;
    this.data.data434['OutstandingT+1'] =  this.data.data434['PayableT1']*-1;
    this.data.data434['OutstandingT+0'] =  this.data.data434['PayableT0']*-1;
    this.data.data434['OutstandingT-1'] =  this.data.data434['PayableTMinus1']*-1;
    this.data.data434['OutstandingT-2'] =  this.data.data434['PayableTMinus2']*-1;
 
    if(this.data.data434['OutstandingT+2']==-0) this.data.data434['OutstandingT+2']=0;
    if(this.data.data434['OutstandingT+1']==-0) this.data.data434['OutstandingT+1']=0;
    if(this.data.data434['OutstandingT+0']==-0) this.data.data434['OutstandingT+0']=0;
    if(this.data.data434['OutstandingT-1']==-0) this.data.data434['OutstandingT-1']=0;
    if(this.data.data434['OutstandingT-2']==-0) this.data.data434['OutstandingT-2']=0;

    this.dataPortofolioARAP =  [
      {Title:"Received",  a:this.data.data434['ReceivableTMinus2'], b:this.data.data434['ReceivableTMinus1'], c:this.data.data434['ReceivableT0'], d:this.data.data434['ReceivableT1'], e:this.data.data434['ReceivableT2']},
      {Title:"Payment",  a:this.data.data434['PayableTMinus2'], b:this.data.data434['PayableTMinus1'], c:this.data.data434['PayableT0'], d:this.data.data434['PayableT1'], e:this.data.data434['PayableT2']},
      {Title:"Net",  a:this.data.data434['NetT-2'], b:this.data.data434['NetT-1'], c:this.data.data434['NetT+0'], d:this.data.data434['NetT+1'], e:this.data.data434['NetT+2']},
      {Title:" ",  a:" ", b:" ", c:" ", d:" ", e:" "},
      {Title:"Outstanding",  a:this.data.data434['OutstandingT-2'], b:this.data.data434['OutstandingT-1'], c:this.data.data434['OutstandingT+0'], d:this.data.data434['OutstandingT+1'], e:this.data.data434['OutstandingT+2']},
      
    ];
    this.input.bankName=this.data.data434['RdiBank'];
    this.input.bankAccountNo=this.data.data434['RdiAccountBank'];
    this.input.bankBranch=this.data.data434['RdiBank'];
    this.input.bankAccountName=this.data.data434['Name'];
    
    let calculatedCurrentBalance = this.data.data434['DepositAdjustment'] + this.data.data494['CashAndPendingBuyIncFee']
    this.data.data434['CurrentBalanceCalcedDisplay'] = calculatedCurrentBalance;
  }
  getCashStat(statusCode){
    if(statusCode=="P"){
      return "Pending";
    }else if(statusCode=="T"){
      return "Transfer";
    }else if(statusCode=="C"){
      return "Canceled";
    }else if(statusCode=="R"){
      return "Reject";
    }else {
      return "undefinied";
    }
  }
  withdraw_Buttom_Clicked(e){

    let transferDate:any = tools.trusDateFromDateTime(this.input.transferDate);
    this.socket.requestView109(this.input.account,transferDate,this.input.ammount,this.input.bankName,this.input.bankBranch,this.input.bankAccountNo,this.input.bankAccountName);
  }
  valueChange(e){
    this.requestData();
  }
  refreshButton_Clicked(e){
    this.requestData();
  }

  setColor(title, value){
    if(title == 'Received') return this.global.colorFormat(value);
    else if(title == 'Payment') return this.global.colorFormat(value*-1);
    else if(title == 'Net' || title == 'Outstanding') return this.global.colorFormat(value);
    else if(title == '') return '';
  }


  calcRealized(cell){
    let real = 0;
    real = (cell.data.AvgSellPrice - cell.data.AvgBuyPrice) * cell.data.SellVolume ;
    return real;
  }

  doCancel(data){
    this.socket.requestView110(data['WithdrawalId']);
  }

  statusName(status){
    if(status == 'T') return  'Successful';
    else if(status == 'P') return 'On Process';
    else if(status == 'C') return 'Cancelled';
    else if(status == 'R') return 'Rejected';
  }

  getColorBS(_input){
    if(_input=="B") return "f-red";
    else if(_input=="S") return "f-green";


  }
  customizeNumber(data){
    return tools.numberFormat(data.value,0);
  }
  customTotal(data){
    return "Total";
  }
}
