import { Component, OnInit } from '@angular/core';
import { Socket } from '../socket';
import { Router } from '@angular/router'; 
import * as messageCenter from '../messageCenter';
import * as tools from '../tools';
import { global } from '../global'; 
import DataSource from "devextreme/data/data_source";
import { isNull } from 'util';
import { alert } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-quotes',
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.scss']
})
export class QuotesComponent implements OnInit {
  tabs = [
    { text: "Personal Quote", display: "Personal Quote", icon: "user", url: "/assets/icons/Personal2.png", act:"/assets/icons/Personal.png" },
    { text: "IDX Sector", display: "IDX Sector", icon: "comment", url: "/assets/icons/Sector2.png", act:"/assets/icons/Sector.png" },
    { text: "World Index", display: "World Index", icon: "comment", url: "/assets/icons/World2.png", act:"/assets/icons/World.png" },
    { text: "Currency", display: "Currency", icon: "comment", url: "/assets/icons/Currency2.png", act:"/assets/icons/Currency.png" },
    { text: "Commodity", display: "Commodity", icon: "comment", url: "/assets/icons/Commodity2.png", act:"/assets/icons/Commodity.png" }
  ];
  selectTab = "Personal Quote";
  input = {
    isVisible_editPersonalQuote:false,
    listPersonalQuote:[],
    personalQuoteSort:"Custom",
    isVisible_addPersonalQuote:false,
    isVisible_notifyModify:false,
    isVisible_errorPersonalQuote:false,
    code:"",
  }

