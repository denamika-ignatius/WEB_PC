import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import { Router } from '@angular/router';
import * as tools from '../tools';
import { global } from '../global';
import DataSource from "devextreme/data/data_source";
import ArrayStore from "devextreme/data/array_store";
import * as messageCenter from '../messageCenter';

@Component({
  selector: 'app-broker-summary',
  templateUrl: './broker-summary.component.html',
  styleUrls: ['./broker-summary.component.scss']
})
export class BrokerSummaryComponent implements OnInit {
  brokerInput = {
    "code":"YB",
    "filterCode":"",
  }
  brokerData = {
    "Change":1,
    "BVal":" ",
    "SVal":" ",
    "NVal":" ",
    "TVal":" ",
    "BLot":" ",
    "SLot":" ",
    "NLot":" ",
    "TLot":" ",
    "NFreq":" ",
    "FgnTFreq": " ",
    "FgnNFreq": " ",
    "BFreq":" ",
    "SFreq":" ",
    "TFreq":" ",
    "FgnSellFreq": " ",
    "FgnBuyFreq": " ",
  }

  tabs = [
    { text: "Summary", display: "Summary", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Trade Detail", display: "Trade Detail", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "History", display: "History", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    // { text: "Transaction Value", display: "Transaction Value", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" }
  ];
  selectTab = "Summary";

  minDate = new Date(2000, 0, 1);
  maxDate = new Date(2029, 11, 31);
  startDate =  new Date();

  endDate = new Date();

  brokeNumber:any;
  summaryData = [];
  tradeDetailData = [];
  tradeDetailDataDisplay = [];
  historyData = [];
  // transactionValueData =[];

  isChangeData = false;
  
  updateThread:any;

  lastTradeNo:any=0;
  dsBrokerList;
  dsProductCode:any=[];

  constructor(
    public router: Router,
    private socket:Socket,
    public global:global,
  ) { }

