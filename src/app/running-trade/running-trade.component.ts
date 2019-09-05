import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { global } from '../global';

@Component({
  selector: 'app-running-trade',
  templateUrl: './running-trade.component.html',
  styleUrls: ['./running-trade.component.scss']
})
export class RunningTradeComponent implements OnInit {
  constructor( 
    private socket:Socket,
    public global:global,
    ) {  }

  displayData={
    "runningTrade":[],
  } 

  runningTradeDisplay;
  runningTradeMaxData;
  runningTradeCurrData;
  runningTradePage;
  isChangeData = false; 

  updateThread; 

  ngOnInit() {
    messageCenter.addRespone('runningTrade', (obj)=>{
      for(let i=0;i<obj['ArrayNoArray'].length;i++) {
        let item = obj['ArrayNoArray'][i];
        if(item['BoardCode']=="RG") item['ProductCodeDisplay']=item['ProductCode'];
        else item['ProductCodeDisplay']=item['ProductCode']+"."+item['BoardCode'];
        item['Page']=this.runningTradePage;
        if(this.runningTradeDisplay){
         
          this.runningTradeDisplay[this.runningTradeCurrData]=item;
          this.runningTradeCurrData++;
          if(this.runningTradeCurrData>this.runningTradeMaxData) {
            this.runningTradeCurrData=0;
            this.runningTradePage++;
            if(this.runningTradePage>9) this.runningTradePage=0;
          }
          
        }
      }
      this.isChangeData=true;
    }); 
    

    this.updateThread = setInterval(()=>{ this.updateDataToScreen(); }, 300);
  }
  ngAfterViewInit(){
 
    this.socket.requestRunningTrade("1");

    setTimeout(() => {

      this.calcRunningTradeMaxData();
    }, 100);
  }

  ngOnDestroy(){

    if(this.updateThread) clearInterval(this.updateThread ); 
    this.socket.requestRunningTrade("0");
  }
  async updateDataToScreen(){
    if(this.isChangeData) { 
      this.displayData.runningTrade =  Object.assign([], this.runningTradeDisplay);
    
      this.isChangeData = false;
    }
    
  }
 
  calcRunningTradeMaxData(){
 
    let contentHight = document.getElementById("gridContainerRTX").parentNode.parentNode.parentNode.parentElement.offsetHeight; 
    let tempMaxData = Math.floor(contentHight/18)-3;
 
    if(this.runningTradeMaxData!=tempMaxData) {
      this.runningTradeMaxData=tempMaxData;
      this.runningTradeCurrData=0;
      this.runningTradeDisplay=[];
      this.runningTradePage=0
    }
  }
  onResize(event) {
    let contentHight = document.getElementById("gridContainerRTX").parentNode.parentNode.parentNode.parentElement.offsetHeight; 
    // let tempMaxData = Math.floor((event.target.innerHeight-30)/20); 
    let tempMaxData = Math.floor(contentHight/18)-3;
    if(this.runningTradeMaxData!=tempMaxData) {
      this.runningTradeMaxData=tempMaxData;
      this.runningTradeCurrData=0;
      this.runningTradeDisplay=[];
      this.runningTradePage=0
    }
  } 

  onLoad(event){
    
  }
  RTSetBg(index){
    if((index+1)==this.runningTradeCurrData){
      return "tableData-f";
    }else {
      let value:number = 0;
      value = index%2;
      if(value==0){
        return "tableData-0";
      } else {
        return "tableData-1";
      }
    } 
  }
}
