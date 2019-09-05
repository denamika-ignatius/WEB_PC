import * as messageCenter from './messageCenter'; 
import * as tools from './tools'; 
import DataSource from "devextreme/data/data_source";
import ArrayStore from "devextreme/data/array_store";
export class global{

  theme:string = 'light';
  selectedId:any = '';
  brokerList:any = [];
  stockList:any = [];
  indicesList:any = [];
  currStock:any = '';
  prevMenu:string = '';

  isLoginPIN = false;
  pinValue:string = '';
  accountList:any = [];
  selectedAccount = "";
  selectedAccountName = "";
  tempVar = "";
  isTradeOn = false;
  isReconnectAble = false;
  isLoginPage = true;
  profileList:any = [];
  isAlreadyConnect = false;
  orientation = "normal";

  lastBook = "";
  lastBoard = "";
  localIp = "Localhost";
  headerData = [];
  footerData = [];
  marketInfoData=[];
  dsStockList;
  dsStockOnlyList;
  alertData={
    code:"",
    price:"",
    trigger:"=",
    currEdit:1,
    isVisible:false,
    box1:{
      code:"",
      board:"",
      trigger:"<=",
      price:"",
      last:"",
      change:0,
    },
    box2:{
      code:"",
      board:"",
      trigger:"<=",
      price:"",
      last:"",
      change:0,
    },
    box3:{
      code:"",
      board:"",
      trigger:"<=",
      price:"",
      last:"",
      change:0,
    },
    box4:{
      code:"",
      board:"",
      trigger:"<=",
      price:"",
      last:"",
      change:0,
    },
    
  };

  dsAccountList;


  constructor(){

  }

  setTheme(value){
      this.theme = value;
  }
  getTheme(){
      return this.theme;
  }

  //=======CSS =======
  fColorFormat(value){
        
    if(value == 0)
      return "f-yellow";
    else if(value > 0)
      return "f-green";
    else 
      return "f-red";
  }
  colorFormat(value){
    if(value == 0)
      return "f-yellow";
    else if(value > 0)
      return "f-green";
    else 
      return "f-red";
    }
  colorFormatBackground(value){
    if(value == 0)
      return "bg-yellow";
    else if(value > 0)
      return "bg-green";
    else 
      return "bg-red";
  }
  colorPercent(value){
    if(value >= 50)
      return "f-green";
    else 
      return "f-red";
    }
  fColorBroker(value){
    if(value=='F') return "f-yellow";
    else if(value=='D') return "f-magenta";
    else return "f-red";
  }
  colorBroker(value){
    if(value=='F') return "f-yellow";
    else if(value=='D') return "f-magenta";
    else return "f-red";
  }
  colorSide(value){
    if(value=='B') return "color-green";
    else if(value=='S') return "color-red";
    else if(value=='Buy') return "color-green";
    else if(value=='Sell') return "color-red";
    else return "color-white";
  }
  
  colorBrokerCode(value){
    var brokerType = this.getBrokerType(value);
    return this.colorBroker(brokerType);
  }
  fColorBrokerFormat(value){
    var brokerType = this.getBrokerType(value);
    return this.fColorBroker(brokerType);
  }

  //==================

  setLastBook(code,board){ 
    if(board==""||board==undefined) board="RG";
    this.lastBook = code;
    this.lastBoard = board;

  }
  getLastBook(type){
    if(type==1){ 
      if(this.lastBoard=="") return "RG";
      else return this.lastBoard;
    }else {
      return this.lastBook;
    } 
  }

  setSelectedId(value){
      this.selectedId = value;
  }
  getSelectedId(){
    return this.selectedId;
  }

  setBrokerList(value){
    this.brokerList = value;
  }
  getBrokerList(){
    return this.brokerList;
  }
  getBrokerName(value){
    for(let i=0; i<this.brokerList.length;i++){
      if(value==this.brokerList[i]['BrokerCode']) {    
        return this.brokerList[i]['BrokerName'];
      }
    }
    return "";
  }
  getBrokerType(value){
    for(let i=0; i<this.brokerList.length;i++){
      if(value==this.brokerList[i]['BrokerCode']) {    
        return this.brokerList[i]['BrokerType'];
      }
    }
    return "U";
  }

  setStockList(value){ 
    this.stockList = value;
  }
  getStockList(){
    return this.stockList;
  }

  setCurrStock(value){
      this.currStock = value;
  }
  getCurrStock(){
    if (this.currStock=="") {
      this.currStock="AALI";
    }
    return this.currStock;
  }
  setIsLoginPIN(value){
      messageCenter.runCallback('PINStatus', value);
      this.isLoginPIN = value;
  }
  setPINValue(value){
    this.pinValue = value;
  }
  getIsLoginPIN(){
    return this.isLoginPIN;
  }
  getPINValue(){
    return this.pinValue;
  }

