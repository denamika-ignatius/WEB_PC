import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { global } from '../global';
import { Socket } from '../socket';
import DataSource from "devextreme/data/data_source";
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  active:any;
  tabActive :any;
  indicies;
  indiciesDisplay;
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
  currMenu="";
  dsStockList:DataSource;
  usdIdr =[];
  alertData={
    code:"",
    price:"",
    trigger:"=",
    currEdit:1,
    isVisible:false,
  };

  constructor(    
    private router: Router, 
    private socket: Socket, 
    public global:global,
    ) { 
      this.compositeDisplay=[]; 
      this.composite=[];
      this.rawComposite=[];
      this.indicies=[];  
      this.indiciesDisplay=[];  
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
        this.composite['unchange'] = tools.numberFormat(obj['TotalUnchangeProduct'],0);
        this.composite['close'] = tools.numberFormat(obj['PreviousIndices'],2);

        this.composite['openColorVal'] = obj['OpenIndices']-obj['PreviousIndices'];
        this.composite['highColorVal'] = obj['HighIndices']-obj['PreviousIndices'];
        this.composite['lowColorVal'] = obj['LowIndices']-obj['PreviousIndices'];
        this.composite['changeRaw'] = obj['LastIndices']-obj['PreviousIndices'];
        
        this.global.setFooterData(this.composite);
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
        this.composite['unchange'] = tools.numberFormat(obj['TotalUnchangeProduct'],0);
        this.composite['close'] = tools.numberFormat(obj['PreviousIndices'],2);

        this.composite['openColorVal'] = obj['OpenIndices']-obj['PreviousIndices'];
        this.composite['highColorVal'] = obj['HighIndices']-obj['PreviousIndices'];
        this.composite['lowColorVal'] = obj['LowIndices']-obj['PreviousIndices'];
        this.composite['changeRaw'] = obj['LastIndices']-obj['PreviousIndices'];
      

        this.global.setFooterData(this.composite);
      }
      this.isChangeData = true;
  });
  messageCenter.addRespone('view51', (obj)=>{ 
    this.indicies = obj['NoDataArray'];
    // for(let i=0;i<obj['NoDataArray'].length;i++){
    //   for(let j=0;j<this.indices.length)
    // }
    for(let i=0;i<this.indicies.length;i++)
    {
      if(this.indicies[i].Name == "USD-IDR"){
        this.usdIdr = this.indicies[i];
      }
    }
  });

    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);
    this.socket.requestView37();
    this.socket.requestViewHome();
  }
  updateDataToScreen() {
    if(this.isChangeData) {
      this.compositeDisplay = this.global.getFooterData();  
      this.isChangeData = false; 
    }
  }
  
  ngOnDestroy(){
    this.global.setAlertData(this.alertData);
    messageCenter.delRespone('view29H');
    messageCenter.delRespone('autoUpdate7H');
    messageCenter.delRespone('view37');
    messageCenter.delRespone('view51');
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]); 
    
    if(this.updateThread) clearInterval(this.updateThread );
    if(this.remoteStatusThread) clearInterval(this.remoteStatusThread );
    if(this.updateTickerThread) clearInterval(this.updateTickerThread);
  }

  updateDataTickerToScreen(){
    this.indiciesDisplay=[];
    let maxData = 4;

    for(let i=this.indicesDisplayCounter*maxData;i<(this.indicesDisplayCounter*maxData)+maxData;i++)
    {
      let temp = this.indicies[i];
      this.indiciesDisplay.push(temp);
    }
    this.indicesDisplayCounter++;
    if(this.indicesDisplayCounter>Math.floor((this.indicies.length-maxData)/maxData)) this.indicesDisplayCounter=0;
  }
}
