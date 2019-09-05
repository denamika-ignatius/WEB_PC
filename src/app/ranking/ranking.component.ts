import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from '../socket';
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { global } from '../global';



@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit {
  datas: any = [];
  stockRankingInput: Array<{}> = [];
  brokerRankingInput: Array<{}> = [];
  datasDisplay: any = [];
  isChangeData = false;
  updateThread:any;

  tabs = [ 
    { text: "Stock", display: "Stock", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Broker", display: "Broker", icon: "comment", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" }
  ];
  selectTab = "Stock";
  radioGroupItems = [
    { text: "Value", sort:"Value" },
    { text: "Volume", sort: "Volume" },
    { text: "Freq", sort:"Freq" },
    { text: "Gainer", sort:"Gainer"  },
    { text: "Loser", sort:"Loser"  },
    // { text: "Fgn Net Val", sort:"Fgn Net Val"  },
    // { text: "Fgn Net Vol", sort:"Fgn Net Vol"  },
    // { text: "Fgn Net Freq", sort:"Fgn Net Freq"  },
    { text: "Gainer(%)", sort:"Gainer(%)"  },
    { text: "Loser(%)", sort:"Loser(%)"  }
];
radioGroupItemsBroker = [
  { text: "Value", sort:"Value" },
  { text: "Volume", sort: "Volume" },
  { text: "Freq", sort:"Freq" } 
];
  constructor(
    public router: Router,
    private socket:Socket,
    public global:global,
  ) { 

    this.stockRankingInput["maxRecord"] = "40";
    this.stockRankingInput["type"] = "Value";

    this.brokerRankingInput["maxRecord"] = "40";
    this.brokerRankingInput["type"] = "Value";
  }

  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);

    messageCenter.addRespone('view14', (obj)=>{
        this.stockRankingGenerate(obj);
    });
    messageCenter.addRespone('view15', (obj)=>{
        this.stockRankingGenerate(obj);
    });
    messageCenter.addRespone('view16', (obj)=>{
        this.stockRankingGenerate(obj);
    });
    messageCenter.addRespone('view17', (obj)=>{
        this.stockRankingGenerate(obj);
    });
    messageCenter.addRespone('view18', (obj)=>{
        this.stockRankingGenerate(obj);
    });
    messageCenter.addRespone('view19', (obj)=>{
        this.stockRankingGenerate(obj);
    });
    messageCenter.addRespone('view20', (obj)=>{
        this.stockRankingGenerate(obj);
    });
    messageCenter.addRespone('view66', (obj)=>{
        this.stockRankingGenerate(obj);
    });


    messageCenter.addRespone('view25', (obj)=>{
        this.brokerRankingGenerate(obj);
    });
    messageCenter.addRespone('view26', (obj)=>{
        this.brokerRankingGenerate(obj);
    });
    messageCenter.addRespone('view27', (obj)=>{
        this.brokerRankingGenerate(obj);
    });

    
    this.updateThread = setInterval(()=>{ this.updateDataToScreen(); }, 100);

    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);
    this.requestData();
  }
  ngOnDestroy(){
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]); 

    messageCenter.delRespone('view14');
    messageCenter.delRespone('view15');
    messageCenter.delRespone('view16');
    messageCenter.delRespone('view17');
    messageCenter.delRespone('view18');
    messageCenter.delRespone('view19');
    messageCenter.delRespone('view20');
    messageCenter.delRespone('view66');

    messageCenter.delRespone('view25');
    messageCenter.delRespone('view26');
    messageCenter.delRespone('view27');

    if(this.updateThread) clearInterval(this.updateThread);
  }
  
  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text;
    this.requestData();
  }

  requestData(){
    if(this.selectTab=="Stock")
      this.stockRankingRefresh("");
    else if(this.selectTab=="Broker")
      this.brokerRankingRefresh("");
  }

  stockRankingGenerate(obj){
    this.datas = obj["NoProductArray"];
    for(let i=0;i<obj["NoProductArray"].length;i++){
      this.datas[i]["No"] = i+1;
      this.datas[i]["ChangePrice"] = this.datas[i]["LastPrice"]-this.datas[i]["PreviousPrice"];
      
      this.datas[i]["ChangePercentPrice"] = parseFloat(tools.numberFormat((this.datas[i]["ChangePrice"]/this.datas[i]["PreviousPrice"])*100,2));
      this.datas[i]["ForeignNetValue"] = this.datas[i]["ForeignBuyValue"]-this.datas[i]["ForeignSellValue"];

      this.datas[i]["AveragePriceDisplay"] = tools.numberFormat(this.datas[i]["AveragePrice"],0)
    }
    this.isChangeData = true;
  }

  stockRankingRefresh(input){ 
    if(this.stockRankingInput['type']=="Gainer"){
      this.socket.requestView14(1,this.stockRankingInput['maxRecord']);
    }
    else if(this.stockRankingInput['type']=="Gainer(%)") {
      this.socket.requestView16(1,this.stockRankingInput['maxRecord']);
    }
    else if(this.stockRankingInput['type']=="Loser"){
      this.socket.requestView15(1,this.stockRankingInput['maxRecord']);
    }
    else if(this.stockRankingInput['type']=="Loser(%)"){
      this.socket.requestView17(1,this.stockRankingInput['maxRecord']);
    }
    else if(this.stockRankingInput['type']=="Value"){
      this.socket.requestView20(1,this.stockRankingInput['maxRecord']);
    }
    else if(this.stockRankingInput['type']=="Volume"){
      this.socket.requestView19(1,this.stockRankingInput['maxRecord']);
    }
    else if(this.stockRankingInput['type']=="Freq"){
      this.socket.requestView18(1,this.stockRankingInput['maxRecord']);
    }
    else if(this.stockRankingInput['type']=="Fgn"){
      this.socket.requestView66('9',1,this.stockRankingInput['maxRecord']);
    }
  }
  updateDataToScreen() {
    if(this.isChangeData) {
      this.datasDisplay = JSON.parse(JSON.stringify(this.datas));
      this.isChangeData = false;
    }
  }
  onValueChanged($event){
    this.stockRankingInput['type']=$event['value'];
    this.stockRankingRefresh($event);
  }
  brokerRankingGenerate(obj){
    this.datas = obj["NoBrokerArray"];
    for(let i=0;i<obj["NoBrokerArray"].length;i++){
      this.datas[i]["No"] = i+1;
      this.datas[i]["TotalValue"] = this.datas[i]["BrokerBuyValue"]+this.datas[i]["BrokerSellValue"];
      this.datas[i]["TotalVolume"] = this.datas[i]["BrokerBuyVolume"]+this.datas[i]["BrokerSellVolume"];
      this.datas[i]["TotalLot"] = this.datas[i]["BrokerBuyLot"]+this.datas[i]["BrokerSellLot"];
      this.datas[i]["TotalFreq"] = this.datas[i]["BrokerBuyFreq"]+this.datas[i]["BrokerSellFreq"];
      this.datas[i]["BrokerType"] = this.global.getBrokerType(this.datas[i]["BrokerCode"]);
      this.datas[i]["BrokerName"] = this.global.getBrokerName(this.datas[i]["BrokerCode"]);
      this.datas[i]["NetValue"] = this.datas[i]["BrokerBuyValue"]-this.datas[i]["BrokerSellValue"];
      this.datas[i]["NetVolume"] = this.datas[i]["BrokerBuyVolume"]-this.datas[i]["BrokerSellVolume"];
      this.datas[i]["NetFreq"] = this.datas[i]["BrokerBuyFreq"]-this.datas[i]["BrokerSellFreq"];
      this.datas[i]["NetLot"] = this.datas[i]["BrokerBuyLot"]-this.datas[i]["BrokerSellLot"];
    }

    this.isChangeData = true;
  }

  brokerRankingRefresh(input){ 
    if(this.brokerRankingInput['type']=="Value"){
      this.brokerRankingInput["show1"] = "TotalValue";
      this.brokerRankingInput["show2"] = "TotalLot"
      this.brokerRankingInput["show3"] = "TotalFreq";
      this.socket.requestView27(1,this.brokerRankingInput['maxRecord']);
    }
    else if(this.brokerRankingInput['type']=="Volume"){
      this.brokerRankingInput["show1"] = "TotalValue";
      this.brokerRankingInput["show2"] = "TotalLot"
      this.brokerRankingInput["show3"] = "TotalFreq";
      this.socket.requestView26(1,this.brokerRankingInput['maxRecord']);
    }
    else if(this.brokerRankingInput['type']=="Freq"){
      this.brokerRankingInput["show1"] = "TotalValue";
      this.brokerRankingInput["show2"] = "TotalLot"
      this.brokerRankingInput["show3"] = "TotalFreq";
      this.socket.requestView25(1,this.brokerRankingInput['maxRecord']);
    }
  }
  onValueChangedBroker($event){
    this.brokerRankingInput['type']=$event['value'];
    this.brokerRankingRefresh($event);
  }
  refreshButtom_Clicked(e){
    this.requestData();
  }

  stockRanking_change(e){ 
    this.requestData();
  }

  brokerRanking_change(e){
    this.requestData();
  }
  onToolbarPreparing(e){
    e.toolbarOptions.items.unshift( {
      location: 'before',
      template: 'Ranking'
    },{
      location: 'before',
      template: ' &nbsp;&nbsp;&nbsp;&nbsp;'
    }, {
      location: 'before',
      widget: 'dxTextBox',
      options: { 
        colCount:"auto",
        labelLocation:"left",
        width:50,
        value:this.stockRankingInput["maxRecord"], 
        onValueChanged: (args) => { 

          this.stockRankingInput["maxRecord"]=args.value;
          this.requestData();
        }
      }
    },{
      location: 'before',
      template: ' &nbsp;&nbsp;&nbsp;&nbsp;'
    }, {
      location: 'before',
      widget: 'dxRadioGroup',
      options: { 
        dataSource:this.radioGroupItems,
        displayExpr:"text",
        valueExpr:"sort",
        value:"Value",
        layout:"horizontal",
        onValueChanged:this.onValueChanged.bind(this)
      }
    }/*, {
      location: 'after',
      widget: 'dxButton',
      options: {
          icon: 'refresh',
          onClick: this.requestData.bind(this)
      }
    }*/)
  }
  onToolbarPreparingBroker(e){
    e.toolbarOptions.items.unshift( {
      location: 'before',
      template: 'Max Rank'
    },{
      location: 'before',
      template: ' &nbsp;&nbsp;&nbsp;&nbsp;'
    }, {
      location: 'before',
      widget: 'dxTextBox',
      options: { 
        colCount:"auto",
        labelLocation:"left",
        width:50,
        value:this.brokerRankingInput["maxRecord"], 
        onValueChanged: (args) => { 
          this.brokerRankingInput["maxRecord"]=args.value;
          this.requestData();
        }
      }
    },{
      location: 'before',
      template: ' &nbsp;&nbsp;&nbsp;&nbsp;'
    }, {
      location: 'before',
      widget: 'dxRadioGroup',
      options: { 
        dataSource:this.radioGroupItemsBroker,
        displayExpr:"text",
        valueExpr:"sort",
        value:"Value",
        layout:"horizontal",
        onValueChanged:this.onValueChangedBroker.bind(this)
      }
    }/*, {
      location: 'after',
      widget: 'dxButton',
      options: {
          icon: 'refresh',
          onClick: this.requestData.bind(this)
      }
    }*/)
  }
}
