import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { global } from '../global';
import { Socket } from '../socket';
import DataSource from "devextreme/data/data_source";
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { VirtualTimeScheduler, of } from 'rxjs';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  active:any;
  tabActive :any;
  indices;
  indicesDisplay;
  indicesDisplayCounter=0;
  compositeDisplay: any;
	composite: any ;
	rawComposite: any;
	isChangeData = false;
  updateThread;
  serverDateTime;
  serverDateRaw;
  serverTimeRaw;
  serverDateTimeThread;
  remoteStatusThread;
  remoteStatus=true;
  updateTickerThread;
  marketstatus:any="SESSION 1";
  marketSt="st";
  marketNd="nd";
  marketThird="rd"
  marketTh="th";
  currMenu="";
  dsStockList:DataSource;
  
  constructor(
    private router: Router, 
    private socket: Socket, 
    public global:global,
  ) { 
    this.compositeDisplay=[]; 
    this.composite=[];
    this.rawComposite=[];
    this.indices=[];  
    this.indicesDisplay=[];  
    this.updateThread = setInterval(()=>{ this.updateDataToScreen(); }, 900);
    this.updateTickerThread = setInterval(()=>{ this.updateDataTickerToScreen(); }, 5000);
    
    this.remoteStatusThread = setInterval(()=>{ 
      if(this.socket.isOpen){
        this.socket.requestView96(); 
        this.socket.requestViewHeaderMenu();
      }
        
    }, 30000);

  }

  ngOnInit() {
    messageCenter.addRespone('view29H', (obj)=>{
      if(obj['IndicesCode']=="COMPOSITE")
      {
        this.rawComposite = obj;
        this.composite = [];
        this.composite['last'] = tools.numberFormat(obj['LastIndices'],2);
        this.composite['chg'] = obj['LastIndices']-obj['PreviousIndices'];
        this.composite['change'] = tools.numberFormat(obj['LastIndices']-obj['PreviousIndices'],2);
        this.composite['percent'] = tools.numberFormat((obj['LastIndices']-obj['PreviousIndices'])/obj['PreviousIndices']*100,2);
        this.composite['FNValue'] = obj['ForeignBuyValue']-obj['ForeignSellValue'];
        this.composite['FNValueDisplay'] = tools.kmbtFormat(obj['ForeignBuyValue']-obj['ForeignSellValue'],2);
        this.composite['value'] = tools.kmbtFormat(obj['TotalValue'],2);
        this.composite['volume'] = tools.kmbtFormat(obj['TotalVolume'],2);
        this.composite['up'] = tools.numberFormat(obj['TotalUpProduct'],0);
        this.composite['down'] = tools.numberFormat(obj['TotalDownProduct'],0);
        this.composite['high'] = tools.numberFormat(obj['HighIndices'],2);
        this.composite['low'] = tools.numberFormat(obj['LowIndices'],2);
        this.composite['freq'] = tools.numberFormat(obj['TotalFreq'],0);
        this.composite['prev'] = tools.numberFormat(obj['PreviousIndices'],2);
        this.composite['open'] = tools.numberFormat(obj['OpenIndices'],2);

        this.composite['openColorVal'] = obj['OpenIndices']-obj['PreviousIndices'];
        this.composite['highColorVal'] = obj['HighIndices']-obj['PreviousIndices'];
        this.composite['lowColorVal'] = obj['LowIndices']-obj['PreviousIndices'];
        this.composite['changeRaw'] = obj['LastIndices']-obj['PreviousIndices'];
        
        this.global.setHeaderData(this.composite);
      }
      this.isChangeData = true;
    });
    messageCenter.addRespone('autoUpdate7H', (obj)=>{ 
        if(obj['IndicesCode']=="COMPOSITE")
        {
          this.composite = [];
          this.composite['last'] = tools.numberFormat(obj['LastIndices'],2);
          this.composite['chg'] = obj['LastIndices']-obj['PreviousIndices'];
          this.composite['change'] = tools.numberFormat(obj['LastIndices']-obj['PreviousIndices'],2);
          this.composite['percent'] = tools.numberFormat((obj['LastIndices']-obj['PreviousIndices'])/obj['PreviousIndices']*100,2);
          this.composite['FNValue'] =  obj['ForeignBuyValue']-obj['ForeignSellValue'];
          this.composite['FNValueDisplay'] = tools.kmbtFormat(obj['ForeignBuyValue']-obj['ForeignSellValue'],2);
          this.composite['value'] = tools.kmbtFormat(obj['TotalValue'],2);
          this.composite['volume'] = tools.kmbtFormat(obj['TotalVolume'],2);
          this.composite['up'] = tools.numberFormat(obj['TotalUpProduct'],0);
          this.composite['down'] = tools.numberFormat(obj['TotalDownProduct'],0);
          this.composite['high'] = tools.numberFormat(obj['HighIndices'],2);
          this.composite['low'] = tools.numberFormat(obj['LowIndices'],2);
          this.composite['freq'] = tools.numberFormat(obj['TotalFreq'],0);
          this.composite['prev'] = tools.numberFormat(obj['PreviousIndices'],2);
          this.composite['open'] = tools.numberFormat(obj['OpenIndices'],2);

          this.composite['openColorVal'] = obj['OpenIndices']-obj['PreviousIndices'];
          this.composite['highColorVal'] = obj['HighIndices']-obj['PreviousIndices'];
          this.composite['lowColorVal'] = obj['LowIndices']-obj['PreviousIndices'];
          this.composite['changeRaw'] = obj['LastIndices']-obj['PreviousIndices'];
        

          this.global.setHeaderData(this.composite);
        }
        this.isChangeData = true;
    });
    messageCenter.addRespone('view50', (obj)=>{ 
      this.serverDateRaw = obj['ServerDate'];
      this.serverTimeRaw = obj['ServerTime'];
      this.generateDateTime();
      if(this.serverDateTimeThread){ clearInterval(this.serverDateTimeThread);} 
      this.serverDateTimeThread = setInterval(()=>{ this.calcDateTime(); }, 1000);
      console.log(this.serverDateTimeThread);
    });

    messageCenter.addRespone('view51', (obj)=>{ 

      this.indices = obj['NoDataArray'];
      // for(let i=0;i<obj['NoDataArray'].length;i++){
      //   for(let j=0;j<this.indices.length)
      // }

    });
    messageCenter.addRespone('view96', (obj)=>{

      if(obj['SuccessFlag']==1) this.remoteStatus=true;
      else this.remoteStatus=false;
    });

    this.compositeDisplay = this.global.getHeaderData();  
    this.socket.requestView50();
    this.socket.requestView96(); 
    this.socket.requestViewHeaderMenu();

    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);


  }
  ngOnDestroy(){
    messageCenter.delRespone('view29H');
    messageCenter.delRespone('autoUpdate7H');
    messageCenter.delRespone('view51');
    messageCenter.delRespone('view50');
    messageCenter.delRespone('view96');

    this.socket.requestAutoUpdate7(0,["COMPOSITE"]); 
    
    if(this.serverDateTimeThread) clearInterval(this.serverDateTimeThread);
    if(this.updateThread) clearInterval(this.updateThread );
    if(this.remoteStatusThread) clearInterval(this.remoteStatusThread );
    if(this.updateTickerThread) clearInterval(this.updateTickerThread);
  }
  clickSelectMenu(_input){ 
    // if(_input=="/option" ) messageCenter.runCallback("x","option");
    // else 
    if(_input=="/myAccount" && !this.global.getIsLoginPIN() ) messageCenter.runCallback("x","my account");
    else{
      this.router.navigate([_input]); 
      this.currMenu=_input;
    }
  }
  clickLogout(){  
    this.global.setPINValue("");
    this.global.setIsLoginPIN(false);
    this.socket.stop();
    this.router.navigate(['/login']); 
  }
  x(_input){  
    if(_input=="buy"){
      messageCenter.runCallback("x","buy");
    }
    else if(_input=="sell"){
      messageCenter.runCallback("x","sell");
    }
    else if(_input=="order status"){
      messageCenter.runCallback("x","order status");
    }
  } 
  eventLogout(){

  }   
  updateDataToScreen() {
    if(this.isChangeData) {
      this.compositeDisplay = this.global.getHeaderData();  

      this.isChangeData = false; 
    }
  }
  generateDateTime(){
    let amPm:string ="";
    let jam = tools.getJam(this.serverTimeRaw);
    let date = (new Date()).getDay();
    let dateName =""
    if (date == 0){
      dateName = "Sunday";
    }
    else if(date == 1){
      dateName = "Monday";
    }
    else if(date == 2){
      dateName = "Tuesday";
    }
    else if(date == 3){
      dateName = "Wednesday";
    }
    else if(date == 4){
      dateName = "Thursday";
    }
    else if(date == 5){
      dateName = "Friday";
    }
    else{
      dateName = "Saturday"
    }
    if(jam>=12){
      amPm = "pm";
      this.serverDateTime = dateName +", "+ tools.dateStyle(this.serverDateRaw,5)+", "+tools.timeFormat(this.serverTimeRaw)+ " " ;
    }
    else{
      amPm ="am"
      this.serverDateTime = dateName +", "+ tools.dateStyle(this.serverDateRaw,5)+", "+tools.timeFormat(this.serverTimeRaw)+ " " ;
    }
    let tempDate = new Date();
    let tempDay = tempDate.getDay();
    // let serverDetik = tools.getDetik(this.serverTimeRaw);
    // let serverMenit = tools.getMenit(this.serverTimeRaw);
    // let serverJam = tools.getJam(this.serverTimeRaw);
    let serverTime = parseInt(this.serverTimeRaw)
    if(tempDay >0 && tempDay < 5)
    {
      if(serverTime >= 84500  && serverTime < 85500)
      {
        this.marketstatus = "PreOpen";
      }
      else if(serverTime >= 85500 && serverTime < 90000)
      {
        this.marketstatus = "EndPreOpen";
      }
      else if(serverTime >= 90000 && serverTime < 120000)
      {
        this.marketstatus = "Session-1";
      }
      else if(serverTime >= 120000 && serverTime < 133000)
      {
        this.marketstatus = "BREAK";
      }
      else if(serverTime >= 133000 && serverTime < 155000)
      {
        this.marketstatus = "Session-2" ;
      }
      else if(serverTime >= 155000 && serverTime < 160000)
      {
        this.marketstatus = "Pre-Closing";
      }
      else if(serverTime >= 160000 && serverTime < 160500)
      {
        this.marketstatus = "End-Of-2ndSession";
      }
      else if(serverTime >= 160500 && serverTime < 161500)
      {
        this.marketstatus = "Post-Trading";
      }
      else{
        this.marketstatus = "CLOSE";
      }
    }
    else if(tempDay==5){
      if(this.serverTimeRaw >= 84500  && this.serverTimeRaw < 85500)
      {
        this.marketstatus = "PreOpen";
      }
      else if(this.serverTimeRaw >= 85500 && this.serverTimeRaw < 90000)
      {
        this.marketstatus = "EndPreOpen";
      }
      else if(this.serverTimeRaw >= 90000 && this.serverTimeRaw < 113000)
      {
        this.marketstatus = "Session-1";
      }
      else if(this.serverTimeRaw >= 113000 && this.serverTimeRaw < 140000)
      {
        this.marketstatus = "BREAK";
      }
      else if(this.serverTimeRaw >= 140000 && this.serverTimeRaw < 155000)
      {
        this.marketstatus = "Session-2" ;
      }
      else if(this.serverTimeRaw >= 155000 && this.serverTimeRaw < 160000)
      {
        this.marketstatus = "Pre-Closing";
      }
      else if(this.serverTimeRaw >= 160000 && this.serverTimeRaw < 160500)
      {
        this.marketstatus = "End-Of-2ndSession";
      }
      else if(this.serverTimeRaw >= 160500 && this.serverTimeRaw < 161500)
      {
        this.marketstatus = "Post-Trading";
      }
      else{
        this.marketstatus = "CLOSE";
      }
    }
    // if(tempDay>0 && tempDay<5){
    //   console.log(this.serverTimeRaw)
    //   if((serverJam==8 && serverMenit>=45) &&( serverJam==8 && serverMenit<55 )) {
    //     this.marketstatus = "PreOpen"
    //   }
    //   else if (serverJam==8 && serverMenit>=55){
    //     this.marketstatus = "EndPreOpen"
    //   }
    //   else if(serverJam>=9 && jam<12){
    //     this.marketstatus = "Session 1";
    //   }
    //   else if (serverJam>=12 && ((serverJam==13 && serverMenit<30)) || serverJam<13){
    //     this.marketstatus = "BREAK";
    //   }
    //   else if (((serverJam==13 && serverMenit>=30) || serverJam>=14) && serverJam <16){
    //     this.marketstatus = "Session 2" ;
    //   }
    //   else if((serverJam==15 && serverMenit>=50) && (serverJam<16)){
    //     this.marketstatus = "EndSession2";
    //   }
    //   else if(serverJam==16 && serverMenit<=15){
    //     this.marketstatus = "PreClose";
    //   }
    //   else{
    //     this.marketstatus = "CLOSE";
    //   }
    // }
    // else if(tempDay==5){
    //   if((serverJam==8 && serverMenit>=45) &&( serverJam==8 && serverMenit<55 )) {
    //     this.marketstatus = "PreOpen"
    //   }
    //   else if (serverJam==8 && serverMenit>=55){
    //     this.marketstatus = "EndPreOpen"
    //   }
    //   else if(serverJam>=9 && (serverJam<11 || serverJam==11) && serverMenit<30) {
    //     this.marketstatus = "Session 1" ;
    //   }
    //   else if (((serverJam==11 && serverMenit>=30 )|| serverJam>=12) && serverJam <14) {
    //     this.marketstatus = "BREAK";
    //   }
    //   else if (serverJam>=14 && serverJam <16) { 
    //     this.marketstatus = "Session 2";
    //   }
    //   else if((serverJam==15 && serverMenit>=50) && (serverJam<16)){
    //     this.marketstatus = "EndSession2";
    //   }
    //   else if(serverJam==16 && serverMenit<=15){
    //     this.marketstatus = "PreClose";
    //   }
    //   else{
    //     this.marketstatus = "CLOSE";
    //   }
    // }
    // this.serverDateTime = tools.dateFormat(this.serverDateRaw,"DD-mm-YYYY")+" "+tools.timeFormat(this.serverTimeRaw);
    // this.isChangeData = true;
  }
  calcDateTime(){
    let detik = tools.getDetik(this.serverTimeRaw);
    let menit = tools.getMenit(this.serverTimeRaw);
    let jam = tools.getJam(this.serverTimeRaw);
    
    detik++;
    if(detik>=60) {
      detik=0;
      menit++;
      if(detik%20==0)
        this.socket.requestView50();
    }
    if(menit>=60) { 
      menit=0;
      jam++;
    }
    if(jam>=24){
      jam=0;
      this.socket.requestView50();
    }
    this.serverTimeRaw = tools.combineWaktu(detik,menit,jam);
    this.generateDateTime();
  }
  updateDataTickerToScreen(){
    this.indicesDisplay=[];
    let maxData = 4;

    for(let i=this.indicesDisplayCounter*maxData;i<(this.indicesDisplayCounter*maxData)+maxData;i++)
    {
      let temp = this.indices[i];
      this.indicesDisplay.push(temp);
    }
    this.indicesDisplayCounter++;
    if(this.indicesDisplayCounter>Math.floor((this.indices.length-maxData)/maxData)) this.indicesDisplayCounter=0;
  }
  isActiveMenu(_input){
    if(_input==this.router.url)
      return true;
    else
      return false;
  }
 
  box1_onOpened(e){ 

    let x = document.getElementById("inputBox1IDXXX") as HTMLInputElement;  
    x.select();
  }
}
