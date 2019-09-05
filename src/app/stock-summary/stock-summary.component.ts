import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import { Router } from '@angular/router';
import * as tools from '../tools';
import { global } from '../global';
import * as messageCenter from '../messageCenter';
import DataSource from "devextreme/data/data_source";

@Component({
  selector: 'app-stock-summary',
  templateUrl: './stock-summary.component.html',
  styleUrls: ['./stock-summary.component.scss']
})
export class StockSummaryComponent implements OnInit {
 
  quoteId = "110";
  stockInput = {
    "code":"TLKM",
    "board":"RG",
    "codeNboard": "TLKM.RG",
    "isNeedRequest":true,
    "isOpen":false,
  }
  stockData = {
    'Last':"",
    'Chg':"",
    'ChgPct':0,
    'ChgDisplay':" ",
    'Volume':"",
    'Open':"",
    'High':"",
    'Low':"", 
    'TFreq':"", 
    'Close':"", 
    'WAP':"", 
    'TVal':"", 
    'B%':"", 
    'TVol':"", 
    'Prev':0,
    'OpenPrice':0,
    'HighPrice':0,
    'LowPrice':0,
    'AveragePrice':0,
    'LastTradedLot':0,
  }
  tabs = [
    { text: "Summary", display: "Summary", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Trade Detail",  display: "Trade Detail", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Trade History", display: "Trade History", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "History",  display: "History", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Foreign History",  display: "Foreign History", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" }
  ];
  selectTab = "Summary";
  dsStockList:DataSource;
  
  minDate = new Date(2000, 0, 1);
  maxDate = new Date(2029, 11, 31);
  startDate = new Date();
  endDate = new Date();

  summary_startDate = this.global.get2MonthBeforeDate();
  summary_endDate = new Date();
  
  tradeDetail_startDate = new Date(); 
  stockNumber:any;
  tradeHistory_startDate = new Date(); 

  history_startDate = this.global.get2MonthBeforeDate();
  history_endDate = new Date();

  foreignHistory_startDate = this.global.get2MonthBeforeDate();
  foreignHistory_endDate = new Date();

  isChangeData = false;
  updateThread:any;
 
  orderBookData = [];
  tradeBookData = [];