  IDXSectorData=[
    { "IndicesCode":"AGRI", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"BASIC-IND", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"BISNIS-27", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"COMPOSITE", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"CONSUMER", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"DBX", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"FINANCE", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"IDX30", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"INFOBANK15", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"INFRASTRUC", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"ISSI", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"JII", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"KOMPAS100", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"LQ45", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"MANUFACTUR", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"MBX", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"MINING", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"MISC-IND", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"MNC36", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"PEFINDO25", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"PROPERTY", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"SMinfra18", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"SRI-KEHATI", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
    { "IndicesCode":"TRADE", "PreviousIndices":0, "LastIndices":0, "OpenIndices":0, "HighIndices":0, "LowIndices":0, "TotalFreq":0, "TotalVolume":0, "TotalLot":0, "TotalValue":0, "ForeignBuyFreq":0, "ForeignBuyVolume":0, "ForeignBuyLot":0, "ForeignBuyValue":0, "ForeignSellFreq":0, "ForeignSellVolume":0, "ForeignSellLot":0, "ForeignSellValue":0, "TotalUpProduct":0, "TotalDownProduct":0, "TotalUnchangeProduct":0, "TotalNoTransactionProduct":0, "OneWIndices":0, "OneWHighIndices":0, "OneWLowIndices":0, "OneMIndices":0, "OneMHighIndices":0, "OneMLowIndices":0, "OneQIndices":0, "OneQHighIndices":0, "OneQLowIndices":0, "OneHIndices":0, "OneHHighIndices":0, "OneHLowIndices":0, "OneYIndices":0, "OneYHighIndices":0, "OneYLowIndices":0, "LifeHighIndices":0, "LifeLowIndices":0, "LastYearCloseIndices":0, "LastYearHighIndices":0, "LastYearLowIndices":0, "NonRGTotalFreq":0, "NonRGTotalVolume":0, "NonRGTotalLot":0, "NonRGTotalValue":0,},
  ];
  worldIndexData=[];
  currencyData=[];
  commodityData=[];
  personalQuoteData=[{
  }];
  updateThread:any;

  dsStockList:DataSource;

  constructor(
    private router: Router,
    private socket:Socket,
    public global:global,
  ) { }

  ngOnInit() {
    if(!this.socket.isOpen) this.router.navigate(['/login']);

    messageCenter.addRespone('view1', (obj)=>{ 
      this.updatePersonalQuoteData(obj); 
    }); 
    messageCenter.addRespone('autoUpdate1', (obj)=>{ 
      this.updatePersonalQuoteData(obj); 
    });

    messageCenter.addRespone('autoUpdate7', (obj)=>{ 
      this.updateIndicesData(obj,1);
    });
    messageCenter.addRespone('view29', (obj)=>{
      // this.IDXSectorData = obj['NoSectorArray'];
      this.updateIndicesData(obj,0);
    });
    messageCenter.addRespone('view33', (obj)=>{
      for(let i=0;i<obj['NoDataArray'].length;i++){
        this.worldIndexData.push(obj['NoDataArray'][i]);
      }
    });
    messageCenter.addRespone('view34', (obj)=>{
      for(let i=0;i<obj['NoDataArray'].length;i++){
        this.worldIndexData.push(obj['NoDataArray'][i]);
      }
    });
    messageCenter.addRespone('view35', (obj)=>{
      for(let i=0;i<obj['NoDataArray'].length;i++){
        this.worldIndexData.push(obj['NoDataArray'][i]);
      }
    });
    
    messageCenter.addRespone('view36', (obj)=>{
      this.commodityData = obj['NoDataArray'];
    });
    messageCenter.addRespone('view37', (obj)=>{
      this.currencyData = obj['NoDataArray'];
    });
    messageCenter.addRespone('view38', (obj)=>{
      for(let i=0;i<obj['NoDataArray'].length;i++){
        this.worldIndexData.push(obj['NoDataArray'][i]);
      }
    });
    messageCenter.addRespone('view40', (obj)=>{
      for(let i=0;i<obj['NoDataArray'].length;i++){
        this.worldIndexData.push(obj['NoDataArray'][i]);
      }
    });
    messageCenter.addRespone('view228', (obj)=>{  
      if(obj['ValueLength'] > 0){ 
        if(obj['ParameterKey']=='SBQuotes'){
          if(obj['ParameterValue']==""){ 
            this.input.personalQuoteSort = "Custom";
            // obj['ParameterValue'] = '';
          }
          else {
            this.input.personalQuoteSort = obj['ParameterValue'];
          } 
        }
        else if(obj['ParameterKey']=='Quotes'){
          let quotes = obj['ParameterValue'].split(";");
          
          this.input.listPersonalQuote = quotes;
 
        }

        
      }
      this.generatePersonalQuoteData();
      this.requestPersonalQuoteData();

    });
    // messageCenter.addRespone('view74', (obj)=>{
    //   this.IDXSectorData = obj['NoSectorArray'];
    // });
    this.dsStockList = this.global.getdsStockList();

    this.updateThread = setInterval(()=>{ this.requestData(); }, 5000);
    this.socket.requestView29("COMPOSITE");
    this.socket.requestAutoUpdate7(1,["COMPOSITE"]);
    this.initRequestData();
    this.requestData(); 
  }
  ngOnDestroy(){
 
    messageCenter.delRespone('view1');
    messageCenter.delRespone('autoUpdate1');
    messageCenter.delRespone('autoUpdate7');
    messageCenter.delRespone('view29');
    messageCenter.delRespone('view33');
    messageCenter.delRespone('view34');
    messageCenter.delRespone('view35');
    messageCenter.delRespone('view36');
    messageCenter.delRespone('view37');
    messageCenter.delRespone('view38');
    messageCenter.delRespone('view40');
    messageCenter.delRespone('view228');
    this.socket.requestAutoUpdate7(0,["COMPOSITE"]); 
    for(let i =0;i<this.IDXSectorData.length;i++){
 
      // this.socket.requestAutoUpdate7(0,[this.IDXSectorData[i]['IndicesCode']]);
    }
    if(this.updateThread) clearInterval(this.updateThread);
  } 
  clickSelectTab(e) {
    this.selectTab = this.tabs[e.itemIndex].text;
    this.initRequestData();
    this.requestData();
  }
  initRequestData(){
    if(this.selectTab=="Personal Quote"){
    let temp = localStorage.getItem('Quotes-NotifyMessage');
    if(!isNull(temp)){ 

    }
    else{
      this.input.isVisible_notifyModify=true;

    }
      this.socket.requestView228("Quotes");
    }
  }
  requestData(){ 
    
    if(this.selectTab=="IDX Sector"){
      // this.socket.requestView74(); 
      for(let i =0;i<this.IDXSectorData.length;i++){

        this.socket.requestView29(this.IDXSectorData[i]['IndicesCode']);
        // this.socket.requestAutoUpdate7(1,[this.IDXSectorData[i]['IndicesCode']]);
      }
    }
    else if(this.selectTab=="World Index"){
      this.worldIndexData=[];
      this.socket.requestView33();
      this.socket.requestView34();
      this.socket.requestView35();
      this.socket.requestView38();
      this.socket.requestView40();
    }
    else if(this.selectTab=="Currency"){
      console.log( "halo this.socket.requestView37();");
      console.log( this.currencyData);
      this.socket.requestView37();
    }
    else if(this.selectTab=="Commodity"){

      this.socket.requestView36();
    }

  }
  onCellClick(info){
 
  } 
  updateIndicesData(obj,_update){
    for(let i=0;i<this.IDXSectorData.length;i++){
      let item = this.IDXSectorData[i];
      if(item['IndicesCode']==obj['IndicesCode']){
        item["PreviousIndices"]=obj["PreviousIndices"];
        item["LastIndices"]=obj["LastIndices"];
        item["OpenIndices"]=obj["OpenIndices"];
        item["HighIndices"]=obj["HighIndices"];
        item["LowIndices"]=obj["LowIndices"];
        item["TotalFreq"]=obj["TotalFreq"];
        item["TotalVolume"]=obj["TotalVolume"];
        item["TotalLot"]=obj["TotalLot"];
        item["TotalValue"]=obj["TotalValue"];
        item["ForeignBuyFreq"]=obj["ForeignBuyFreq"];
        item["ForeignBuyVolume"]=obj["ForeignBuyVolume"];
        item["ForeignBuyLot"]=obj["ForeignBuyLot"];
        item["ForeignBuyValue"]=obj["ForeignBuyValue"];
        item["ForeignSellFreq"]=obj["ForeignSellFreq"];
        item["ForeignSellVolume"]=obj["ForeignSellVolume"];
        item["ForeignSellLot"]=obj["ForeignSellLot"];
        item["ForeignSellValue"]=obj["ForeignSellValue"];
        item["TotalUpProduct"]=obj["TotalUpProduct"];
        item["TotalDownProduct"]=obj["TotalDownProduct"];
        item["TotalUnchangeProduct"]=obj["TotalUnchangeProduct"];
        item["TotalNoTransactionProduct"]=obj["TotalNoTransactionProduct"];
        
        item["NonRGTotalFreq"]=obj["NonRGTotalFreq"];
        item["NonRGTotalVolume"]=obj["NonRGTotalVolume"];
        item["NonRGTotalLot"]=obj["NonRGTotalLot"];
        item["NonRGTotalValue"]=obj["NonRGTotalValue"];  
        item["ChangeIndices"] =  obj['LastIndices']-obj['PreviousIndices'];
        item["ChangePercentIndices"] =  (obj['LastIndices']-obj['PreviousIndices'])/obj['PreviousIndices']*100;

        item["ForeignNetValue"]=obj["ForeignBuyValue"]-obj["ForeignSellValue"];

        if(_update==0){

          item["LastYearCloseIndices"]=obj["LastYearCloseIndices"];
          item["LastYearHighIndices"]=obj["LastYearHighIndices"];
          item["LastYearLowIndices"]=obj["LastYearLowIndices"];
          item["LifeHighIndices"]=obj["LifeHighIndices"];
          item["LifeLowIndices"]=obj["LifeLowIndices"];
          item["OneWIndices"]=obj["OneWIndices"];
          item["OneWHighIndices"]=obj["OneWHighIndices"];
          item["OneWLowIndices"]=obj["OneWLowIndices"];
          item["OneMIndices"]=obj["OneMIndices"];
          item["OneMHighIndices"]=obj["OneMHighIndices"];
          item["OneMLowIndices"]=obj["OneMLowIndices"];
          item["OneQIndices"]=obj["OneQIndices"];
          item["OneQHighIndices"]=obj["OneQHighIndices"];
          item["OneQLowIndices"]=obj["OneQLowIndices"];
          item["OneHIndices"]=obj["OneHIndices"];
          item["OneHHighIndices"]=obj["OneHHighIndices"];
          item["OneHLowIndices"]=obj["OneHLowIndices"];
          item["OneYIndices"]=obj["OneYIndices"];
          item["OneYHighIndices"]=obj["OneYHighIndices"];
          item["OneYLowIndices"]=obj["OneYLowIndices"];
        }

        break;
      }
    }
  }
  menuPreparing(e: any): void {
    var that = this; 
    if (e.row && e.row.rowType != "header" || e.target==="content") {
      e.items = [{}];
      this.input.isVisible_editPersonalQuote=true;
    }
  }
  generatePersonalQuoteData(){
    this.personalQuoteData=[];
    // let stockList = this.global.getStockList(); 
    if(this.input.listPersonalQuote.length>0){

      for(let i=0;i<this.input.listPersonalQuote.length;i++){
        // let stockLocationTemp = Math.floor(Math.random() * 100);
        // let stockTemp = stockList[stockLocationTemp]['ProductCode'];
        let stockTemp = this.input.listPersonalQuote[i].split(".");
        if(stockTemp.length<2) stockTemp[1]="RG";
        let stockNameTemp = this.global.getStockNameFromCode(stockTemp[0]);
        let item = {
          Stock:stockTemp[0],
          Board:stockTemp[1],
          Name:stockNameTemp,
          BidVol:0,
          Bid:0,
          Offer:0,
          OVol:0,
          Last:0,
          Open:0,
          High:0,
          Low:0,
          Chg:0,
          ChgPercent:0,
          WAP:0,
          Close:0,
          Vol:0,
          TVal:0,
          TFreq:0,
          TVol:0,
          FgnBVal:0,
          FgnSVal:0,
          FgnNVal:0,
        };
        this.personalQuoteData.push(item);
      }
    }
    
  }
  requestPersonalQuoteData(){
    for(let i=0;i<this.input.listPersonalQuote.length;i++){
      let item = this.input.listPersonalQuote[i].split(".");
      if(item.length<2) item[1]="RG";
      this.socket.requestView1(item[0],item[1]);
      this.socket.requestAutoUpdate1(1,item[0],item[1]); 
    }
  }
  updatePersonalQuoteData(obj){
    for(let i=0;i<this.personalQuoteData.length;i++){
      if(this.personalQuoteData[i]["Stock"]==obj["ProductCode"] && this.personalQuoteData[i]["Board"]==obj["BoardCode"]){
        let item = this.personalQuoteData[i];
        item["BidVol"]=obj["BestBidLot"];
        item["Bid"]=obj["BestBidPrice"];
        item["Offer"]=obj["BestOfferPrice"];
        item["OVol"]=obj["BestOfferLot"];
        item["Last"]=obj["LastPrice"];
        item["Open"]=obj["OpenPrice"];
        item["High"]=obj["HighPrice"];
        item["Low"]=obj["LowPrice"];
        item["Close"]=obj["PreviousPrice"];
        item["Chg"]=item["Last"]-item["Close"];
        item["ChgPercent"]=item["Chg"]/item["Close"]*100;
        item["WAP"]=obj["AveragePrice"];
        item["Vol"]=obj["LastTradedLot"];
        item["TVal"]=obj["TotalValue"];
        item["TFreq"]=obj["TotalFreq"];
        item["TVol"]=obj["TotalLot"];
        item["FgnBVal"]=obj["ForeignBuyValue"];
        item["FgnSVal"]=obj["ForeignSellValue"];
        item["FgnNVal"]=item["FgnBVal"]-item["FgnSVal"];
      }
     
    }
  }
  onItemReordered(e){
    tools.array_move(this.input.listPersonalQuote,e["fromIndex"],e["toIndex"]);
  
  }
  onShownPersonalQuote(e){

  }
  onShownAddPersonalQuote(e){
 
  }
  addPersonalQuoteData(e){
    this.input.isVisible_addPersonalQuote=true;
  }
  savePersonalQuoteData(e){ 
    let myQuotes = this.input.listPersonalQuote.join(";");
    this.socket.requestView227("Quotes",myQuotes);
    this.input.isVisible_editPersonalQuote=false;
    setTimeout(()=>{

      this.initRequestData();
    },100)
  }
  box1_onOpened(e){ 

    let x = document.getElementById("inputBox1ID") as HTMLInputElement;  
    x.select();
  }
  stockInput_onChange(e){
    // this.input.isVisible_editPersonalQuote=false;
    // this.input.isVisible_errorPersonalQuote=true;

    if(e.value){
      let flg =false;
      for(let i=0;i<this.input.listPersonalQuote.length;i++){
        if(this.input.listPersonalQuote[i]==e.value){
          flg=true;
          break;
        }
      }
      if(flg){
        this.input.isVisible_editPersonalQuote=false;
        this.input.isVisible_errorPersonalQuote=true;
      }
      else{
        this.input.listPersonalQuote.push(e.value);
        let x = document.getElementById("inputBox1ID") as HTMLInputElement;  
        x.value="";
      }
    }
    // if(this.input.code!=""){

    //   let flag = false;
    //   for(let i=0;i<this.input.listPersonalQuote.length;i++){
    //     let item =this.input.listPersonalQuote[i];
    //     if(item.code==this.input.code) flag=true;
    //     break;
    //   }
    //   if(flag){
    //     this.input.isVisible_editPersonalQuote=false;
    //     this.input.isVisible_errorPersonalQuote=true;
    //   }
    //   else{
    //     this.input.listPersonalQuote.push(this.input.code);
      
    //   }
    //   // this.input.isVisible_addPersonalQuote=false;
      // let x = document.getElementById("inputBox1ID") as HTMLInputElement;  
      // x.value="";
    // }
    // else{
    //   this.input.isVisible_editPersonalQuote=false;
    //   this.input.isVisible_errorPersonalQuote=true;
    // }
  }
  closeNotifyModify(e){
    this.input.isVisible_notifyModify=false; 
  }

  closeNotifyModify2(e){
    this.input.isVisible_errorPersonalQuote=false;
    this.input.isVisible_editPersonalQuote=true;
  }
  checkBoxToggled(e)
  {
    if(e.value){
      localStorage.setItem('Quotes-NotifyMessage',"true");
    }
    else{  
      localStorage.removeItem('Quotes-NotifyMessage');
    }
  }

  SetBg(index){
 
    let value:number = 0;
    value = index%2;
    if(value==0){
      return "tableData-0";
    } else {
      return "tableData-1";
    }
  }  
  getStockFromMergeData(_input){
    let item = _input.split(".");
    return item[0];
  }

  getBoardFromMergeData(_input){
    let item = _input.split(".");
    if(item.length<2) item[1]="RG";
    return item[1];
  }
  getDisplayFromMergeData(_input){
    let item = _input.split(".");
    if(item.length<2) item[1]="RG";
    if(item[1]=="RG") return item[0];
    else return _input;
  }

  getId(){
    return "stockQuote-001";
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

      let x = document.getElementById(this.getId()) as HTMLInputElement;  
      x.select();
    }

  }
}