  setAccountList(value){
      this.accountList = value;
      let allAcc=[];
      for(let i=0;i<this.accountList.length;i++){
        let temp = Object.assign({}, this.accountList[i]); 
        temp['AccountFullName']=temp['AccountCode']+" - "+temp['AccountName'];
        allAcc.push(temp);
      }
      this.dsAccountList= new DataSource({
        store: new ArrayStore({
          key: "AccountCode", 
          data:allAcc
        }), 
         searchExpr: ["AccountCode"], 
      }); 
  }
  getAccountList(){
    return this.dsAccountList;
  }

  setSelectedAccount(value){
    messageCenter.runCallback('AccountChange', value);
    this.selectedAccount = value;
  }
  getSelectedAccount(){
    return this.selectedAccount;
  }
  setSelectedAccountName(value){
    messageCenter.runCallback('AccountNameChange', value);
    this.selectedAccountName = value;
  }
  setProfileList(value){
    this.profileList = value;
  }
  getSelectedAccountName(){
    return this.selectedAccountName;
  }
  getStockNameFromCode(_input){
    for(let i=0;i<this.stockList.length;i++) {
      if(this.stockList[i]['ProductCode']==_input)  return this.stockList[i]['ProductName'];
    }
    return "";
  }
  getContractSizeForStock(_input){
    for(let i=0;i<this.stockList.length;i++) {
      if(this.stockList[i]['ProductCode']==_input)  return this.stockList[i]['ContractUnit'];
    }
    return 100;
  }
  setTempVar(value){
      this.tempVar = value;
  }
  getTempVar(){
    return this.tempVar;
  }
  
  setIndicesList(value){
    this.indicesList = value;
  }
  getIndicesList(){
    return this.indicesList;
  }
  setIsTradeOn(value){
    this.isTradeOn = value;
  }
  getIsTradeOn(){
    return this.isTradeOn;
  }
  changeMenu(_page){
    messageCenter.runCallback('setPage', _page);
  }
  setPrevMenu(value){
    this.prevMenu = value;
  }
  getPrevMenu(){
    return this.prevMenu;
  }
  setColorStock(_input){
    let sector = 0;
    for(let i=0;i<this.stockList.length;i++) {
      if(this.stockList[i]['ProductCode']==_input)  {
        sector = this.stockList[i]['Sector'];
        break;
      }
    }
    return this.getSectorColor(sector);   
  }

  getSectorColor(sector) {
    if(sector > 10&&sector < 19)
      return "stock-sector1";
    else if(sector > 20&&sector < 29)
      return "stock-sector2";
    else if(sector > 30&&sector < 39)
      return "stock-sector3";
    else if(sector > 40&&sector < 49)
      return "stock-sector4";
    else if(sector > 50&&sector < 59)
      return "stock-sector5";
    else if(sector > 60&&sector < 69)
      return "stock-sector6";
    else if(sector > 70&&sector < 79)
      return "stock-sector7";
    else if(sector > 80&&sector < 89)
      return "stock-sector8";
    else if(sector > 90&&sector < 99)
      return "stock-sector9";
    else 
      return "stock-sector0";
  }
  getCurrentDate(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    mm = mm+100;
    dd = dd+100;
    
    let result = yyyy.toString().charAt(0)+
    yyyy.toString().charAt(1)+
    yyyy.toString().charAt(2)+
    yyyy.toString().charAt(3)+
    mm.toString().charAt(1)+
    mm.toString().charAt(2)+
    dd.toString().charAt(1)+
    dd.toString().charAt(2);
    return result;


  }
  getNextWeekDate(){
    let today = new Date();
    let nextWeek =  new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
    return nextWeek;


  }

  getMonthYear(){
    let today = new Date();
    let fullTime = new Date(today.getTime());
    let month = new Date(fullTime.getMonth()) ;
    let year = new Date(fullTime.getFullYear())
    return month+ "-"+ year;
  }

  get2MonthBeforeDate(){
    let today = new Date();
    let twoMonthBefore =  new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 * 8);
  