  summaryData = [];
  tickTradeData = [];
  tickTradeHistoryData = [];
  historyData = [];
  constructor(
    private router: Router,
    private socket:Socket,
    public global:global,
  ) {  
  }

  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);

    messageCenter.addRespone('view1', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateStockData(obj); 
    });
    messageCenter.addRespone('autoUpdate1', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode']) 
        this.generateStockData(obj); 
    });
    messageCenter.addRespone('view2', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateOrderBookData(obj); 
    });
    messageCenter.addRespone('autoUpdate3', (obj)=>{ 
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateOrderBookData(obj); 
    }); 
    messageCenter.addRespone('view7', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateTradeBookData(obj); 
    });
    messageCenter.addRespone('autoUpdate4', (obj)=>{ 
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateTradeBookData(obj); 
    });

    messageCenter.addRespone('view5', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateSummaryData(obj); 
    }); 

    messageCenter.addRespone('view8', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateTickTradeData(obj); 
    });
    messageCenter.addRespone('autoUpdate51', (obj)=>{ 
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.updateTickTradeData(obj); 
    });
    messageCenter.addRespone('view9', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateTickTradeHistoryData(obj); 
    });
    messageCenter.addRespone('view10', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateHistoryData(obj); 
    });
    messageCenter.addRespone('view244', (obj)=>{
      if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode'])
        this.generateHistoryData(obj); 
    });

    setTimeout(()=>{
      this.dsStockList = this.global.getdsStockList();
    },500);
    this.updateThread = setInterval(()=>{ this.updateDataToScreen(); }, 100);

    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);

    this.requestData()
    
  }

  ngOnDestroy(){  
    messageCenter.delRespone('view1');
    messageCenter.delRespone('autoUpdate1');
    messageCenter.delRespone('view2');
    messageCenter.delRespone('autoUpdate3');
    messageCenter.delRespone('view7');
    messageCenter.delRespone('autoUpdate4');
    messageCenter.delRespone('view5');
    messageCenter.delRespone('view8');
    messageCenter.delRespone('autoUpdate51');
    messageCenter.delRespone('view9');
    messageCenter.delRespone('view10');
    messageCenter.delRespone('view244');

    this.socket.requestAutoUpdate1(0,this.stockInput.code,this.stockInput.board);
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]);  
    this.socket.requestAutoUpdate3(0,this.stockInput.code,this.stockInput.board);
    this.socket.requestAutoUpdate4(0,this.stockInput.code,this.stockInput.board);
    this.socket.requestAutoUpdate51(0,this.stockInput.code,this.stockInput.board);
    if(this.updateThread) clearInterval(this.updateThread);
  }

  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text; 
    this.requestData();
  }
  requestData(){ 

    this.socket.requestView1(this.stockInput.code,this.stockInput.board);
    this.socket.requestAutoUpdate1(1,this.stockInput.code,this.stockInput.board);
    this.socket.requestView2(this.stockInput.code,this.stockInput.board,20);
    this.socket.requestAutoUpdate3(1,this.stockInput.code,this.stockInput.board);
    this.socket.requestView7(this.stockInput.code,this.stockInput.board);
    this.socket.requestAutoUpdate4(1,this.stockInput.code,this.stockInput.board);

    if(this.selectTab=="Summary"){

      let startDate:any = tools.trusDateFromDateTime(this.summary_startDate);
      let endDate:any = tools.trusDateFromDateTime(this.summary_endDate);
      this.socket.requestView5(this.stockInput.code,this.stockInput.board,startDate,endDate);
    }
    else if(this.selectTab=="Trade Detail"){
      this.socket.requestView8(this.stockInput.code,this.stockInput.board,0,100);
      this.socket.requestAutoUpdate51(1,this.stockInput.code,this.stockInput.board);
    
    }
    else if(this.selectTab=="Trade History"){
      let startDate:any = tools.trusDateFromDateTime(this.tradeDetail_startDate);
      this.socket.requestView9(this.stockInput.code,this.stockInput.board,startDate,0,250);
    }
    else if(this.selectTab=="History" ){
      let one_day=1000*60*60*24;
      let aDate = new Date(this.history_startDate);
      let bDate = new Date(this.history_endDate);
      let diffmsDate = aDate.getTime()-bDate.getTime();
      let diffDate = Math.round(diffmsDate/one_day); 
      let endDate:any = tools.trusDateFromDateTime(this.history_endDate);
      let startDate:any = tools.trusDateFromDateTime(this.history_startDate);
      // this.socket.requestView10(this.stockInput.code,this.stockInput.board,endDate,diffDate);
      this.socket.requestView244(this.stockInput.code,this.stockInput.board,endDate,startDate);
    }
    else if( this.selectTab=="Foreign History"){
      let one_day=1000*60*60*24;
      let aDate = new Date(this.history_startDate);
      let bDate = new Date(this.history_endDate);
      let diffmsDate = aDate.getTime()-bDate.getTime();
      let diffDate = Math.round(diffmsDate/one_day); 
      let endDate:any = tools.trusDateFromDateTime(this.foreignHistory_endDate);
      let startDate:any = tools.trusDateFromDateTime(this.foreignHistory_startDate);
      // this.socket.requestView10(this.stockInput.code,this.stockInput.board,endDate,diffDate);
      this.socket.requestView244(this.stockInput.code,this.stockInput.board,endDate,startDate);
    }
  
  }
  dateBoxStart_valueChanged(e){
    if( this.selectTab=="Summary"){

      this.summary_startDate=e.value;
    }
    else if( this.selectTab=="Trade Detail"){
      this.tradeDetail_startDate=e.value;
    }
    else if( this.selectTab=="Trade History"){

      this.tradeHistory_startDate=e.value;
    }
    else if( this.selectTab=="History"){

      this.history_startDate=e.value;
    }
    else if( this.selectTab=="Foreign History"){

      this.foreignHistory_startDate=e.value;
    }
    this.requestData();
  }
  dateBoxEnd_valueChanged(e){
 
    if( this.selectTab=="Summary"){

      this.summary_endDate=e.value;
    }
    else if( this.selectTab=="Trade Detail"){ 

    }
    else if( this.selectTab=="Trade History"){
 
    }
    else if( this.selectTab=="History"){

      this.history_endDate=e.value;
    }
    else if( this.selectTab=="Foreign History"){

      this.foreignHistory_endDate=e.value;
    } 
    this.requestData();
  }
  onCellClick(info){
    
  }
  generateStockData(obj){ 

    obj['Change'] = obj['LastPrice']-obj['PreviousPrice'];
    obj['ChangePercent'] = (obj['Change']/obj['PreviousPrice']) *100;

    this.stockData['Last'] =  obj['LastPrice'];
    this.stockData['Prev'] = obj['PreviousPrice'];
    this.stockData['OpenPrice'] = obj['OpenPrice']; 
    this.stockData['AveragePrice'] = obj['AveragePrice']; 
    this.stockData['HighPrice'] = obj['HighPrice']; 
    this.stockData['LowPrice'] = obj['LowPrice']; 

    this.stockData['Chg'] = obj['Change'];
    this.stockData['ChgPct'] = obj['Change']/obj['PreviousPrice'];;
    this.stockData['ChgDisplay'] = tools.numberSignFormat(obj['Change'],0)+" ("+tools.numberSignFormat(obj['ChangePercent'],2)+"%)";
    this.stockData['Volume'] =  obj['TotalLot'];
    this.stockData['Open'] = obj['OpenPrice'];
    this.stockData['High'] = obj['HighPrice'];
    this.stockData['Low'] = obj['LowPrice'];
    this.stockData['TFreq'] = obj['TotalFreq'];
    this.stockData['Close'] = obj['PreviousPrice'];
    this.stockData['WAP'] = obj['AveragePrice'];
    this.stockData['TVal'] = obj['TotalValue'];
    this.stockData['TVol'] = obj['TotalLot'];
    this.stockData['BPercent'] = obj['BPercent']; 
    this.stockData['LastTradedLot'] = obj['LastTradedLot']; 
    this.stockData['BigBuy'] =
    this.isChangeData = true;
  }

  updateDataToScreen() {
    if(this.isChangeData) { 

      this.isChangeData = false;
    }
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
    if(this.stockInput.code==obj['ProductCode'] && this.stockInput.board==obj['BoardCode']){
      this.orderBookData=tempData;
    }
    this.isChangeData = true;
  }
  generateTradeBookData(obj){ 
    let tempArray = obj['NoTradeBookArray'];
    // for(let i=0;i<tempArray.length;i++){
    //   tempArray[i]['TLot']=tempArray[i]['BLot']+tempArray[i]['SLot'];

    // }
    this.tradeBookData = tempArray;

    this.isChangeData = true;
  }

  generateSummaryData(obj){
    this.summaryData =obj["NoBrokerArray"];
    for(let i=0;i<obj["NoBroker"];i++){
        // this.summaryData[i]["No"]=tools.kmbtFormat(i+1,0);
        this.summaryData[i]["No"]=i+1;
        this.summaryData[i]["BuyFreqFormated"]=tools.numberFormat(this.summaryData[i]["BuyFreq"],0);
        this.summaryData[i]["BuyLotFormated"]=tools.numberFormat(this.summaryData[i]["BuyLot"],0);
        this.summaryData[i]["BuyValueFormated"]=tools.kmbtFormat(this.summaryData[i]["BuyValue"],2);
        this.summaryData[i]["BuyAveragePriceFormated"]=tools.numberFormat(this.summaryData[i]["BuyAveragePrice"],0);
        this.summaryData[i]["BuyLotPercentFormated"]=tools.numberFormat(this.summaryData[i]["BuyLotPercent"],0);
        this.summaryData[i]["BuyFreqColor"]=this.summaryData[i]['BuyFreq']-this.summaryData[i]['SellFreq'];

        this.summaryData[i]["SellFreqFormated"]=tools.numberFormat(this.summaryData[i]["SellFreq"],0);
        this.summaryData[i]["SellLotFormated"]=tools.numberFormat(this.summaryData[i]["SellLot"],0);
        this.summaryData[i]["SellValueFormated"]=tools.kmbtFormat(this.summaryData[i]["SellValue"],2);
        this.summaryData[i]["SellAveragePriceFormated"]=tools.numberFormat(this.summaryData[i]["SellAveragePrice"],0);
        this.summaryData[i]["SellLotPercentFormated"]=tools.numberFormat(this.summaryData[i]["SellLotPercent"],0);
        this.summaryData[i]["SellFreqColor"]=this.summaryData[i]['SellFreq']-this.summaryData[i]['BuyFreq'];

        this.summaryData[i]["NetFreq"] =this.summaryData[i]["BuyFreq"]-this.summaryData[i]["SellFreq"];     
        this.summaryData[i]["NetLotFormated"]=tools.numberFormat(this.summaryData[i]["NetLot"],0);
        this.summaryData[i]["NetValueFormated"]=tools.kmbtFormat(this.summaryData[i]["NetValue"],2);

        this.summaryData[i]["TotalFreq"]=this.summaryData[i]["BuyFreq"]+this.summaryData[i]["SellFreq"];
        this.summaryData[i]["TotalLot"]=this.summaryData[i]["BuyLot"]+this.summaryData[i]["SellLot"];
        this.summaryData[i]["TotalValue"]=this.summaryData[i]["BuyValue"]+this.summaryData[i]["SellValue"];

        this.summaryData[i]["RawNetValue"] = this.summaryData[i]["NetValue"];
        this.summaryData[i]["RawNetLot"] = this.summaryData[i]["NetLot"];
        this.summaryData[i]["RawNetFreq"] = this.summaryData[i]["NetFreq"];
        this.summaryData[i]["BrokerName"] = this.global.getBrokerName(this.summaryData[i]["BrokerCode"]);

    }
    this.isChangeData = true;
  }
  buyColor(){
    if(this.summaryData['BuyFreqColor']>=0){
      return "green"
    } else return "red"
  }
  sellColor(){
    if(this.summaryData['SellFreqColor']>0){
      return "green"
    } else return "red"
  }
  generateTickTradeData(obj){
    if(this.stockNumber == 0){
      let tempArray = obj['NoTickTradeArray'];
      for(let i=0;i<tempArray.length;i++){
        tempArray[i]['TradeTimeDisplay']=tools.timeFormat(tempArray[i]['TradeTime']);
        tempArray[i]['Prev']=tempArray[i]['Price']-tempArray[i]['Change'];
        tempArray[i]['ChangePercent']=tools.numberFormat(tempArray[i]['Change']/tempArray[i]['Prev']*100,2);

        this.stockNumber = tempArray[i]['TradeNo'];
        if(i==0){
          this.stockNumber  = tempArray[i]['TradeNo'];
        }
        else if(this.stockNumber > tempArray[i]['TradeNo']){
          this.stockNumber  = tempArray[i]['TradeNo'];
        } 
      }
      this.tickTradeData=[];
      this.tickTradeData=tempArray;
    }
    else{
      let tempArray = obj['NoTickTradeArray'];
      for(let i=0;i<tempArray.length;i++){
        tempArray[i]['TradeTimeDisplay']=tools.timeFormat(tempArray[i]['TradeTime']);
        tempArray[i]['Prev']=tempArray[i]['Price']-tempArray[i]['Change'];
        tempArray[i]['ChangePercent']=tools.numberFormat(tempArray[i]['Change']/tempArray[i]['Prev']*100,2);
        if(!this.cekLastTradeNo(tempArray[i]['TradeNo'])){
          this.tickTradeData.push(tempArray[i]);
        }
        if(this.stockNumber > tempArray[i]['TradeNo']){
          this.stockNumber  = tempArray[i]['TradeNo'];
        }        
      } 
    }
    // this.stockNumber == 100;
    // this.tickTradeData=[101]
    this.isChangeData = true;
  }
  cekLastTradeNo(_input){
    for(let i=0;i<this.tickTradeData.length;i++){
      if(this.tickTradeData[i]['LastTradeNo']==_input) return true;
    }
    return false;
  }
  updateTickTradeData(obj){ 
    let tempArray = obj['ArrayItem']; 
    tempArray['TradeTimeDisplay']=tools.timeFormat(tempArray['TradeTime']);
    tempArray['Prev']=tempArray['Price']-tempArray['Change'];
    tempArray['ChangePercent']=tools.numberFormat(tempArray['Change']/tempArray['Prev']*100,2);
    this.tickTradeData.unshift(tempArray); 

    this.isChangeData = true;
  }
  tradeDetailButtom_Clicked(e){
    this.requestData();
  }
  generateTickTradeHistoryData(obj){
    this.tickTradeHistoryData=[];
    let tempArray = obj['NoTickTradeArray'];
    for(let i=0;i<tempArray.length;i++){
      tempArray[i]['TradeTimeDisplay']=tools.timeFormat(tempArray[i]['TradeTime']);
      tempArray[i]['Prev']=tempArray[i]['Price']-tempArray[i]['Change'];
      tempArray[i]['ChangePercent']=tools.numberFormat(tempArray[i]['Change']/tempArray[i]['Prev']*100,2);
    }
    this.tickTradeHistoryData=tempArray;
    this.isChangeData = true;
  }
  generateHistoryData(obj){
    this.historyData=[];
    let tempData = obj['NoDateArray'];
    for(let i=0;i<tempData.length;i++){
      tempData[i]["DateDisplay"] = tools.dateStyle(tempData[i]['Date'],5);
      tempData[i]["ForeignNetValue"] = tempData[i]["ForeignBuyValue"]-tempData[i]["ForeignSellValue"];
      tempData[i]["ForeignNetLot"] = tempData[i]["ForeignBuyLot"]-tempData[i]["ForeignSellLot"];
      tempData[i]["Change"] = tempData[i]["LastPrice"]-tempData[i]["PreviousPrice"];
      tempData[i]["ChangePercent"] = tempData[i]["Change"]/tempData[i]["PreviousPrice"]*100;
      tempData[i]["ForeignBuyAvg"] = tempData[i]["ForeignBuyValue"]/tempData[i]["ForeignBuyLot"];
      tempData[i]["ForeignSellAvg"] = tempData[i]["ForeignSellValue"]/tempData[i]["ForeignSellLot"];
       
    }
    this.historyData=tempData;
    this.isChangeData = true;
  }
  stockInput_onChange(e){
    this.requestData()
  }
  onToolbarPreparingSummary(e){
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
        value:this.summary_startDate,
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
        value:this.summary_endDate,
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
  

  onToolbarPreparingTickTrade(e){
    e.toolbarOptions.visible = false;
    /*e.toolbarOptions.items.unshift(  {
      location: 'after',
      widget: 'dxButton',
      options: {
          icon: 'refresh',
          onClick: this.requestData.bind(this)
      }
    })*/
  }
  onToolbarPreparingTradeHistory(e){
    e.toolbarOptions.visible = false;
    /*e.toolbarOptions.items.unshift({
      location: 'before',
      template: 'As of Date'
    }, {
      location: 'before',
      widget: 'dxDateBox',
      options: {
        displayFormat:"d MMM yyyy",
        min:this.minDate,
        max:this.maxDate,
        value:this.tradeHistory_startDate,
        applyValueMode: "useButtons",
        onValueChanged:this.dateBoxStart_valueChanged.bind(this)
        
      }
    },  {
      location: 'after',
      widget: 'dxButton',
      options: {
          icon: 'refresh',
          onClick: this.requestData.bind(this)
      }
    })*/
  }
  onToolbarPreparingHistory(e){
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
        value:this.history_startDate,
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
        value:this.history_endDate,
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
  onToolbarPreparingForeignHistory(e){
    e.toolbarOptions.visible = false;
    /*e.toolbarOptions.items.unshift(
    {
      location: 'before',
      template: 'From'
    }, {
      location: 'before',
      widget: 'dxDateBox',
      options: {
        displayFormat:"d MMM yyyy",
        min:this.minDate,
        max:this.maxDate,
        value:this.foreignHistory_startDate,
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
        value:this.foreignHistory_endDate,
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

  box1_onChange(e){
    this.stockInput.codeNboard=e.value;
    this.stockInput.isNeedRequest = true;
    this.updateCodeNBoard();
    this.requestData();

    let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
    x.select();
  }
  box1_onFocus(e){  

    this.stockInput.isOpen=true; 
    
  }

  box1_onOpened(e){  
 
    let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
    x.select();
    
  }
  box1_onFocusOut(e){  

    this.stockInput.code=this.stockInput.code;
    
  }
  box1_onEnter(e){ 
    let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
    x.select();
    
  }
  
  box1_onKeyDown(e){

    var textComponent = document.getElementById(this.getId()) as HTMLInputElement;
    var selectedText;
  
    if (textComponent.selectionStart !== undefined)
    {// Standards Compliant Version
      var startPos = textComponent.selectionStart;
      var endPos = textComponent.selectionEnd;
      selectedText = textComponent.value.substring(startPos, endPos);
    } 
    if(textComponent.value.length-selectedText.length>10){

      let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
      x.select();
    }

  }
  getId(){
    return "stockQuote-"+this.quoteId;
  } 
  updateCodeNBoard(){
    let temp = this.stockInput.codeNboard.split(".");
    this.stockInput.code=temp[0];
    this.stockInput.board=temp[1];
  }
  buyFreqColor(BuyFreq){
    if (BuyFreq >= 0){
      return "f-green"
    }else return "f-red"
  }
  sellFreqColor(BFreq,SFreq){
    if (SFreq >= 0){
      return "f-green"
    }else return "f-red"
  }
  moreClickedTradeDetail(){
    this.socket.requestView8(this.stockInput.code,this.stockInput.board,this.stockNumber,100);
  }
  moreClickedTradeHistory(){
    this.socket.requestView8(this.stockInput.code,this.stockInput.board,this.stockNumber,100);
  }
}
