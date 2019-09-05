import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Socket } from '../socket';
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { global } from '../global';
import DataSource from "devextreme/data/data_source";
import ArrayStore from "devextreme/data/array_store";
import SelectBox from "devextreme/ui/select_box"; 


@Component({
  selector: 'app-market-info',
  templateUrl: './market-info.component.html',
  styleUrls: ['./market-info.component.scss']
})
export class MarketInfoComponent implements OnInit { 
  constructor(
    public router: Router,
    private socket:Socket,
    public global:global,
    ) {  }
       
  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);
      

  } 
  ngAfterViewInit(){
  
 
    
  }
  ngOnDestroy(){
 
 
  }
    
}
