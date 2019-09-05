import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import { Router } from '@angular/router';
import { global } from '../global';
import DataSource from "devextreme/data/data_source";
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { CheckboxControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.scss']
})
export class AnalysisComponent implements OnInit {
  quoteId = "110";
  stockInput = {
    "code":"TLKM",
    "board":"RG",
    "codeNboard": "TLKM.RG",
    "isNeedRequest":true,
    "isOpen":false,
    "type":"Annually",
    "interval":"Daily"
  } 
  indexInput = {
    "code":"COMPOSITE",
    "interval":"Daily"
  }
  tabs = [
    { text: "Financial Report", display: "Financial Report", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Stock Chart", display: "Stock Chart", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Index Chart", display: "Index Chart", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" }
  ];
  dsType = [
      "Annually",
      "Quarterly",
      "Cummulative Quarter 4",
      "Cummulative Quarter 3",
      "Cummulative Quarter 2",
      "Cummulative Quarter 1",
      "Quarter 4",
      "Quarter 3",
      "Quarter 2",
      "Quarter 1"
    ];
  dsInterval = [
    "1 Minute",
    "5 Minute",
    "15 Minute",
    "30 Minute",
    "1 Hour",
    "Daily",
    "Weekly",
    "Monthly",
  ];
  selectTab = "Financial Report";
  dsStockList:DataSource;
  dsStockOnlyList:DataSource;
  dsIndexList=[
    "AGRI",
    "BASIC-IND",
    "BISNIS-27",
    "COMPOSITE",
    "CONSUMER",
    "DBX",
    "FINANCE",
    "IDX30",
    "INFOBANK15",
    "INFRASTRUC",
    "ISSI",
    "JII",
    "KOMPAS100",
    "LQ45",
    "MANUFACTUR",
    "MBX",
    "MINING",
    "MISC-IND",
    "MNC36",
    "PEFINDO25",
    "PROPERTY",
    "SMinfra18",
    "SRI-KEHATI",
    "TRADE",
  ];
  dsStockChart = [];
  dsIndexChart = [];
  data ={
    data1:[],
    data118:[]
  }

  dataRow = [
    {type:'normal', label: 'Financial Statement Date', field: 'FinancialDate', yoyValue: false, content:[], color:false, format:'', isdate: true},
    {type:'normal', label: 'Currency', field: 'Currency', yoyValue: false,content:[], color:false, format:''},
    {type:'normal', label: 'Fiscal Year Ends', field: 'FinancialYearEnd', yoyValue: false,content:[], color:false, format:''},
    {type:'normal', label: 'Month Covered in Income Statment', field: 'MonthCovered', yoyValue: false,content:[], color:false, format:''},
    {type:'empty', label: '', field: '', yoyValue: false,content:[], color:false, format:''},
    {type:'yoy', label: '', field: '', yoyValue: false,content:[], color:false, format:''},
    {type:'header', label: 'Summary of Balance Sheets', field: '', yoyValue: false,content:[], color:false, format:''},
    {type:'indent', label: 'Inventories', field: 'Inventories', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Currency Assets', field: 'CurrentAssets', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Fix Assets', field: 'FixedAssets', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Total Assets', field: 'TotalAssets', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Currency Liabilities', field: 'CurrentLiabilities', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Long term Liabilities', field: 'LongtermLiabilities', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Total Liabilities', field: 'TotalLiabilities', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Authorized', field: 'Authorized', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Paid-up Capital', field: 'PaidupCapital', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Par Value', field: 'ParValue', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Paid-up Capital Shares', field: 'PaidupCapitalShares', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Retained Earnings', field: 'RetainedEarnings', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Total Equity', field: 'TotalEquity', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Minority Interest', field: 'MinorityInterest', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Receicables', field: 'Receivables', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'header', label: 'Summary of Income Statement', field: '', yoyValue: false,content:[], color:false, format:''},
    {type:'indent', label: 'Total Sales', field: 'TotalSales', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Cost of Good Sold', field: 'CostofGoodSold', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Gross Profit', field: 'GrossProfit', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Operating Profit', field: 'OpeningProfit', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Other Income', field: 'OtherIncome', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Earning Before Tax', field: 'EarningBeforeTax', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Tax', field: 'Tax', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Net Income', field: 'NetIncome', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'header', label: 'Per Share Data', field: '', yoyValue: false,content:[], color:false, format:''},
    {type:'indent', label: 'Earning Per Shares (IDR)', field: 'EPS', yoyValue: true,content:[], color:true, format:'number'},
    {type:'indent', label: 'Book Value (IDR)', field: 'BV', yoyValue: true,content:[], color:true, format:'number'},
    {type:'indent', label: 'Price Earning Ratio (PER)', field: 'PER', yoyValue: true,content:[], color:true, format:'number'},
    {type:'header', label: 'Financial Ratios', field: '', yoyValue: false,content:[], color:false, format:''},
    {type:'indent', label: 'Debt Equity Ratio (x)', field: 'DER', yoyValue: true,content:[], color:true, format:'number'},
    {type:'indent', label: 'Return On Assets (%)', field: 'ROA', yoyValue: true,content:[], color:true, format:'number'},
    {type:'indent', label: 'Return On Equity (%)', field: 'ROE', yoyValue: true,content:[], color:true, format:'number'},
    {type:'indent', label: 'Net Profit Margin (%)', field: 'NPM', yoyValue: true,content:[], color:true, format:'number'},
    {type:'indent', label: 'Operating Profit Margin (%)', field: 'OPM', yoyValue: true,content:[], color:true, format:'number'},
    {type:'header', label: 'Cash Flow', field: '', yoyValue: false,content:[], color:false, format:''},
    {type:'indent', label: 'Cash Flow from Operating Activities', field: 'CashFlowFromOperatingActivities', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Cash Flow from Investing Activities', field: 'CashFlowFromInvestingActivities', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Cash Flow from Financial Activities', field: 'CashFlowFromFinancingActivities', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Net Increase in Cash & Cash Equivalent', field: 'NetIncreaseInCash', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Cash & Cash Equivalent at the Begining of the Year', field: 'CashBegin', yoyValue: true,content:[], color:true, format:'kmbt'},
    {type:'indent', label: 'Cash & Cash Equivalent at the End of the Year', field: 'CashEnd', yoyValue: true,content:[], color:true, format:'kmbt'},
  ];

  constructor(
    private router: Router,
    private socket:Socket,
    public global:global,
    ) { }

  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);

    messageCenter.addRespone('view118', (obj)=>{   
        this.data.data118=[];
        for(let i=0;i<obj['Data'].length;i++){
            let item = obj['Data'][i];
            item['PER']=this.data.data1['LastPrice']/item['EPS'];
            // item['date']=new Date(tools.trusDateFromDateTime(item['FinancialDate']));
            this.data.data118.push(item);
        } 

        for(let i=0;i<this.dataRow.length;i++){
          let tmp = [];
          let row = this.dataRow[i];

          for(let j=0;j<this.data.data118.length;j++){
            let tmpCol = {};
            let col = this.data.data118[j];

            if(row.type == 'normal' || row.type == 'indent'){
              tmpCol = { value: col[row.field], isyoy:false }
            }else if(row.type == 'empty' || row.type == 'header'){
              tmpCol = { value: ' ',isyoy:false }
            }else if(row.type == 'yoy'){
              tmpCol = { value: '0', isyoy:false }
            }

            if(row.isdate){
              tmpCol = { value: this.global.dateFormat(col[row.field]+''), isyoy:false }
            }
            
            tmp.push(tmpCol);
            if(this.stockInput.type != 'Quarterly' && j < this.data.data118.length-1){
              if(row.type=="yoy"){
                tmp.push({ value: 'YoY (%)',isyoy:false });
              }else{
                if(!row.yoyValue){
                  tmp.push({value: ' ', isyoy:false});
                }else{
                  //calc yoy
                  //tmp.push({value: '1'});
                  if(j < this.data.data118.length-1){
                    let yoyValue = (col[row.field] - this.data.data118[j+1][row.field])/ (this.data.data118[j+1][row.field] == 0 ? 1 : this.data.data118[j+1][row.field] ) * 100;
                    if(this.data.data118[j+1][row.field] == 0) yoyValue = 0;
                    tmp.push({value: yoyValue, isyoy:true});
                  }
                }
              }
              
            }

          }
          this.dataRow[i].content = tmp;
        }
    });

    

    messageCenter.addRespone('view1', (obj)=>{   
      this.data.data1=Object.assign([],obj);
    });

    messageCenter.addRespone('view59', (obj)=>{
      let ProductChartData =[];

      for(let i =obj['NoDataArray'].length-1,j=0;i>=0;i--,j++) {
          let tempId = obj['NoDataArray'][i];
          let temp = {
              Date:tools.dateFormat(tempId['Date'],"YYYY-mm-DD"),
              Time:tools.timeFormat(tempId['Time']),
              DateTime:new Date(tools.dateFormat(tempId['Date'],"YYYY-mm-DD") + " " + tools.timeFormat(tempId['Time'])),
              Open:tempId['OpenPrice'],
              High:tempId['HighPrice'],
              Low:tempId['LowPrice'],
              Close:tempId['ClosePrice'],
              Volume:tempId['Volume'],
              Adj_Close:0,
              };
          ProductChartData[j]=temp;
      }
      if(ProductChartData.length==0){
        let dataNull = {
              Date:this.global.getCurrentDate(),
              Time:'00:00:00',
              DateTime:new Date(),
              Open:0,
              High:0,
              Low:0,
              Close:0,
              Volume:0,
              Adj_Close:0,
              };
        ProductChartData.push(dataNull);
      } 
      this.dsStockChart=ProductChartData;
    });
    messageCenter.addRespone('view60', (obj)=>{
      let ProductChartData =[];

      for(let i =obj['NoDataArray'].length-1,j=0;i>=0;i--,j++) {
          let tempId = obj['NoDataArray'][i];
          let temp = {
              Date:tools.dateFormat(tempId['Date'],"YYYY-mm-DD"),
              Time:tools.timeFormat(tempId['Time']),
              DateTime:new Date(tools.dateFormat(tempId['Date'],"YYYY-mm-DD") + " " + tools.timeFormat(tempId['Time'])),
              Open:tempId['OpenIndices'],
              High:tempId['HighIndices'],
              Low:tempId['LowIndices'],
              Close:tempId['CloseIndices'],
              Volume:tempId['Volume'],
              Adj_Close:0,
              };
          ProductChartData[j]=temp;
      }
      if(ProductChartData.length==0){
        let dataNull = {
              Date:this.global.getCurrentDate(),
              Time:'00:00:00',
              DateTime:new Date(),
              Open:0,
              High:0,
              Low:0,
              Close:0,
              Volume:0,
              Adj_Close:0,
              };
        ProductChartData.push(dataNull);
      } 
      this.dsIndexChart=ProductChartData;
    });
    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);
    this.requestData();
  }
  ngAfterViewInit(){
 
    setTimeout(()=>{
      this.dsStockList = this.global.getdsStockList();
      this.dsStockOnlyList = this.global.getdsStockOnlyList();
    },500);
  }
  ngOnDestroy(){ 
    messageCenter.delRespone('view1'); 
    messageCenter.delRespone('view59');
    messageCenter.delRespone('view60'); 
    messageCenter.delRespone('view118'); 
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]);  
  }
  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text;
    this.requestData();
  }

  checkClass(row, col){
    let res = '';
    if(row.type == 'header') res = 'bg-header';
    if(row.color) res += ' '+ this.global.colorFormat(col.value);
    if(row.type == 'normal' || row.type == 'yoy') res += ' center'; 
    return res;
  }

  requestData(){ 
    if(this.selectTab=="Financial Report"){
        let typeSend = '0';
        if(this.stockInput.type=="Annually") typeSend='1';
        else if(this.stockInput.type=="Cummulative Quarter 4") typeSend='1';
        else if(this.stockInput.type=="Cummulative Quarter 3") typeSend='2';
        else if(this.stockInput.type=="Cummulative Quarter 2") typeSend='3';
        else if(this.stockInput.type=="Cummulative Quarter 1") typeSend='4';
        else if(this.stockInput.type=="Quarter 4") typeSend='5';
        else if(this.stockInput.type=="Quarter 3") typeSend='6';
        else if(this.stockInput.type=="Quarter 2") typeSend='7';
        else if(this.stockInput.type=="Quarter 1") typeSend='8';
        else if(this.stockInput.type=="Quarterly") typeSend='9';
 
        this.socket.requestView1(this.stockInput.code,"RG");
        setTimeout(()=>{this.socket.requestView118(this.stockInput.code,10,typeSend); },100);
    }
    else if(this.selectTab=="Stock Chart"){
      this.requestStockChartData();
    }
    else if(this.selectTab=="Index Chart"){
      this.requestIndexChartData();
    }
  }
  onCellClick(info){
 
  }
  input_onChange(e){
    this.requestData();
  }
  customizeTooltip(arg) {
    return {
      text: "Date: " + arg.point.data.Date + "<br/>" +
            "Time: " + arg.point.data.Time + "<br/>" +
            "Open: " + tools.numberFormat(arg.openValue,0) + "<br/>" +
            "Close: " + tools.numberFormat(arg.closeValue,0) + "<br/>" +
            "High: " + tools.numberFormat(arg.highValue,0) + "<br/>" +
            "Low: " + tools.numberFormat(arg.lowValue,0) + "<br/>"
    };
  }
  stockInput_onOpened(){
    let x = document.getElementById("inputBoxStockCode") as HTMLInputElement; 
    // x.element().find('input')
    x.select();
  }
  stockType_onOpened(e){
    let x = document.getElementById("inputBoxStockType") as HTMLInputElement; 
     x.select();
  }
  inputType_onChange(e){
    this.requestData();

  }
  stockInterval_onOpened(e){

  }
  inputInterval_onChange(e){
    this.requestData();

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

  getMCIIS(_input){
    if(_input=="Mar") return '3';
    else if(_input=="Jul") return '6';
    else if(_input=="Sep") return '9';
    else if(_input=="Dec") return '12';
    else "";
  }
  requestStockChartData(){

    let today = this.global.getCurrentDate(); 
    
    this.socket.requestView59(this.stockInput.code,this.getIntervalSend(this.stockInput['interval']),today,this.getBeginDate(this.stockInput['interval']),0x01);
  }
  getIntervalSend(_input){
    if(_input== "1 Minute") return "A";
    else if(_input== "5 Minute") return "B";
    else if(_input== "15 Minute") return "C";
    else if(_input== "30 Minute") return "D";
    else if(_input== "1 Hour") return "E";
    else if(_input== "Daily") return "F";
    else if(_input== "Weekly") return "G";
    else if(_input== "Monthly") return "H";
  }
  getBeginDate(_input){

    if(_input== "1 Minute") return tools.getBeforeDate(1);
    else if(_input== "5 Minute") return tools.getBeforeDate(2);
    else if(_input== "15 Minute") return tools.getBeforeDate(4);
    else if(_input== "30 Minute") return tools.getBeforeDate(8);
    else if(_input== "1 Hour") return tools.getBeforeDate(16);
    else if(_input== "Daily") return tools.befoterMonths(new Date(), -12);
    else if(_input== "Weekly") return tools.befoterMonths(new Date(), -24);
    else if(_input== "Monthly") return tools.befoterMonths(new Date(), -48);
     
  }
  requestIndexChartData(){
    let today = this.global.getCurrentDate(); 
    
    this.socket.requestView60(this.indexInput.code,this.getIntervalSend(this.indexInput['interval']),today,this.getBeginDate(this.indexInput['interval']));
  }

  getWidth(){
    let obj = document.getElementById('chart-container');
    return obj.offsetWidth;
  }
  getHeight(){
    let obj = document.getElementById('chart-container');
    return obj.offsetHeight;
  }
}
