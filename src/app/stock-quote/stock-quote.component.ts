import { Component, OnInit, Input } from '@angular/core';
import { Socket } from '../socket';
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { global } from '../global';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms'; 
@Component({
  selector: 'app-stock-quote',
  templateUrl: './stock-quote.component.html',
  styleUrls: ['./stock-quote.component.scss']
})
export class StockQuoteComponent implements OnInit {
  myControl = new FormControl();
  @Input("quoteId") quoteId;
  @Input("quoteCode") quoteCode;
  @Input("quoteBoard") quoteBoard; 

  constructor(
    private socket:Socket,
    public global:global,
    ) { }

  isChangeDataBox1 = false;
  updateThreadOrderBook;
  tabs = [ 
    { text: "Order Book", display: "Order Book", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Trade Book", display: "Trade Book", icon: "comment", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Top Buy & Seller", display: "Top Buy & Seller", icon: "comment", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" }
  ];
  selectTab = "Order Book";

  inputData = {
    "box1":{
      "isNeedRequest":true,
      "isOpen":false,
      "code": "TLKM",
      "codeNboard": "TLKM.RG",
      "board": "RG", 
      "data":{},
      "orderBook":{}
    },

  };

  displayData={ 
    "orderBook1":[], 
    "orderBook1Display":[], 
    "tradeBook":[], 
    "tradeBookDisplay":[], 
    "topBuySell":[],
    "topBuySellDisplay":[]
  }
  dsStockList;
  maxData=0;
  filteredOptions: Observable<string[]>;

  ngOnInit() {
 

    messageCenter.addRespone('view1', (obj)=>{ 
      this.generateStockData(obj); 
    }); 
    messageCenter.addRespone('autoUpdate1', (obj)=>{ 
      this.generateStockData(obj); 
    });

    messageCenter.addRespone('view2', (obj)=>{
      this.generateOrderBookData(obj); 
    });
    messageCenter.addRespone('autoUpdate3', (obj)=>{ 
      this.generateOrderBookData(obj); 
    }); 

    messageCenter.addRespone('view7', (obj)=>{
      this.generateTradeBookData(obj); 
    });

    messageCenter.addRespone('autoUpdate4', (obj)=>{ 
      this.generateTradeBookData(obj); 
    }); 
    messageCenter.addRespone('view6', (obj)=>{

      this.generateTopBuySellData(obj); 
 

    });
    if(this.global.getMarketInfoData(this.quoteId)==null)  {
      if(this.quoteId=="1") {
        this.inputData = {
          "box1":{
            "isNeedRequest":true,
            "isOpen":false,
            "codeNboard": "TLKM.RG",
            "code":"TLKM",
            "board":"RG", 
            "data":{},
            "orderBook":{}
          }, 
        };
        console.log(this.inputData)
      }
      else if(this.quoteId=="2"){
        this.inputData = {
          "box1":{
            "isNeedRequest":true,
            "isOpen":false,
            "codeNboard": "ZONE.RG",
            "code":"ZONE",
            "board":"RG", 
            "data":{},
            "orderBook":{}
          }, 
        };
      }
      else if(this.quoteId=="3"){
        this.inputData = {
          "box1":{
            "isNeedRequest":true,
            "isOpen":false,
            "codeNboard": "GGRM.RG",
            "code":"GGRM",
            "board":"RG", 
            "data":{},
            "orderBook":{}
          }, 
        };
      }
      else if(this.quoteId=="4"){
        this.inputData = {
          "box1":{
            "isNeedRequest":true,
            "isOpen":false,
            "codeNboard": "WIKA.RG",
            "code":"WIKA",
            "board":"RG", 
            "data":{},
            "orderBook":{}
          }, 
        };
      }
      this.global.setMarketInfoData(this.quoteId,this.inputData);
    }
    else{
      this.inputData=this.global.getMarketInfoData(this.quoteId);
      this.inputData.box1.isNeedRequest=true; 
    }


    this.updateThreadOrderBook = setInterval(()=>{ this.updateDataOrderBookToScreen(); }, 1000);
    setTimeout(() => {
      this.calcMaxData();
    }, 500);

   
  }
  ngAfterViewInit(){
    this.requestData("");
    setTimeout(()=>{
      this.dsStockList = this.global.getdsStockList();
    },500);

    setTimeout(()=>{
      this.dsStockList = this.global.getdsStockList();
    },5000);

  }
  ngOnDestroy(){

    messageCenter.delRespone('view1');
    messageCenter.delRespone('autoUpdate1');
    messageCenter.delRespone('view2');
    messageCenter.delRespone('autoUpdate3');
    messageCenter.delRespone('view7');
    messageCenter.delRespone('autoUpdate4');
    messageCenter.delRespone('view6');

    if(this.updateThreadOrderBook) clearInterval(this.updateThreadOrderBook );
    this.updateCodeNBoard();
    this.socket.requestAutoUpdate1(0,this.inputData.box1.code,this.inputData.box1.board); 
    this.socket.requestAutoUpdate3(0,this.inputData.box1.code,this.inputData.box1.board);

    
  } 
  requestData(_oldData){  
      let currBox=this.inputData.box1;
      this.updateCodeNBoard();
      if(this.selectTab=="Order Book"){
        
        if(currBox.isNeedRequest){ 
          if(_oldData!=currBox.codeNboard){
            this.socket.requestAutoUpdate1(0,currBox.code,currBox.board);  
            this.socket.requestAutoUpdate3(0,currBox.code,currBox.board);
          }
          this.socket.requestView1(currBox.code,currBox.board);
          this.socket.requestAutoUpdate1(1,currBox.code,currBox.board); 
          this.socket.requestView2(currBox.code,currBox.board,20);
          this.socket.requestAutoUpdate3(1,currBox.code,currBox.board);
          
          currBox.isNeedRequest = false;
        }
        
      }
      else  if(this.selectTab=="Trade Book"){
        if(currBox.isNeedRequest){ 
          if(_oldData!=currBox.codeNboard){
            this.socket.requestAutoUpdate1(0,currBox.code,currBox.board);  
            this.socket.requestAutoUpdate4(0,currBox.code,currBox.board);
          }
          this.socket.requestView1(currBox.code,currBox.board);
          this.socket.requestAutoUpdate1(1,currBox.code,currBox.board); 
          this.socket.requestView7(currBox.code,currBox.board);
          this.socket.requestAutoUpdate4(1,currBox.code,currBox.board);
          
          currBox.isNeedRequest = false;
        }
        
      }
      else  if(this.selectTab=="Top Buy & Seller"){

  	    this.socket.requestView6(currBox.code,currBox.board,20);
      }
      
  }
  box1_checker(e){

    for(let i =0; i<this.dsStockList._items.length; i++){
      if(this.dsStockList._items[i]['ProductFullName'].includes(e ,0)){
        return true;
      }
    }
    return false;
  }

  box1_onChange(e){
    // if(this.box1_checker(e.value)){ 

    this.inputData.box1.codeNboard=e.value;
    this.inputData.box1.isNeedRequest = true;
    this.updateCodeNBoard();
    this.requestData(e.previousValue);
    let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
    x.select();
  // }
  //  //else{
  //    this.inputData.box1.codeNboard = e.previousValue;
  //    let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
  //   x.select();
  //  }
  }
  box1_onFocus(e){  

    this.inputData.box1.isOpen=true; 
    
  }

  box1_onOpened(e){  
 
    let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
    x.select();
    
  }
  box1_onFocusOut(e){  

    this.inputData.box1.code=this.inputData.box1.code;
    
  }
  box1_onEnter(e){ 
    //if(this.box1_checker(e.value)){
      let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
      x.select();
   // }    
    // else{
    //   this.inputData.box1.codeNboard = e.previousValue;
    //   let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
    //  x.select();
    // }
  }


  updateDataOrderBookToScreen(){
    if(this.isChangeDataBox1){
      this.displayData.orderBook1 = Object.assign([], this.inputData['box1']['orderbook']);
      this.displayData.orderBook1Display=[];
      for(let i=0;i<this.displayData.orderBook1.length;i++){
        if(i<this.maxData){
          let item = this.displayData.orderBook1[i];
          this.displayData.orderBook1Display.push(item);
        }
      } 

      this.isChangeDataBox1 = false;
    }
  }
  generateStockData(obj){ 
    let tempData = obj;
    
    tempData['Change'] =  parseFloat(tempData['LastPrice'])-parseFloat(tempData['PreviousPrice']); 
    tempData['ChangePercent'] = tempData['Change']/tempData['PreviousPrice']*100 ;
    tempData['ChgDisplay'] = tools.numberSignFormat(tempData['Change'],0)+"("+tools.numberSignFormat(tempData['ChangePercent'],2)+"%)";

    if(this.inputData['box1']['code']==tempData['ProductCode'] && this.inputData['box1']['board']==obj['BoardCode']){
      this.inputData['box1']['data']=tempData;
      this.isChangeDataBox1=true;
    } 
    // this.isChangeData = true;
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
          tempArray['OfferLotChange']="x";
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
          tempArray['BidLotChange']="x";
          tempArray['OfferPrice']=obj['NoOfferArray'][i]['OfferPrice'];
          tempArray['OfferLot']=obj['NoOfferArray'][i]['OfferLot'];
          tempArray['OfferVol']=obj['NoOfferArray'][i]['OfferVol'];
          tempArray['OfferLotChange']=obj['NoOfferArray'][i]['OfferLotChange'];
          tempData.push(tempArray);
        }
      }
      if(this.inputData['box1']['code']==obj['ProductCode'] && this.inputData['box1']['board']==obj['BoardCode']){
        this.inputData['box1']['orderbook']=tempData;
        this.isChangeDataBox1=true;
      } 
     