  ngOnInit() {
    this.startDate.setDate(this.startDate.getDate() - 31);
    
    if(!this.socket.isOpen) this.router.navigate(['/login']);
    messageCenter.addRespone('autoUpdate6', (obj)=>{ 
      this.generateBrokerData(obj);
      this.isChangeData = true;
    });
    messageCenter.addRespone('view3', (obj)=>{   

      this.generateBrokerData(obj);
      this.isChangeData = true;
    });
    messageCenter.addRespone('view4', (obj)=>{  

        let tempData:any = [];
        this.dsProductCode =[];
        this.summaryData = [];
        tempData=obj["NoProductBoardArray"];
            for(let i=0;i<obj["NoProductBoard"];i++){
                // tempData[i]["No"]=tools.kmbtFormat(i+1,0);
                tempData[i]["No"] = i+1;
                tempData[i]["BuyFreqFormated"]=tools.numberFormat(tempData[i]["BuyFreq"],0);
                tempData[i]["BuyLotFormated"]=tools.numberFormat(tempData[i]["BuyLot"],0);
                tempData[i]["BuyValueFormated"]=tools.kmbtFormat(tempData[i]["BuyValue"],2);
                tempData[i]["BuyAveragePriceFormated"]=tools.numberFormat(tempData[i]["BuyAveragePrice"],0);
                tempData[i]["BuyLotPercentFormated"]=tools.numberFormat(tempData[i]["BuyLotPercent"],0);
                tempData[i]["BuyForeignFreqFormated"]=tools.numberFormat(tempData[i]["BuyForeignFreq"],0);
                tempData[i]["SellFreqFormated"]=tools.numberFormat(tempData[i]["SellFreq"],0);
                tempData[i]["SellLotFormated"]=tools.numberFormat(tempData[i]["SellLot"],0);
                tempData[i]["SellValueFormated"]=tools.kmbtFormat(tempData[i]["SellValue"],2);
                tempData[i]["SellForeignFreqFormated"]=tools.kmbtFormat(tempData[i]["SellForeignFreq"],0);
                tempData[i]["SellAveragePriceFormated"]=tools.numberFormat(tempData[i]["SellAveragePrice"],0);
                tempData[i]["SellLotPercentFormated"]=tools.numberFormat(tempData[i]["SellLotPercent"],0);
                tempData[i]["NetFreqFormated"]=tools.numberFormat(tempData[i]["NetFreq"],0);
                tempData[i]["NetLotFormated"]=tools.numberFormat(tempData[i]["NetLot"],0);
                tempData[i]["NetValueFormated"]=tools.kmbtFormat(tempData[i]["NetValue"],2);
                tempData[i]["RawNetValue"] = tempData[i]["NetValue"];
                tempData[i]["RawNetLot"] = tempData[i]["NetLot"];
                tempData[i]["RawNetFreq"] = tempData[i]["NetFreq"];
                tempData[i]["TotalValue"] = tempData[i]["BuyValue"]+tempData[i]["SellValue"];
                tempData[i]["TotalValueFormated"]= tools.kmbtFormat(tempData[i]["TotalValue"],2);
                tempData[i]["TotalLot"] = tempData[i]["BuyLot"]+tempData[i]["SellLot"]
                tempData[i]["TotalLotFormated"] = tools.kmbtFormat(tempData[i]["TotalLot"],2);
                tempData[i]["TotalFreq"] = tempData[i]["BuyFreq"]+tempData[i]["SellFreq"];
                tempData[i]["TotalFreqFormated"] = tools.kmbtFormat(tempData[i]["TotalFreq"],0);
                tempData[i]["FgnTotalValue"] =tempData[i]["BuyForeignValue"]+tempData[i]["SellForeignValue"];
                tempData[i]["FgnTotalValueFormated"] = tools.kmbtFormat(tempData[i]["FgnTotalValue"],2);
                tempData[i]["FgnTotalLot"] = tempData[i]["BuyForeignLot"]+tempData[i]["SellForeignLot"];
                tempData[i]["FgnTotalLotFormated"] = tools.kmbtFormat(tempData[i]["FgnTotalLot"],2);
                tempData[i]["FgnTotalFreq"] = tempData[i]["BuyForeignFreq"]+tempData[i]["SellForeignFreq"];
                tempData[i]["FgnTotalFreqFormated"] = tools.kmbtFormat(tempData[i]["FgnTotalFreq"],0);

                // tempData[i]["ProductCodeDisplay"] = this.global.getStockNameFromCode(tempData[i]["ProductCode"]); 
                this.dsProductCode.push({ ProductCode : tempData[i]["ProductCode"], ProductCodeDisplay : tempData[i]["ProductCodeDisplay"], });

                if(this.brokerInput.filterCode==""){
                  this.summaryData.push(tempData[i]);
                }
                else{
                  if(tempData[i]['ProductCode']==this.brokerInput['filterCode'].split('.')[0]){
                    this.summaryData.push(tempData[i]);
                  }
                }
            }
        // tempData.sort(function(a,b) { 
        //       return b['BuyValue']-a['BuyValue'];
        //     } );
        // this.summaryData = tempData;
      
    
        this.isChangeData = true;
      
    });    
    messageCenter.addRespone('view24', (obj)=>{  


      let tempData = obj['NoDateArray'];
      for(let i=0;i<tempData.length;i++){
        tempData[i]["DateDisplay"] = tools.dateStyle(tempData[i]['Date'],5);
        tempData[i]["NetValue"] = tempData[i]["BrokerBuyValue"]-tempData[i]["BrokerSellValue"];
        tempData[i]["NetLot"] = tempData[i]["BrokerBuyLot"]-tempData[i]["BrokerSellLot"];
        tempData[i]["NetFreq"] =tempData[i]["BrokerBuyFreq"]-tempData[i]["BrokerSellFreq"]
        tempData[i]["TotalValue"] = tempData[i]["BrokerBuyValue"]+tempData[i]["BrokerSellValue"];
        tempData[i]["TotalLot"] = tempData[i]["BrokerBuyLot"]+tempData[i]["BrokerSellLot"];
        tempData[i]["TotalFreq"] = tempData[i]["BrokerBuyFreq"]+tempData[i]["BrokerSellFreq"];
      }
      this.historyData = [];
      this.historyData = tempData;
      this.isChangeData = true;
      
    });
    setTimeout(()=>{
      let tempBroker = this.global.getBrokerList();
      let tempAllBroker=[];
      for(let i=0;i<tempBroker.length;i++){
        let temp = Object.assign({}, tempBroker[i]); 
        temp['BrokerFullName']=temp['BrokerCode']+" - "+temp['BrokerName'];
        tempAllBroker.push(temp);

      }
      this.dsBrokerList= new DataSource({
        store: new ArrayStore({
          key: "BrokerCode", 
          data:tempAllBroker
        }),
 
         searchExpr: ["BrokerCode"], 
      }); 
    },500);

    messageCenter.addRespone('view21', (obj)=>{  //trade Detail

      if(this.brokeNumber == 0)
      {
        let tempData = obj['NoTradeArray'];
        this.dsProductCode =[];
        for(let i=0;i<tempData.length;i++)
        {
          tempData[i]["TradeTimeDisplay"] = tools.timeFormat(tempData[i]["TradeTime"]);
          tempData[i]["PreviousPrice"] = tempData[i]["Price"]-tempData[i]["Change"];
          tempData[i]["ChangePercent"] = tools.numberFormat(tempData[i]["Change"]/tempData[i]["PreviousPrice"]*100,2);
          tempData[i]["ProductCodeDisplay"] = tempData[i]["ProductCode"];
          
          this.dsProductCode.push({ ProductCode : tempData[i]["ProductCode"], ProductCodeDisplay : tempData[i]["ProductCodeDisplay"], });
          this.brokeNumber = tempData[i]['NoTradeArray'];
        }
        if(this.brokerInput.filterCode=="")
        {
          if(this.lastTradeNo==0)
          {
            this.tradeDetailData=[];
            this.tradeDetailData=obj['NoTradeArray'];
          }
          else
          {
            for(let i =0;i<obj['NoTrade'];i++){
              this.tradeDetailData.push(obj['NoTradeArray'][i]);
            }
          }
        }
        else
        {
          if(this.lastTradeNo==0)
          {
            this.tradeDetailData=[];
            for(let i =0;i<obj['NoTrade'];i++){
              if(obj['NoTradeArray'][i]['ProductCode']==this.brokerInput['filterCode'].split('.')[0])this.tradeDetailData.push(obj['NoTradeArray'][i]);
            }
            // this.tradeDetailData=obj['NoTradeArray'];
          }
          else
          {
            for(let i =0;i<obj['NoTrade'];i++){
              if(obj['NoTradeArray'][i]['ProductCode']==this.brokerInput['filterCode'].split('.')[0])this.tradeDetailData.push(obj['NoTradeArray'][i]);
            }
          }
        }
        this.lastTradeNo=obj['LastTradeNo'];
        this.brokeNumber=obj['LastTradeNo'];
      }
      else
      {
        let tempData = obj['NoTradeArray'];
        for(let i=0;i<tempData.length;i++)
        {
          tempData[i]["TradeTimeDisplay"] = tools.timeFormat(tempData[i]["TradeTime"]);
          tempData[i]["PreviousPrice"] = tempData[i]["Price"]-tempData[i]["Change"];
          tempData[i]["ChangePercent"] = tools.numberFormat(tempData[i]["Change"]/tempData[i]["PreviousPrice"]*100,2);
          // tempData[i]["ProductCodeDisplay"] = this.global.getStockNameFromCode(tempData[i]["ProductCode"]);
          if(!this.cekLastTradeDataNo(tempData[i]['NoTrade'])){
            this.dsProductCode.push({ ProductCode : tempData[i]["ProductCode"], ProductCodeDisplay : tempData[i]["ProductCodeDisplay"], });
          }
          if(this.brokeNumber > tempData[i]['NoTrade'])
          {
            this.brokeNumber = tempData[i]['NoTrade'];
          }
      }
      this.lastTradeNo=obj['LastTradeNo'];
      this.brokeNumber=obj['LastTradeNo'];
      }
      this.isChangeData = true;      
    });

    this.updateThread = setInterval(()=>{ this.updateDataToScreen(); }, 100);

    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);
    this.requestData();

    
  } 
  cekLastTradeDataNo(_input){
    for(let i=0;i<this.tradeDetailData.length;i++){
      if(this.tradeDetailData[i]['LastTradeNo']==_input) return true;
    }
    return false;
  }

  ngOnDestroy(){ 

    messageCenter.delRespone('autoUpdate6'); 
    messageCenter.delRespone('view3');
    messageCenter.delRespone('view4'); 
    messageCenter.delRespone('view21'); 
    messageCenter.delRespone('view24'); 
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]);  
    this.socket.requestAutoUpdate6(0,this.brokerInput.code);

    if(this.updateThread) clearInterval(this.updateThread);
  }
  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text;
    this.requestData();
  }
  requestData(){ 
    if(this.selectTab=="Summary"){ 
      let startDate:any = tools.trusDateFromDateTime(this.startDate);
      let endDate:any = tools.trusDateFromDateTime(this.endDate); 
      this.socket.requestView4(this.brokerInput.code,startDate,endDate);
    }
    else if(this.selectTab=="Trade Detail"){
      this.socket.requestView21( this.brokerInput.code,this.lastTradeNo,100);
    }
    else if(this.selectTab=="History"){
      var one_day=1000*60*60*24;
      let aDate =  new Date(this.endDate);
      let bDate = new Date(this.startDate);
      let diffmsDate = aDate.getTime()-bDate.getTime();
      let diffDate = Math.round(diffmsDate/one_day);
      
      let endDate:any = tools.trusDateFromDateTime(this.endDate);
      this.socket.requestView24( this.brokerInput.code,endDate,diffDate);
    }
    this.socket.requestAutoUpdate6(1,this.brokerInput.code);
    this.socket.requestView3(this.brokerInput.code);
  }
  onCellClick(info){
 
  }

  updateDataToScreen() {
    if(this.isChangeData) { 

      this.isChangeData = false;
    }
  } 
  dateBox_valueChanged(e){
    this.requestData();
  }
  brokerInput_valueChanged(e){
    this.socket.requestView3(this.brokerInput.code);
    this.requestData();
  }
  generateBrokerData(obj){
    this.brokerData['BVal']=tools.kmbtFormat(obj['BrokerBuyValue'],2);
    this.brokerData['BLot']=tools.kmbtFormat(obj['BrokerBuyLot'],2); 
    this.brokerData['BFreq']=tools.kmbtFormat(obj['BrokerBuyFreq'],2);
    this.brokerData['SVal']=tools.kmbtFormat(obj['BrokerSellValue'],2);
    this.brokerData['SLot']=tools.kmbtFormat(obj['BrokerSellLot'],2); 
    this.brokerData['SFreq']=tools.kmbtFormat(obj['BrokerSellFreq'],2);
    this.brokerData['NVal']=tools.kmbtFormat(obj['BrokerBuyValue']-obj['BrokerSellValue'],2);
    this.brokerData['NLot']=tools.kmbtFormat(obj['BrokerBuyLot']-obj['BrokerSellLot'],2);
    this.brokerData['NFreq']=tools.kmbtFormat(obj['BrokerBuyFreq']-obj['BrokerSellFreq'],2);
    this.brokerData['FgnBuyFreq']=tools.kmbtFormat(obj['BrokerForeignBuyFreq'],2);
    this.brokerData['FgnSellFreq']=tools.kmbtFormat(obj['BrokerForeignSellFreq'],2);
    this.brokerData['TVal']=tools.kmbtFormat(obj['BrokerBuyValue']+obj['BrokerSellValue'],2);
    this.brokerData['TLot']=tools.kmbtFormat(obj['BrokerBuyLot']+obj['BrokerSellLot'],2);
    this.brokerData['TFreq']=tools.kmbtFormat(obj['BrokerBuyFreq']+obj['BrokerSellFreq'],2);
    this.brokerData['FgnTFreq']=tools.kmbtFormat(obj['BrokerForeignBuyFreq']+obj['BrokerForeignSellFreq'],2);
    this.brokerData['FgnNFreq']=tools.kmbtFormat(obj['BrokerForeignBuyFreq']-obj['BrokerForeignSellFreq'],2); 
    this.brokerData['Change']= obj['BrokerBuyValue']-obj['BrokerSellValue'];1
    
  }

  box_onOpened(e){
    let x = document.getElementById("inputBoxID") as HTMLInputElement; 
    x.select();
  }
  box_onChange(e){
    this.requestData();
  }

  filterProductChange(e:any){

    if(this.brokerInput.filterCode==null) this.brokerInput.filterCode="";
    if(this.selectTab=="Summary"){ 
      let startDate:any = tools.trusDateFromDateTime(this.startDate);
      let endDate:any = tools.trusDateFromDateTime(this.endDate); 
      this.socket.requestView4(this.brokerInput.code,startDate,endDate);
    }
    else if(this.selectTab=="Trade Detail"){
      this.lastTradeNo=0;
      this.socket.requestView21( this.brokerInput.code,this.lastTradeNo,100);
    }
  }

  onToolbarPreparing(e){
    e.toolbarOptions.visible = false;
    /*e.toolbarOptions.items.unshift({
      location: 'before',
      template: 'From'
    }, {
      location: 'before',
      widget: 'dxDateBox',
      options: {
        displayFormat:"d MMM yyyy",
        min:this.minDate,
        max:this.maxDate,
        value:this.startDate,
        applyValueMode: "useButtons",
        onValueChanged:this.dateBoxStart_valueChanged.bind(this)
        
      }
    }, {
      location: 'before',
      template: 'To'
    }, {
      location: 'before',
      widget: 'dxDateBox',
      options: {
        displayFormat:"d MMM yyyy",
        min:this.minDate,
        max:this.maxDate,
        value:this.endDate,
        applyValueMode: "useButtons",
        onValueChanged:this.dateBoxEnd_valueChanged.bind(this)
        
      }
    }, {
      location: 'after',
      widget: 'dxButton',
      options: {
          icon: 'refresh',
          onClick: this.requestData.bind(this)
      }
    })*/
  }

  dateBoxStart_valueChanged(e){
    this.startDate=e.value;
    this.requestData();
  }
  dateBoxEnd_valueChanged(e){
 
    this.endDate=e.value;
    this.requestData();
  }
}
