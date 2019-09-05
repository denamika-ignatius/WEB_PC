import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import { Router } from '@angular/router';
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit {
  tabs = [
    { text: "News", display: "News", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Research News",  display: "Research News", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "IDX News",  display: "IDX News", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" },
    { text: "Announcement", display: "Announcement", icon: "user", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png"},
  ];
  selectTab = "News";
  announcementListData = [];
  announcementData = "";

  idxListData = [];
  idxData = "";

  newsListData = [];
  newsData = "";

  researchListData = [];
  researchData = "";

  isNewsDetail=false;

  constructor(
    private router: Router,
    private socket:Socket,
  ) { }

  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);

    messageCenter.addRespone('view201', (obj)=>{

      this.announcementListData=[];

      for(let i=0; i<obj['Data'].length;i++){
        let tmp = obj['Data'][i];
        let month = obj['Data'][i].Date.toString().substr(4,2);
        let year = obj['Data'][i].Date.toString().substr(0,4);
          let date = obj['Data'][i].Date.toString().substr(6,2);

          let day = parseInt(date)+" ";
          switch(parseInt(month)){
            case 1: day +="January"; break;
            case 2: day +="Febuary"; break;
            case 3: day +="Maret"; break;
            case 4: day +="April"; break;
            case 5: day +="May"; break;
            case 6: day +="June"; break;
            case 7: day +="July"; break;
            case 8: day +="August"; break;
            case 9: day +="September"; break;
            case 10: day +="October"; break;
            case 11: day +="November"; break;
            case 12: day +="December"; break;
          }
          day += " ";
          day += year;
          tmp['DateDisplay'] = day;
          tmp['TimeDisplay'] = tools.timeFormat(tmp['Time']);
          this.announcementListData.push(tmp);

      }

      // Announcement List
    });

    messageCenter.addRespone('view202', (obj)=>{
      // Announcement Detail

      obj['announcement'] = obj['announcement'].replace(/(?:\r\n|\r|\n)/g, '<br />'); 
      this.announcementData = obj['announcement'];
    });

    messageCenter.addRespone('view203', (obj)=>{


      this.idxListData=[];
      for(let i=0; i<obj['Data'].length;i++){
            let tmp = obj['Data'][i];
            let month = obj['Data'][i].Date.toString().substr(4,2);
            let year = obj['Data'][i].Date.toString().substr(0,4);
              let date = obj['Data'][i].Date.toString().substr(6,2);
    
              let day = parseInt(date)+" ";
              switch(parseInt(month)){
                case 1: day +="January"; break;
                case 2: day +="Febuary"; break;
                case 3: day +="Maret"; break;
                case 4: day +="April"; break;
                case 5: day +="May"; break;
                case 6: day +="June"; break;
                case 7: day +="July"; break;
                case 8: day +="August"; break;
                case 9: day +="September"; break;
                case 10: day +="October"; break;
                case 11: day +="November"; break;
                case 12: day +="December"; break;
              }
              day += " ";
              day += year;
              tmp['DateDisplay'] = day;
              tmp['TimeDisplay'] = tools.timeFormat(tmp['Time']);
              this.idxListData.push(tmp);
          }
    });

    messageCenter.addRespone('view204', (obj)=>{ 
      

      obj['News'] = obj['News'].replace(/(?:\r\n|\r|\n)/g, '<br />'); 
      this.idxData = obj['News'];
    });

    messageCenter.addRespone('view205', (obj)=>{

      this.newsListData = [];
      for(let i=0; i<obj['Data'].length;i++){
            let tmp = obj['Data'][i];
            let month = obj['Data'][i].Date.toString().substr(4,2);
            let year = obj['Data'][i].Date.toString().substr(0,4);
            let date = obj['Data'][i].Date.toString().substr(6,2);
  
            let day = parseInt(date)+" ";
            switch(parseInt(month)){
              case 1: day +="January"; break;
              case 2: day +="Febuary"; break;
              case 3: day +="Maret"; break;
              case 4: day +="April"; break;
              case 5: day +="May"; break;
              case 6: day +="June"; break;
              case 7: day +="July"; break;
              case 8: day +="August"; break;
              case 9: day +="September"; break;
              case 10: day +="October"; break;
              case 11: day +="November"; break;
              case 12: day +="December"; break;
            }
            day += " ";
            day += year;
            tmp['DateDisplay'] = day;
            tmp['TimeDisplay'] = tools.timeFormat(tmp['Time']);

            this.newsListData.push(tmp);
          }
    });

    messageCenter.addRespone('view207', (obj)=>{ 


      obj['News'] = obj['News'].replace(/(?:\r\n|\r|\n)/g, '<br />'); 
      this.newsData = obj['News'];
    });

    messageCenter.addRespone('view217', (obj)=>{ 

      this.researchListData = [];
      for(let i=0; i<obj['Data'].length;i++){
            let tmp = obj['Data'][i];
            let month = obj['Data'][i].Date.toString().substr(4,2);
            let year = obj['Data'][i].Date.toString().substr(0,4);
              let date = obj['Data'][i].Date.toString().substr(6,2);
    
              let day = parseInt(date)+" ";
              switch(parseInt(month)){
                case 1: day +="January"; break;
                case 2: day +="Febuary"; break;
                case 3: day +="Maret"; break;
                case 4: day +="April"; break;
                case 5: day +="May"; break;
                case 6: day +="June"; break;
                case 7: day +="July"; break;
                case 8: day +="August"; break;
                case 9: day +="September"; break;
                case 10: day +="October"; break;
                case 11: day +="November"; break;
                case 12: day +="December"; break;
              }
              day += " ";
              day += year;
              tmp['DateDisplay'] = day;
              tmp['TimeDisplay'] = tools.timeFormat(tmp['Time']);
              this.researchListData.push(tmp);
          }
    });

    messageCenter.addRespone('view219', (obj)=>{ 

      obj['News'] = obj['News'].replace(/(?:\r\n|\r|\n)/g, '<br />'); 
      this.researchData = obj['News'];
    });



    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);
    this.requestData();


  }

  ngOnDestroy(){
 
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]);  

    messageCenter.delRespone('view201');
    messageCenter.delRespone('view202');
    messageCenter.delRespone('view203');
    messageCenter.delRespone('view204');
    messageCenter.delRespone('view205');
    messageCenter.delRespone('view207');
    messageCenter.delRespone('view217');
    messageCenter.delRespone('view219');

  }
  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text;
    this.requestData();
  }
  requestData(){
    if(this.selectTab=="Research News")
      this.socket.requestView217(0, 30);
    else if(this.selectTab=="IDX News")
      this.socket.requestView203(0, 30);    
    else if(this.selectTab=="News")
      this.socket.requestView205(0, 30);
    else if(this.selectTab=="Announcement")
      this.socket.requestView201();
  }
  onCellClick(info){
    if(info.rowType=='data') {
      if(this.selectTab=="Research News")
        this.socket.requestView219(info.data.NewsId);
      else if(this.selectTab=="IDX News")
        this.socket.requestView204(info.data.Id);    
      else if(this.selectTab=="News")
        this.socket.requestView207(info.data.Id); 
      else if(this.selectTab=="Announcement")
        this.socket.requestView202(info.data.NoAnnouncementId);
    }
    this.isNewsDetail = true;
  }
  onShownDetail(e){

  }
  openAttachment(_input){
    window.open('http://'+_input);
  }
}