    // this.isChangeData = true;
  }
  calcMaxData(){
    if(this.selectTab=="Order Book"){
        
      let contentHight = document.getElementById("odrerBookIdX").parentElement.offsetHeight ;

      let tempMaxData = Math.floor(contentHight/18);
  
      if(this.maxData!=tempMaxData) {
        this.maxData=tempMaxData; 
        this.displayData.orderBook1Display=[]; 
      }
    }

    if(this.selectTab=="Top Buy & Seller"){
        
      let contentHight = document.getElementById("odrerBookIdX").parentElement.offsetHeight ;
 
      let tempMaxData = Math.floor(contentHight/18);
  
      if(this.maxData!=tempMaxData) {
        this.maxData=tempMaxData; 
        this.displayData.topBuySellDisplay=[]; 
      }
    }

  
  }
  onLoad(event){
    
  }
  onResize(event) {
    let contentHight = document.getElementById("odrerBookIdX").parentElement.offsetHeight  ;
 
    let tempMaxData = Math.floor(contentHight/18);

    if(this.maxData!=tempMaxData) {
      this.maxData=tempMaxData; 
      this.displayData.orderBook1Display=[]; 
    }
 
  } 
  sqSetBg(index){
  
    let value:number = 0;
    value = index%2;
    if(value==0){
      return "tableData-0";
    } else {
      return "tableData-1";
    } 
  }

  getId(){
    return "stockQuote-"+this.quoteId;
  } 
  box1_onKeyDown(e){


    var textComponent = document.getElementById(this.getId()) as HTMLInputElement;
    var selectedText;
      if (textComponent.selectionStart !== undefined)
      {// Standards Compliant Version
        var startPos = textComponent.selectionStart;
        var endPos = textComponent.selectionEnd;
        //if(this.box1_checker(e.value)){}  
        selectedText = textComponent.value.substring(startPos, endPos);
      } 
      if(textComponent.value.length-selectedText.length>10){

        this.inputData.box1.codeNboard = e.previousValue;
        let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
        x.select();
      }
    // else{
    // this.inputData.box1.codeNboard = e.previousValue;
    //  let x = document.getElementById("stockQuote-"+this.quoteId) as HTMLInputElement;  
    // x.select();
    // }
  }
  updateCodeNBoard(){
    let temp = this.inputData.box1.codeNboard.split(".");
    this.inputData.box1.code=temp[0];
    this.inputData.box1.board=temp[1];
  }
    
  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text;
    this.inputData.box1.isNeedRequest = true;
    this.requestData(this.quoteCode);
  }
  generateTradeBookData(obj){  
    if(this.inputData['box1']['code']==obj['ProductCode'] && this.inputData['box1']['board']==obj['BoardCode']){
      let tempData=[];
      let tempArray = obj['NoTradeBookArray'];
      this.displayData.tradeBook = tempArray;
      this.displayData.tradeBookDisplay = tempArray;
    }
  }
  generateTopBuySellData(obj){
    let tempData=[];

    if(obj['NoBrokerBuy']==obj['NoBrokerSell']){
      for(let i=0;i<obj['NoBrokerBuy'];i++){
        let tempArray = [];
        tempArray['BrokerBuyCode']=obj['NoBrokerBuyArray'][i]['BrokerBuyCode'];
        tempArray['BrokerBuyAvgPrice']=obj['NoBrokerBuyArray'][i]['BrokerBuyAvgPrice'];
        tempArray['BrokerBuyForeignFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignFreq'];
        tempArray['BrokerBuyForeignLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignLot'];
        tempArray['BrokerBuyForeignValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignValue'];
        tempArray['BrokerBuyFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyFreq'];
        tempArray['BrokerBuyLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyLot'];
        tempArray['BrokerBuyValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyValue'];

        tempArray['BrokerSellCode']=obj['NoBrokerSellArray'][i]['BrokerSellCode'];
        tempArray['BrokerSellAvgPrice']=obj['NoBrokerSellArray'][i]['BrokerSellAvgPrice'];
        tempArray['BrokerSellForeignFreq']=obj['NoBrokerSellArray'][i]['BrokerSellForeignFreq'];
        tempArray['BrokerSellForeignLot']=obj['NoBrokerSellArray'][i]['BrokerSellForeignLot'];
        tempArray['BrokerSellForeignValue']=obj['NoBrokerSellArray'][i]['BrokerSellForeignValue'];
        tempArray['BrokerSellFreq']=obj['NoBrokerSellArray'][i]['BrokerSellFreq'];
        tempArray['BrokerSellLot']=obj['NoBrokerSellArray'][i]['BrokerSellLot'];
        tempArray['BrokerSellValue']=obj['NoBrokerSellArray'][i]['BrokerSellValue'];
        tempData.push(tempArray);
      }
    }
    else if(obj['NoBrokerBuy']>obj['NoBrokerSell']){
      let j=0;
      for(let i=0;i<obj['NoBrokerSell'];i++,j++){
        let tempArray = [];
        tempArray['BrokerBuyCode']=obj['NoBrokerBuyArray'][i]['BrokerBuyCode'];
        tempArray['BrokerBuyAvgPrice']=obj['NoBrokerBuyArray'][i]['BrokerBuyAvgPrice'];
        tempArray['BrokerBuyForeignFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignFreq'];
        tempArray['BrokerBuyForeignLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignLot'];
        tempArray['BrokerBuyForeignValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignValue'];
        tempArray['BrokerBuyFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyFreq'];
        tempArray['BrokerBuyLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyLot'];
        tempArray['BrokerBuyValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyValue'];

        tempArray['BrokerSellCode']=obj['NoBrokerSellArray'][i]['BrokerSellCode'];
        tempArray['BrokerSellAvgPrice']=obj['NoBrokerSellArray'][i]['BrokerSellAvgPrice'];
        tempArray['BrokerSellForeignFreq']=obj['NoBrokerSellArray'][i]['BrokerSellForeignFreq'];
        tempArray['BrokerSellForeignLot']=obj['NoBrokerSellArray'][i]['BrokerSellForeignLot'];
        tempArray['BrokerSellForeignValue']=obj['NoBrokerSellArray'][i]['BrokerSellForeignValue'];
        tempArray['BrokerSellFreq']=obj['NoBrokerSellArray'][i]['BrokerSellFreq'];
        tempArray['BrokerSellLot']=obj['NoBrokerSellArray'][i]['BrokerSellLot'];
        tempArray['BrokerSellValue']=obj['NoBrokerSellArray'][i]['BrokerSellValue'];
        tempData.push(tempArray);
      }
      for(let i=j;i<obj["NoBrokerBuy"];i++){
        let tempArray = [];
        tempArray['BrokerBuyCode']=obj['NoBrokerBuyArray'][i]['BrokerBuyCode'];
        tempArray['BrokerBuyAvgPrice']=obj['NoBrokerBuyArray'][i]['BrokerBuyAvgPrice'];
        tempArray['BrokerBuyForeignFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignFreq'];
        tempArray['BrokerBuyForeignLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignLot'];
        tempArray['BrokerBuyForeignValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignValue'];
        tempArray['BrokerBuyFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyFreq'];
        tempArray['BrokerBuyLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyLot'];
        tempArray['BrokerBuyValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyValue'];

        tempArray['BrokerSellCode']=" ";
        tempArray['BrokerSellAvgPrice']=0;
        tempArray['BrokerSellForeignFreq']=0;
        tempArray['BrokerSellForeignLot']=0;
        tempArray['BrokerSellForeignValue']=0;
        tempArray['BrokerSellFreq']=0;
        tempArray['BrokerSellLot']=0;
        tempArray['BrokerSellValue']=0;
        tempData.push(tempArray);
      }
    } 
    else if(obj['NoBrokerBuy']<obj['NoBrokerSell']){
      let j=0;
      for(let i=0;i<obj['NoBrokerBuy'];i++,j++){
        let tempArray = [];
        tempArray['BrokerBuyCode']=obj['NoBrokerBuyArray'][i]['BrokerBuyCode'];
        tempArray['BrokerBuyAvgPrice']=obj['NoBrokerBuyArray'][i]['BrokerBuyAvgPrice'];
        tempArray['BrokerBuyForeignFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignFreq'];
        tempArray['BrokerBuyForeignLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignLot'];
        tempArray['BrokerBuyForeignValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyForeignValue'];
        tempArray['BrokerBuyFreq']=obj['NoBrokerBuyArray'][i]['BrokerBuyFreq'];
        tempArray['BrokerBuyLot']=obj['NoBrokerBuyArray'][i]['BrokerBuyLot'];
        tempArray['BrokerBuyValue']=obj['NoBrokerBuyArray'][i]['BrokerBuyValue'];

        tempArray['BrokerSellCode']=obj['NoBrokerSellArray'][i]['BrokerSellCode'];
        tempArray['BrokerSellAvgPrice']=obj['NoBrokerSellArray'][i]['BrokerSellAvgPrice'];
        tempArray['BrokerSellForeignFreq']=obj['NoBrokerSellArray'][i]['BrokerSellForeignFreq'];
        tempArray['BrokerSellForeignLot']=obj['NoBrokerSellArray'][i]['BrokerSellForeignLot'];
        tempArray['BrokerSellForeignValue']=obj['NoBrokerSellArray'][i]['BrokerSellForeignValue'];
        tempArray['BrokerSellFreq']=obj['NoBrokerSellArray'][i]['BrokerSellFreq'];
        tempArray['BrokerSellLot']=obj['NoBrokerSellArray'][i]['BrokerSellLot'];
        tempArray['BrokerSellValue']=obj['NoBrokerSellArray'][i]['BrokerSellValue'];
        tempData.push(tempArray);
      }
      for(let i=j;i<obj['NoBrokerSell'];i++){
        let tempArray = [];
        tempArray['BrokerBuyCode']=" ";
        tempArray['BrokerBuyAvgPrice']=0;
        tempArray['BrokerBuyForeignFreq']=0;
        tempArray['BrokerBuyForeignLot']=0;
        tempArray['BrokerBuyForeignValue']=0;
        tempArray['BrokerBuyFreq']=0;
        tempArray['BrokerBuyLot']=0;
        tempArray['BrokerBuyValue']=0;

        tempArray['BrokerSellCode']=obj['NoBrokerSellArray'][i]['BrokerSellCode'];
        tempArray['BrokerSellAvgPrice']=obj['NoBrokerSellArray'][i]['BrokerSellAvgPrice'];
        tempArray['BrokerSellForeignFreq']=obj['NoBrokerSellArray'][i]['BrokerSellForeignFreq'];
        tempArray['BrokerSellForeignLot']=obj['NoBrokerSellArray'][i]['BrokerSellForeignLot'];
        tempArray['BrokerSellForeignValue']=obj['NoBrokerSellArray'][i]['BrokerSellForeignValue'];
        tempArray['BrokerSellFreq']=obj['NoBrokerSellArray'][i]['BrokerSellFreq'];
        tempArray['BrokerSellLot']=obj['NoBrokerSellArray'][i]['BrokerSellLot'];
        tempArray['BrokerSellValue']=obj['NoBrokerSellArray'][i]['BrokerSellValue'];
        tempData.push(tempArray);
      }
    }
    if(this.inputData['box1']['code']==obj['ProductCode'] && this.inputData['box1']['board']==obj['BoardCode']){
      this.displayData['topBuySell']=tempData;
       
      this.displayData.topBuySellDisplay=[];
      for(let i=0;i<this.displayData.topBuySell.length;i++){
        if(i<this.maxData){
          let item = this.displayData.topBuySell[i];
          this.displayData.topBuySellDisplay.push(item);
        }
      } 


      // this.displayData['topBuySellDisplay']=tempData;
      this.isChangeDataBox1=true;
    } 
  }
}