    return twoMonthBefore;


  }
  GetProfile(profileid){
    for(let i=0;i<this.profileList.length;i++){
        if(this.profileList[i]['ProfileId'] == profileid){
          return this.profileList[i];
        }  
    }
    return null;
  }
  GetValuation(profilelist, stockcode){
    for(let i = 0; i < profilelist.NoProfileArray.length; i++){
        if(profilelist.NoProfileArray[i]['Product'] == stockcode)
            return profilelist.NoProfileArray[i]['ValuationRatio'];
           // $rootScope.valuationRat = profilelist.NoProfileArray[i].ValuationRatio;
    }
      return null;
  }

  isRG(board){
    if(board=="RG"){
        return "";
    }else{
        return "."+board;
    }
  }

  isPlus(value){
    if(value>0){
        return "+"+value;
    }else{
        return value;
    }
  }
  getLocalIp(){
    return this.localIp;
  }
  setLocalIp(value){
    this.localIp = value;
  }
  setHeaderData(value){
    this.headerData = value;
  }
  getHeaderData(){
    return this.headerData;
  }
  setFooterData(value){
    this.footerData = value;
  }
  getFooterData(){
    return this.footerData;
  }
  setMarketInfoData(_id,value){
    this.marketInfoData[_id] = value;
  }
  getMarketInfoData(_id){
    return this.marketInfoData[_id];
  }
  dateFormat(_input){
    let temp = _input.replace(/-/g, "" ); 
    return tools.dateStyle(temp,5)
  }
  dateFormat2(_input){
    let temp = _input.replace(/-/g, "" ); 
    return tools.dateStyle(temp,2)
  }
  numberFormat(_input,_comas){
    if( _input==null ) return "";
    return tools.numberFormat(_input,_comas);
  }

  numberSignFormat(_input,_comas){
    if( _input==null ) return "";
    return tools.numberSignFormat(_input,_comas);
  }
  numberFormat0(_input,_comas){
    if( _input==null ) return "";
    return tools.numberFormatRemoveEmpty(_input,_comas);
  }
  kmbtFormat(_input,_comas){
    if( _input==null) return "";
    return tools.kmbtFormat(_input,_comas);
  }
  timeFormat(_input){
    if(_input=="" || _input==null) return "";
    return tools.timeFormat(parseInt(_input));
  }
  gemeratedsStockList(){ 
    let allStock=[];
    let allStockOnly=[];
    for(let i=0;i<this.stockList.length;i++){
      let temp = Object.assign({}, this.stockList[i]);
      temp['Board']="RG";
      temp['ProductCodeBoard']=temp['ProductCode']+".RG";
      temp['ProductFullName']=temp['ProductCode']+" - "+temp['ProductName'];
      allStock.push(temp);
      let temp2 = Object.assign({}, this.stockList[i]);
      temp2['Board']="TN";
      temp2['ProductCodeBoard']=temp['ProductCode']+".TN";
      temp2['ProductFullName']=temp2['ProductCode']+"."+temp2['Board']+" - "+temp2['ProductName'];
      allStock.push(temp2);
      let temp3 = Object.assign({}, this.stockList[i]);
      temp3['Board']="NG";
      temp3['ProductCodeBoard']=temp['ProductCode']+".NG";
      temp3['ProductFullName']=temp3['ProductCode']+"."+temp3['Board']+" - "+temp3['ProductName'];
      allStock.push(temp3); 

      let temp4 = Object.assign({}, this.stockList[i]);
      temp4['ProductFullName']=temp['ProductCode']+" - "+temp['ProductName'];
      allStockOnly.push(temp4)

    }
    this.dsStockList= new DataSource({
      store: new ArrayStore({
        key: "ProductCodeBoard", 
        data:allStock
      }), 
       searchExpr: ["ProductCodeBoard"], 
    }); 
    this.dsStockOnlyList= new DataSource({
      store: new ArrayStore({
        key: "ProductCode", 
        data:allStockOnly
      }), 
       searchExpr: ["ProductCode"], 
    });  
  }
  getdsStockList(){ 
    return this.dsStockList;
  }
  getdsStockOnlyList(){ 
    return this.dsStockOnlyList;
  }
  setColorTime(_input){
    return "stock-sector"+_input;
  }
  getStatusBoxColor(_input){
    if(_input){
      return "box-green";
    }
    else{
      return "box-red"; 
    }
  }
  getSideName(_input){
    if(_input=="1") return "Buy";
    else if(_input=="2") return "Sell";
  }
  getSectorName(_input){
    if(_input=="11") return "Crops"; 
    else if(_input=="12") return "Plantation"; 
    else if(_input=="13") return "Animal Husbandry"; 
    else if(_input=="14") return "Fishery"; 
    else if(_input=="15") return "Forestry"; 
    else if(_input=="19") return "Other Agriculture"; 
    else if(_input=="21") return "Coal Mining";  
    else if(_input=="22") return "Crude Petroleum & Natural Gas Production"; 
    else if(_input=="23") return "Metal & Mineral Mining"; 
    else if(_input=="24") return "Land/Stone Quarrying"; 
    else if(_input=="29") return "Other Mining"; 
    else if(_input=="31") return "Cement"; 
    else if(_input=="32") return "Ceramics, Glass, Percelain"; 
    else if(_input=="33") return "Metal and Allied Products"; 
    else if(_input=="34") return "Chemicals";
    else if(_input=="35") return "Plastics & Packaging"; 
    else if(_input=="36") return "Animal Feed"; 
    else if(_input=="37") return "Wood Industries"; 
    else if(_input=="38") return "Pulp and Paper"; 
    else if(_input=="39") return "Other Basic Industry and Chemical"; 
    else if(_input=="41") return "Machinery and Heavy Equipment"; 
    else if(_input=="42") return "Automotive and Components"; 
    else if(_input=="43") return "Textile, Garment"; 
    else if(_input=="44") return "Footwear"; 
    else if(_input=="45") return "Cable"; 
    else if(_input=="46") return "Electronics"; 
    else if(_input=="49") return "Other Miscellaneous"; 
    else if(_input=="51") return "Food and Beverages"; 
    else if(_input=="52") return "Tobacco Manufacturers"; 
    else if(_input=="53") return "Pharmaceuticals"; 
    else if(_input=="54") return "Cosmetics and Household"; 
    else if(_input=="55") return "Houseware"; 
    else if(_input=="59") return "Other Consumer Goods"; 
    else if(_input=="61") return "Property and Real Estates"; 
    else if(_input=="62") return "Building Construction"; 
    else if(_input=="69") return "Othre Construction, Property & Real Estate"; 
    else if(_input=="71") return "Energy"; 
    else if(_input=="72") return "Toll Road, Airport, Harbor & Allied Product"; 
    else if(_input=="73") return "Telecommunication"; 
    else if(_input=="74") return "Transportation"; 
    else if(_input=="75") return "Construction"; 
    else if(_input=="79") return "Other Infrastructure, Utilities & Transportation"; 
    else if(_input=="81") return "Bank"; 
    else if(_input=="82") return "Financial Institution"; 
    else if(_input=="83") return "Securities Company"; 
    else if(_input=="84") return "Insurance"; 
    else if(_input=="85") return "Investment Fund/Mutual Fund"; 
    else if(_input=="89") return "Other Finance"; 
    else if(_input=="91") return "Wholesale (Durable Goods)"; 
    else if(_input=="92") return "Wholesale (Non Durable Goods)"; 
    else if(_input=="93") return "Retail Trade"; 
    else if(_input=="94") return "Restaurant, Hotel & Tourism"; 
    else if(_input=="95") return "Advertising, Printing & Media"; 
    else if(_input=="96") return "Health Care"; 
    else if(_input=="97") return "Computer Services"; 
    else if(_input=="98") return "Investment Company"; 
    else if(_input=="99") return "Others Trade & Service"; 
    return"";
  }

  setColorSide(_input){
    if(_input=="1") return "f-red";
    else if(_input=="2") return "f-green";
  }
  getOrderStatusName(_input){
    if(_input=="D") return "NG Confirmation";
    else if(_input=="P") return "Order in Queue, Pending to be Sent to IDX";
    else if(_input=="0") return "Order Confirmed";
    else if(_input=="1") return "Partially Matched";
    else if(_input=="2") return "All Matched";
    else if(_input=="4") return "Order Cancelled";
    else if(_input=="5") return "Amended";
    else if(_input=="6") return "Partially Cancelled";
    else if(_input=="7") return "Partially Expired";
    else if(_input=="8") return "Rejected";
    else if(_input=="9") return "Expired";
    return "";
  }
  getOrderTrackingStatusName(_input){ 
    if(_input=="0") return "Order Not Found, the rest fields will be blank";
    else if(_input=="1") return "Canceled / Amended";
    else if(_input=="2") return "Open";
    else if(_input=="3") return "Full Match";
    else if(_input=="4") return "Partial Match"; 
    return "";
  }
  setBrokerTypeColor(_input){
    return tools.setBrokerTypeColor(_input);
  }
  setExecuteBS(_input){
    return tools.setExecuteBS(_input);
  }

  setAlertData(value){
    this.alertData = value;
  }
  getAlertData(){
      return this.alertData;
  }
  setColorOrderStatus(_input){
    if(_input=="2") return "f-Dodgerblue";
    else if(_input=="4") return "f-red"; 
    else if(_input=="6") return "f-red"; 
    else if(_input=="8") return "f-magenta"; 
    return "";
  }
}

