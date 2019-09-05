import { Injectable } from '@angular/core';
import * as bops from 'bops';
import * as Blowfish from './Blowfish.js';
import * as tools from './tools'
import * as messageCenter from './messageCenter' 
import { global } from './global';  

@Injectable({
  providedIn: 'root'
})
export class Socket{
    websocket:any;
    isOpen:boolean = false;
    isLB:boolean = true;
    isEnc:boolean = true;
    isEncInfo:boolean = true;
    isEncOrder:boolean = true;
    threadHeartBeat:any;
    // deviceType:String = "ANDROID";
    // deviceType:String = "IOS";
    deviceType:String = "WEB";
    version:String = "00.00.0001";

    // uriAndroid  = "ws://zpd.ketrade.co.id:8301"; //Devel
    // uriAndroid  = "ws://192.168.10.134:8301"; //Devel Lokal
    
    uriAndroid  = "ws://lb.ketrade.co.id:8301"; //Live
    //uriIOS      = "wss://ldzp.trus.co.id:8101"; //Devel
    uriIOS      = "ws://lb.ketrade.co.id:8101"; //Live
     uriWEB      = "wss://web.facsekuritas.co.id/lb"; //DEVEL
    //uriWEB      = "wss://www.ketrade.co.id/lb"; //LIVE
    uriOther    = "ws://zpd.ketrade.co.id:8401";

    versionVerify:String = tools.pretifyVersion(this.version);

    errorMessage:string;

    username:string = "";
    password:string = "";

    constructor(
      public global:global,
      // private singledata: SingledataService,
      ){
        this.isOpen = false;
        this.isLB = true;
        this.errorMessage = '';
        messageCenter.delAllRespone();
    }

    status(){
 
        return this.isOpen;
    }

    onOpenWS(event:any){
        this.isOpen = true;
        this.errorMessage = '';
        tools.logSocket("onOpenWS");
        tools.logSocket(event);
        if(this.isLB) this.requestMessageLoginToLB(this.username,this.password);
        else this.requestMessageLoginToServer(this.username,this.password,this.global.getLocalIp());
        //messageCenter.runCallback('SocketOpen', null);

    }
    onCloseWS(event:any){
        this.isOpen = false;
        this.errorMessage = '';
        tools.logSocket("onCLoseWS");
        tools.logSocket(event);
        if(this.isLB) messageCenter.runCallback('SocketClose', null);
        if(this.threadHeartBeat) {
          // messageCenter.runCallback('socketStatus', 'disconnect');
          clearInterval(this.threadHeartBeat);
        }
    }
    onErrorWS(event:any){
        this.isOpen = false;
        this.errorMessage = JSON.stringify(event);
        tools.logSocket("onErrorWS");
        tools.logSocket(event);
        messageCenter.runCallback('SocketError', null);
        //if(this.isLB) messageCenter.runCallback('SocketClose', null);
        if(this.threadHeartBeat) {
          // messageCenter.runCallback('socketStatus', 'disconnect');
          clearInterval(this.threadHeartBeat);
        }
    }


    readyBuffer:any = null;
    prevLength:number = 0;

    onMessageWS(event:any){
        this.isOpen = true;
        tools.logSocket("onMessageWS");
        //tools.logSocket(event.data);


/*
        let dataview = new DataView(event.data);
        let position = 0;

      let ResFlag =  String.fromCharCode(dataview.getUint8(position)); position += 1;
      let access = dataview.getUint32(position); position += 4;

      let serverIp = tools.ab2str(dataview, position, 16); position += 16;
      let serverName = tools.ab2str(dataview, position, 32); position += 32;
      let numberAcc = dataview.getUint32(position); position += 4;
      let arrAccCode = new Array();
      for(let i= 0; i < numberAcc ; i ++){
         arrAccCode[i] = tools.ab2str(dataview, position, 12); position += 12;
      }

      let viewLoginToServer = {
         "ResponseFlag":ResFlag,
         "Access":access,
         "ServerIpAddress":serverIp,
         "ServerName":serverName,
         "NoAccount":numberAcc,
         "ArrayNoAccount":arrAccCode,
      };
      tools.logSocket(viewLoginToServer);
*/

    var dataview = new DataView(event.data);
    let position = 0;
    var length = dataview.getUint32(position); position += 4;
    let messId = dataview.getUint8(position); position += 1;
    let messFlag = dataview.getUint8(position); position += 1;

    if((messFlag & 0x80) > 0){ //jika flag start
        let u = new Uint8Array(event.data);
        this.readyBuffer = new Uint8Array(length-2);
        bops.copy(u, this.readyBuffer, 0, 6, length+4);
        this.prevLength = length-2;
        tools.logSocket('masuk start');
        return false;
    }else if((messFlag & 0x40) > 0){   //jika flag continues
        let u = new Uint8Array(event.data);
        let tmp = new Uint8Array(this.prevLength + length-2);
        if(this.readyBuffer != null)
            bops.copy(this.readyBuffer, tmp, 0, 0, this.prevLength);
        bops.copy(u, tmp, this.prevLength, 6, length+4);
        this.readyBuffer = tmp;
        this.prevLength += length-2;
        tools.logSocket('masuk continue');
        return false;
    }else{ //jika end
        let u = new Uint8Array(event.data);
        let tmp = new Uint8Array(this.prevLength + length-2);
        if(this.readyBuffer != null){
            bops.copy(this.readyBuffer, tmp, 0, 0, this.prevLength);
        }
        bops.copy(u, tmp, this.prevLength, 6, length+4); //4 - global header length
        this.readyBuffer = tmp.buffer;
        this.prevLength = 0;
        tools.logSocket('masuk end');
    }

    if((messFlag & 0x10) > 0) {    //encrypted?
      tools.logSocket('ENC');
        let u = new Uint8Array(this.readyBuffer);

        let p = bops.create(u.length);
        bops.copy(u, p, 0, 0, u.length);

        let decrypted = Blowfish.blowfish.decrypt(p, "!@#$%^&*()ZXCVBN");

        let bytes = new Uint8Array(decrypted.length);
        for (let i = 0; i < decrypted.length; i++)        {
            bytes[i] = decrypted.charCodeAt(i);
        }

        let arrBuffer = bytes.buffer;
        //var buffer = new ArrayBuffer(decrypted);
        dataview = new DataView(arrBuffer);
        position = 0;

    }
    else
    {
        dataview = new DataView(this.readyBuffer);
        position = 0;
        this.readyBuffer = null;
    }
    tools.logSocket("messId="+messId);

    if(messId == 0x01) {
        this.responseLoginToLB(dataview,position);
        tools.logSocket('responseLoginToLB');
    }else if(messId == 0xF1) {
        this.responseLoginToLB(dataview,position);
        tools.logSocket('responseLoginToLBF1');
    }
    else if(messId == 0x02) {
        this.responseLoginToServer(dataview,position);
        tools.logSocket('responseLoginToServer');
    }else if(messId == 0x04){
        //Heart Beat
        tools.logSocket('recvHeartBeat');
        this.sendHeartBeat();
    }
    else if(messId == 0x06){
      let viewId = dataview.getUint16(position); position += 2;
      let viewMessageCode = String.fromCharCode(dataview.getUint8(position)); position += 1;
      let requestId = dataview.getUint16(position); position += 2;
      let windowsId = dataview.getUint32(position); position += 4;
      let viewDataLength = dataview.getUint32(position); position += 4;
      //tools.logSocket("viewMessageCode="+viewMessageCode);
      //tools.logSocket("requestId="+requestId);
      // tools.logSocket("viewDataLength="+viewDataLength);
      // tools.logSocket("windowsId="+windowsId);
      // tools.logSocket("viewId="+viewId);

      if(viewDataLength>0){
        if(viewId == 1){
          this.responseView1(dataview,position);
        }else if(viewId == 2){
          this.responseView2(dataview,position);
        }else if(viewId == 3){
          this.responseView3(dataview,position);
        }else if(viewId == 4){
          this.responseView4(dataview,position);
        }else if(viewId == 5){
          this.responseView5(dataview,position);
        }else if(viewId == 6){
          this.responseView6(dataview,position);
        }else if(viewId == 7){
          this.responseView7(dataview,position);
        }else if(viewId == 8){
          this.responseView8(dataview,position);
        }else if(viewId == 9){
          this.responseView9(dataview,position);
        }else if(viewId == 10){
          this.responseView10(dataview,position);
        }else if(viewId == 13){
          this.responseView13(dataview,position);
        }else if(viewId == 14){
          this.responseView14(dataview,position);
        }else if(viewId == 15){
          this.responseView15(dataview,position);
        }else if(viewId == 16){
          this.responseView16(dataview,position);
        }else if(viewId == 17){
          this.responseView17(dataview,position);
        }else if(viewId == 18){
          this.responseView18(dataview,position);
        }else if(viewId == 19){
          this.responseView19(dataview,position);
        }else if(viewId == 20){
          this.responseView20(dataview,position);
        }else if(viewId == 21){
          this.responseView21(dataview,position);
        }else if(viewId == 24){
          this.responseView24(dataview,position);
        }else if(viewId == 25){
          this.responseView25(dataview,position);
        }else if(viewId == 26){
          this.responseView26(dataview,position);
        }else if(viewId == 27){
          this.responseView27(dataview,position);
        }else if(viewId == 29){
          this.responseView29(dataview,position);
        }else if(viewId == 31){
          this.responseView31(dataview,position);
        }else if(viewId == 33){
          this.responseView33(dataview,position);
        }else if(viewId == 34){
          this.responseView34(dataview,position);
        }else if(viewId == 35){
          this.responseView35(dataview,position);
        }else if(viewId == 36){
          this.responseView36(dataview,position);
        }else if(viewId == 37){
          this.responseView37(dataview,position);
        }else if(viewId == 38){
          this.responseView38(dataview,position);
        }else if(viewId == 40){
          this.responseView40(dataview,position);
        }else if(viewId == 43){
          this.responseView43(dataview,position);
        }else if(viewId == 50){
          this.responseView50(dataview,position);
        }else if(viewId == 51){
          this.responseView51(dataview,position);
        }else if(viewId == 57){
          this.responseView57(dataview,position);
        }else if(viewId == 59){
          this.responseView59(dataview,position);
        }else if(viewId == 60){
          this.responseView60(dataview,position);
        }else if(viewId == 61){
          this.responseView61(dataview,position);
        }else if(viewId == 66){
          this.responseView66(dataview,position);
        }else if(viewId == 74){
          this.responseView74(dataview,position);
        }else if(viewId == 84){
          this.responseView84(dataview,position);
        }else if(viewId == 85){
          this.responseView85(dataview,position);
        }else if(viewId == 86){
          this.responseView86(dataview,position);
        }else if(viewId == 90){
          this.responseView90(dataview,position);
        }else if(viewId == 96){
          this.responseView96(dataview,position);
        }else if(viewId == 97){
          this.responseView97(dataview,position);
        }else if(viewId == 108){
          this.responseView108(dataview,position);
        }else if(viewId == 109){
          this.responseView109(dataview,position);
        }else if(viewId == 110){
          this.responseView110(dataview,position);
        }else if(viewId == 113){
          this.responseView113(dataview,position);
        }else if(viewId == 117){
          this.responseView117(dataview,position);
        }else if(viewId == 118){
          this.responseView118(dataview,position);
        }else if(viewId == 130){
          this.responseView130(dataview,position);
        }else if(viewId == 134){
          this.responseView134(dataview,position);
        }else if(viewId == 201){
          this.responseView201(dataview,position);
        }else if(viewId == 202){
          this.responseView202(dataview,position);
        }else if(viewId == 203){
          this.responseView203(dataview,position);
        }else if(viewId == 204){
          this.responseView204(dataview,position);
        }else if(viewId == 205){
          this.responseView205(dataview,position);
        }else if(viewId == 207){
          this.responseView207(dataview,position);
        }else if(viewId == 212){
          this.responseView212(dataview,position);
        }else if(viewId == 217){
          this.responseView217(dataview,position);
        }else if(viewId == 218){
          this.responseView218(dataview,position);
        }else if(viewId == 219){
          this.responseView219(dataview,position);
        }else if(viewId == 227){
          this.responseView227(dataview,position);
        }else if(viewId == 228){
          this.responseView228(dataview,position);
        }else if(viewId == 301){
          this.responseView301(dataview,position);
        }else if(viewId == 311){
          this.responseView311(dataview,position);
        }else if(viewId == 323){
          this.responseView323(dataview,position);
        }else if(viewId == 408){
          this.responseView408(dataview,position);
        }else if(viewId == 409){
          this.responseView409(dataview,position);
        }else if(viewId == 410){
          this.responseView410(dataview,position);
        }else if(viewId == 411){
          this.responseView411(dataview,position);
        }else if(viewId == 422){
          this.responseView422(dataview,position);
        }else if(viewId == 423){
          this.responseView423(dataview,position);
        }else if(viewId == 424){
          this.responseView424(dataview,position);
        }else if(viewId == 425){
          this.responseView425(dataview,position);
        }else if(viewId == 426){
          this.responseView426(dataview,position);
        }else if(viewId == 427){
          this.responseView427(dataview,position);
        }else if(viewId == 431){
          this.responseView431(dataview,position);
        }else if(viewId == 434){
          this.responseView434(dataview,position);
        }else if(viewId == 438){
          this.responseView438(dataview,position);
        }else if(viewId == 442){
          this.responseView442(dataview,position);
        }else if(viewId == 443){
          this.responseView443(dataview,position);
        }else if(viewId == 444){
          this.responseView444(dataview,position);
        }else if(viewId == 491){
          this.responseView491(dataview,position);
        }else if(viewId == 494){
          this.responseView494(dataview,position);
        }else if(viewId == 505){
          this.responseView505(dataview,position);
        }else if(viewId == 701){
          this.responseView701(dataview,position);
        }else if(viewId == 506){
          this.responseView506(dataview,position);
        }else if(viewId == 908){
          this.responseView908(dataview,position);
        }else if(viewId == 909){
            this.responseView909(dataview,position);
        }else if(viewId == 922){
          this.responseView922(dataview,position);
        }else if(viewId == 923){
          this.responseView923(dataview,position);
        }else if(viewId == 924){
          this.responseView924(dataview,position);
        }else if(viewId == 925){
          this.responseView925(dataview,position);
        }else if(viewId == 926){
          this.responseView926(dataview,position);
        }else if(viewId == 927){
          this.responseView927(dataview,position);
        }else if(viewId == 933){
          this.responseView933(dataview,position);
        }else if(viewId == 951){
          this.responseView951(dataview,position);
        }else if(viewId == 952){
          this.responseView952(dataview,position);
        }else if(viewId == 953){
          this.responseView953(dataview,position);
        }else if(viewId == 982){
          this.responseView982(dataview,position);
        }else if(viewId == 983){
          this.responseView983(dataview,position);
        }else if(viewId == 1434){
          this.responseView1434(dataview,position);
        }else if(viewId == 244){
          this.responseView244(dataview,position);
        }else{
          tools.logSocket("Unknown View["+viewId+"]");
        }
      }
    }
    else if(messId == 8){
      let autoUpdateId = dataview.getUint16(position); position += 2;
      if (autoUpdateId == 1){
        this.responseAutoUpdate1(dataview,position);
      }
      else if (autoUpdateId == 2){
  //        responseAutoUpdate2(dataview,position);
      }
      else if (autoUpdateId == 3){
          this.responseAutoUpdate3(dataview,position);
      }
      else if (autoUpdateId == 4){
          this.responseAutoUpdate4(dataview,position);
      }
      else if (autoUpdateId == 5){
          this.responseAutoUpdate5(dataview,position);
      }
      else if (autoUpdateId == 6){
          this.responseAutoUpdate6(dataview,position);
      }
      else if (autoUpdateId == 7){
        this.responseAutoUpdate7(dataview,position);
      }
      else if (autoUpdateId == 51){
        this.responseAutoUpdate51(dataview,position);
      }
      else if (autoUpdateId == 211){
        this.responseAutoUpdate211(dataview,position);
      }
    }
    else if(messId == 11){
      this.responseRunningTrade(dataview,position);
    }
    else if(messId == 14){
      this.responseForceKill(dataview, position);
    }
    else if(messId == 241){
      this.responseLoginToLB(dataview,position);
    }

    }
    start(uri:string) {
      if(uri=="ConnectToLb") {
        this.isLB=true;
        if(this.deviceType=="WEB") 
          uri=this.uriWEB;
        else if(this.deviceType=="IOS") {
          uri=this.uriIOS;
        }
        else if(this.deviceType=="ANDROID") {
          uri=this.uriAndroid;
        }
        else {
          uri=this.uriOther;
        }

      }
        if(this.websocket != null) {
            this.websocket.close();
            this.websocket = null;
        }
        this.websocket = new WebSocket(uri);
        this.websocket.binaryType = "arraybuffer";
        this.websocket.onopen = (evt) => {
            this.onOpenWS(evt)
        };
        this.websocket.onclose = (evt) => { this.onCloseWS(evt) };
        this.websocket.onmessage = (evt) => { this.onMessageWS(evt) };
        this.websocket.onerror = (evt) => { this.onErrorWS(evt); };
    }

    stop() {
      if(this.websocket != null) {
          this.isOpen = false;
          this.websocket.close();
          this.websocket = null;
      }
      this.isLB = true;
    }

    requestMessageLoginToLB(user:string, pass:string) {
      if(this.isOpen) {
        if(user!=null || pass!=null){
          if(this.isEnc){
            tools.logSocket("requestMessageLoginToLB_ENC");
            //tools.logSocket("user=["+user+"], pass=["+pass+"]");

            let ghLength = 0;
            // let ghMessageId = 0x01;                                 ghLength += 1;
            let ghMessageId = 0xF1;                                 ghLength += 1; //login baru
            let ghMessageFlag = 0x20|0x10;                          ghLength += 1;
            let userId = user;                                      ghLength += 20;
            let password = pass;                                    ghLength += 20;
            let applicationId = 0x00;                               ghLength += 1;
            if(this.deviceType=="WEB") applicationId = 0x07;
            else if(this.deviceType=="IOS") applicationId = 0x05;
            else if(this.deviceType=="ANDROID") applicationId = 0x04;
            else applicationId = 0x06;
            let brokerId = 'ZPke';                                  ghLength += 4;
            let clientConnectionStatus = 0x01;                      ghLength += 1;
            if(this.deviceType=="WEB") clientConnectionStatus = 0x05;
            // else if(this.deviceType=="IOS") clientConnectionStatus = 0x01;
            // else if(this.deviceType=="ANDROID") clientConnectionStatus = 0x01;
            let clientVersion = this.version;                       ghLength += 12;

            let buff = bops.create(ghLength+4);
            for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

            let position = 0;
            bops.copy( bops.from(userId, 'utf8'), buff, position, 0, 20);         position +=20;
            bops.copy( bops.from(password, 'utf8'), buff, position, 0, 20);       position +=20;
            bops.writeInt8(buff, applicationId, position);                        position +=1;
            bops.copy( bops.from(brokerId, 'utf8'), buff, position, 0, 4);        position +=4;
            bops.writeInt8(buff, clientConnectionStatus, position);               position +=1;
            bops.copy( bops.from(clientVersion, 'utf8'), buff, position, 0, 16);  position +=12;

            this.username = userId;
            this.password = password;

            position = 0;
            let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
            let bufftosend = bops.create(6+encryptedBuff.length);
            bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
            bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
            bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
            bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);
            this.websocket.send(bufftosend);
          }
          else {
            tools.logSocket("requestMessageLoginToLBF1");
            //tools.logSocket("user=["+user+"], pass=["+pass+"]");

            let ghLength = 0;
            //let ghMessageId = 0x01;             ghLength += 1; //login lama
            let ghMessageId = 0xF1; ghLength += 1; //login baru
            //let ghMessageFlag = 0x20|0x10;      ghLength += 1;
            let ghMessageFlag = 0x20;           ghLength += 1;
            let userId = user;                  ghLength += 20;
            let password = pass;                ghLength += 20;
            let applicationId = 0x00;           ghLength += 1;
            if(this.deviceType=="WEB") applicationId = 0x07;
            else if(this.deviceType=="IOS") applicationId = 0x05;
            else if(this.deviceType=="ANDROID") applicationId = 0x04;
            else applicationId = 0x06;
            let brokerId = 'ZPke';              ghLength += 4;
            let clientConnectionStatus = 0x01;  ghLength += 1;
            if(this.deviceType=="WEB") clientConnectionStatus = 0x05;
            // else if(this.deviceType=="IOS") clientConnectionStatus = 0x05;
            // else if(this.deviceType=="ANDROID") clientConnectionStatus = 0x04;
            let clientVersion = this.version;   ghLength += 12;

            let buff = bops.create(ghLength+4);
            for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

            let position = 0;
            bops.writeUInt32BE(buff, ghLength, position);                         position +=4;
            bops.writeInt8(buff, ghMessageId, position);                          position +=1;
            bops.writeInt8(buff, ghMessageFlag, position);                        position +=1;
            bops.copy( bops.from(userId, 'utf8'), buff, position, 0, 20);         position +=20;
            bops.copy( bops.from(password, 'utf8'), buff, position, 0, 20);       position +=20;
            bops.writeInt8(buff, applicationId, position);                        position +=1;
            bops.copy( bops.from(brokerId, 'utf8'), buff, position, 0, 4);        position +=4;
            bops.writeInt8(buff, clientConnectionStatus, position);               position +=1;
            bops.copy( bops.from(clientVersion, 'utf8'), buff, position, 0, 16);  position +=12;

            this.websocket.send(buff);
            this.username = userId;
            this.password = password;
          }
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseLoginToLB(dataview:any,position:number) {
      tools.logSocket("responseLoginToLB");
      let resFlag =  String.fromCharCode(dataview.getUint8(position)); position += 1;
      let reasonFlag =  String.fromCharCode(dataview.getUint8(position)); position += 1;
      let estimateDate = dataview.getUint32(position); position += 4;
      let estimateTime = dataview.getUint32(position); position += 4;
      let noServer = dataview.getUint16(position); position += 2;
      let arrNoServer = new Array();
      let selectedServerIp = "";
      let selectedServerPort = 8600;

      for(let i= 0 ; i < noServer;i++){
          let serverType =  String.fromCharCode(dataview.getUint8(position)); position += 1;
          //let serverIp = tools.ab2str(dataview, position, 16); position += 16; //login lama
          let serverIp = tools.ab2str(dataview, position, 256); position += 256; //login baru
          let serverPort = dataview.getUint32(position); position += 4;

          let arrItem = new Array();
          arrItem['serverType'] = serverType;
          arrItem['serverIp'] = serverIp;
          arrItem['serverPort'] = serverPort;

          selectedServerIp = serverIp;
          selectedServerPort = serverPort;
          arrNoServer[i] = arrItem;
      }

      let viewLoginToLB = {
          "ResponseFlag":resFlag,
          "FailedLoginReasonFlag":reasonFlag,
          "EstimateDate":estimateDate,
          "EstimateTime":estimateTime,
          "NoServer":noServer,
          "ArrayNoServer":arrNoServer,
      };
      console.log(viewLoginToLB);
      console.log('viewLoginToLB');
      console.log('selectedServerIp');
      console.log(selectedServerIp);
      //tools.logSocket(viewLoginToLB);
      if(viewLoginToLB["ResponseFlag"]=="1")
      {
        this.isLB = false;

        //this.start("ws://"+selectedServerIp+":"+selectedServerPort);
        // if(this.deviceType=="WEB") this.start("wss://"+selectedServerIp+":"+selectedServerPort
        if(this.deviceType=="WEB") this.start("wss://"+selectedServerIp);
        else this.start("wss://"+selectedServerIp);
        
      }
      messageCenter.runCallback('viewLoginToLB', viewLoginToLB);
    }
    requestMessageLoginToServer(user:string, pass:string, _clientIp:string) {
      if(this.isOpen) {
        // if(this.isEnc) {
        if(false) {
          tools.logSocket("requestMessageLoginToServer_ENC");
          //tools.logSocket("user=["+user+"], pass=["+pass+"]");

          let ghLength = 0;
          let ghMessageId = 0x02; ghLength += 1;
          let ghMessageFlag = 0x20|0x10; ghLength += 1;
          let userId = user; ghLength += 20;
          let password = pass; ghLength += 20;
          let clientIp = _clientIp; ghLength += 16;
          let applicationId = 0x00; ghLength += 1;
          if(this.deviceType=="WEB") applicationId = 0x07;
          else if(this.deviceType=="IOS") applicationId = 0x05;
          else if(this.deviceType=="ANDROID") applicationId = 0x04;
          else applicationId = 0x06;
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

          let position = 0;
          bops.copy( bops.from(userId, 'utf8'), buff, position, 0, 20); position +=20;
          bops.copy( bops.from(password, 'utf8'), buff, position, 0, 20); position +=20;
          bops.copy( bops.from(clientIp, 'utf8'), buff, position, 0, 16); position +=16;
          bops.writeInt8(buff, applicationId, position); position +=1;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          tools.logSocket(buff);
          this.websocket.send(bufftosend);
        }
        else {
          tools.logSocket("requestMessageLoginToServer");
          //tools.logSocket("user=["+user+"], pass=["+pass+"]");

          let ghLength = 0;
          let ghMessageId = 0x02; ghLength += 1;
          let ghMessageFlag = 0x20; ghLength += 1;
          let userId = user; ghLength += 20;
          let password = pass; ghLength += 20;
          let clientIp = _clientIp; ghLength += 16;
          let applicationId = 0x00; ghLength += 1;
          if(this.deviceType=="WEB") applicationId = 0x07;
          else if(this.deviceType=="IOS") applicationId = 0x05;
          else if(this.deviceType=="ANDROID") applicationId = 0x04;
          else applicationId = 0x06;
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position); position +=4;
          bops.writeInt8(buff, ghMessageId, position); position +=1;
          bops.writeInt8(buff, ghMessageFlag, position); position +=1;
          bops.copy( bops.from(userId, 'utf8'), buff, position, 0, 20); position +=20;
          bops.copy( bops.from(password, 'utf8'), buff, position, 0, 20); position +=20;
          bops.copy( bops.from(clientIp, 'utf8'), buff, position, 0, 16); position +=16;
          bops.writeInt8(buff, applicationId, position); position +=1;
          //tools.logSocket(buff);
          this.websocket.send(buff);
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseLoginToServer(dataview:any,position:number) {
      tools.logSocket("responseLoginToServer");
      let ResFlag =  String.fromCharCode(dataview.getUint8(position));  position += 1;
      let access = dataview.getUint32(position);                        position += 4;

      let serverIp = tools.ab2str(dataview, position, 16);               position += 16;
      let serverName = tools.ab2str(dataview, position, 32);             position += 32;
      let numberAcc = dataview.getUint32(position);                     position += 4;
      let arrAccCode = new Array();
      for(let i= 0; i < numberAcc ; i ++){
        arrAccCode[i] = tools.ab2str(dataview, position, 12);                 position += 12;
      }

      let viewLoginToServer = {
        "ResponseFlag":ResFlag,
        "Access":access,
        "ServerIpAddress":serverIp,
        "ServerName":serverName,
        "NoAccount":numberAcc,
        "ArrayNoAccount":arrAccCode,
      };
      //tools.logSocket(viewLoginToServer);
      //messageCenter.runCallback("viewLoginToServer",viewLoginToServer);
      if(viewLoginToServer["ResponseFlag"] == "A" || viewLoginToServer["ResponseFlag"] == "B"){
        messageCenter.runCallback('viewLoginToServer', viewLoginToServer);
        this.global.isAlreadyConnect=true;
        this.threadHeartBeat = setInterval(()=>{ this.sendHeartBeat(); }, 30000);
        viewLoginToServer["ResponseFlag"] = "1";
      }
      else{
        messageCenter.runCallback('viewLoginToServer', viewLoginToServer);
        this.global.isAlreadyConnect=true;
        this.threadHeartBeat = setInterval(()=>{ this.sendHeartBeat(); }, 30000);
        this.requestView701();
        this.requestView84();
        this.requestView85();
        this.requestView86();
        // this.requestView438();
        this.requestView506(this.username,"AgreementT2","0",0,20201231);
        //this.requestView201();  
      }

    }
    requestView1(_ProductCode,_BoardCode) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 1;                 ghLength += 2;
        let viewMessageCode = 0x00;     ghLength += 1;
        let requestId = 0x00;           ghLength += 2;
        let windowsId = 0;              ghLength += 4;
        let viewDataLength = 0;         ghLength += 4;
        let productCode = _ProductCode; ghLength += 24; viewDataLength += 24;
        let boardCode = _BoardCode;     ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
        bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        //tools.logSocket('requestView1['+_ProductCode+']['+_BoardCode+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView1(dataview:any,position:number) {
      if(dataview.byteLength>24) {
      let productCode = tools.ab2str(dataview, position, 24); position += 24;
      let boardCode = tools.ab2str(dataview, position, 4); position += 4;
      let previousPrice = dataview.getFloat64(position); position += 8;
      let lastPrice = dataview.getFloat64(position); position += 8;
      let openPrice = dataview.getFloat64(position); position += 8;
      let highPrice = dataview.getFloat64(position); position += 8;
      let lowPrice = dataview.getFloat64(position); position += 8;
      let averagePrice = dataview.getFloat64(position); position += 8;
      let totalFreq = dataview.getUint32(position); position += 4;
      let totalLot = tools.getInt64(dataview,position); position += 8;
      let lastTradedLot = tools.getInt64(dataview,position); position += 8;
      let totalValue = tools.getInt64(dataview,position); position += 8;
      let bestBidPrice = dataview.getFloat64(position); position += 8;
      let bestOfferPrice = dataview.getFloat64(position); position += 8;
      let bestBidLot = tools.getInt64(dataview,position); position += 8;
      let bestOfferLot = tools.getInt64(dataview,position); position += 8;
      let foreignBuyFreq = dataview.getUint32(position); position += 4;
      let foreignBuyLot = tools.getInt64(dataview,position); position += 8;
      let foreignBuyValue = tools.getInt64(dataview,position); position += 8;
      let foreignSellFreq = dataview.getUint32(position); position += 4;
      let foreignSellLot = tools.getInt64(dataview,position); position += 8;
      let foreignSellValue = tools.getInt64(dataview,position); position += 8;
      let yesterdayOpenPrice = dataview.getFloat64(position); position += 8;
      let yesterdayHighPrice = dataview.getFloat64(position); position += 8;
      let yesterdayLowPrice = dataview.getFloat64(position); position += 8;
      //let bPercent = dataview.getFloat64(position); position += 8;

      let view1 = {
          "ProductCode":productCode,
          "BoardCode":boardCode,
          "PreviousPrice":previousPrice,
          "LastPrice":lastPrice,
          "OpenPrice":openPrice,
          "HighPrice":highPrice,
          "LowPrice":lowPrice,
          "AveragePrice":averagePrice,
          "TotalFreq":totalFreq,
          "TotalLot":totalLot,
          "LastTradedLot":lastTradedLot,
          "TotalValue":totalValue,
          "BestBidPrice":bestBidPrice,
          "BestOfferPrice":bestOfferPrice,
          "BestBidLot":bestBidLot,
          "BestOfferLot":bestOfferLot,
          "ForeignBuyFreq":foreignBuyFreq,
          "ForeignBuyLot":foreignBuyLot,
          "ForeignBuyValue":foreignBuyValue,
          "ForeignSellFreq":foreignSellFreq,
          "ForeignSellLot":foreignSellLot,
          "ForeignSellValue":foreignSellValue,
          "YesterdayOpenPrice":yesterdayOpenPrice,
          "YesterdayHighPrice":yesterdayHighPrice,
          "YesterdayLowPrice":yesterdayLowPrice,
          "BPercent":0,
      };

      tools.logSocket('responView1');
      tools.logSocket(view1);
      messageCenter.runCallback("view1",view1);
      messageCenter.runCallback("view1a",view1);
      }
    }
    requestView2(_ProductCode,_BoardCode,_MaxLevel){
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 2;                 ghLength += 2;
        let viewMessageCode = 0x00;     ghLength += 1;
        let requestId = 0x00;           ghLength += 2;
        let windowsId = 0;              ghLength += 4;
        let viewDataLength = 0;         ghLength += 4;
        let productCode = _ProductCode; ghLength += 24; viewDataLength += 24;
        let boardCode = _BoardCode;     ghLength += 4;  viewDataLength += 4;
        let maxLevel = _MaxLevel;       ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(productCode,'utf8'), buff, position, 0, 24); position += 24;
        bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;
        bops.writeUInt32BE(buff, maxLevel, position);                               position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        // tools.logSocket('requestView2['+productCode+']['+boardCode+']['+_MaxLevel+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView2(dataview:any,position:number) {
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let MaxLevel = dataview.getUint32(position); position += 4;
      let PreviousPrice = dataview.getFloat64(position); position += 8;
      let NoBid = dataview.getUint32(position); position += 4;
      let NoBidArray = new Array();
      for (let i = 0; i<NoBid; i++)
      {
          let BidPrice = dataview.getFloat64(position); position += 8;
          let BidLot = tools.getInt64(dataview,position); position += 8;
          let BidVol = dataview.getUint32(position); position += 4;
         // let BidLotChange = tools.getInt64(dataview,position); position += 8;
          let BidArray = {
              "BidPrice":BidPrice,
              "BidLot":BidLot,
              "BidVol":BidVol,
              "BidLotChange":0,
          };
          NoBidArray.push(BidArray);
      }
      let NoOffer = dataview.getUint32(position); position += 4;
      let NoOfferArray = new Array();
      for (let i = 0; i<NoOffer; i++)
      {
          let OfferPrice = dataview.getFloat64(position); position += 8;
          let OfferLot = tools.getInt64(dataview,position); position += 8;
          let OfferVol = dataview.getUint32(position); position += 4;
         // let OfferLotChange = tools.getInt64(dataview,position); position += 8;
          let OfferArray = {
              "OfferPrice":OfferPrice,
              "OfferLot":OfferLot,
              "OfferVol":OfferVol,
              "OfferLotChange":0,
          };
          NoOfferArray.push(OfferArray);
      }

      let view2 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "MaxLevel":MaxLevel,
          "PreviousPrice":PreviousPrice,
          "NoBid":NoBid,
          "NoBidArray":NoBidArray,
          "NoOffer":NoOffer,
          "NoOfferArray":NoOfferArray,
      };
      tools.logSocket('responView2');
      tools.logSocket(view2);
      messageCenter.runCallback("view2",view2);
      messageCenter.runCallback("view2a",view2);
    }

    requestView3(_BrokerCode ) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 3;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let brokerCode = _BrokerCode;           ghLength += 4;  viewDataLength += 4;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
 
        bops.copy( bops.from(brokerCode, 'utf8'), buff, position, 0, 4);            position += 4;
         
        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView21');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView3(dataview:any,position:number) {
      let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
      let BrokerBuyFreq = dataview.getUint32(position); position += 4;
      let BrokerBuyVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
      let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
      let BrokerSellFreq = dataview.getUint32(position); position += 4;
      let BrokerSellVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
      let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignBuyFreq = dataview.getUint32(position); position += 4;
      let BrokerForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignBuyLot = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignBuyValue = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignSellFreq = dataview.getUint32(position); position += 4;
      let BrokerForeignSellVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignSellLot = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignSellValue = tools.getInt64(dataview,position); position += 8;
   
      let view3 = {
          "BrokerCode":BrokerCode,
          "BrokerBuyFreq":BrokerBuyFreq,
          "BrokerBuyVolume":BrokerBuyVolume,
          "BrokerBuyLot":BrokerBuyLot,
          "BrokerBuyValue":BrokerBuyValue,
          "BrokerSellFreq":BrokerSellFreq,
          "BrokerSellVolume":BrokerSellVolume,
          "BrokerSellLot":BrokerSellLot,
          "BrokerSellValue":BrokerSellValue,
          "BrokerForeignBuyFreq":BrokerForeignBuyFreq,
          "BrokerForeignBuyVolume":BrokerForeignBuyVolume,
          "BrokerForeignBuyLot":BrokerForeignBuyLot,
          "BrokerForeignBuyValue":BrokerForeignBuyValue, 
          "BrokerForeignSellFreq":BrokerForeignSellFreq, 
          "BrokerForeignSellVolume":BrokerForeignSellVolume, 
          "BrokerForeignSellLot":BrokerForeignSellLot, 
          "BrokerForeignSellValue":BrokerForeignSellValue, 
      };
      tools.logSocket('responView3');
      tools.logSocket(view3);
      messageCenter.runCallback("view3",view3);
    }
    requestView4(_BrokerCode,_StartDate,_EndDate) {
      if(this.isOpen) {
        let ghLength = 0;
        let ghMessageId = 0x06;                             ghLength += 1;
        let ghMessageFlag = 0x20;                           ghLength += 1;

        //view
        let viewId = 4;                                     ghLength += 2;
        let viewMessageCode = 0x00;                         ghLength += 1;
        let requestId = 0x00;                               ghLength += 2;
        let windowsId = 0;                                  ghLength += 4;
        let viewDataLength = 0;                             ghLength += 4;
        let brokerCode = _BrokerCode;                       ghLength += 4;  viewDataLength += 4;
        let startDate = _StartDate.replace(/-/g , "");      ghLength += 4;  viewDataLength += 4;
        let endDate = _EndDate.replace(/-/g , "");          ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(brokerCode, 'utf8'), buff, position, 0, 4);            position += 4;
        bops.writeUInt32BE(buff, startDate, position);                              position += 4;
        bops.writeUInt32BE(buff, endDate, position);                                position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        // tools.logSocket('requestView4['+_BrokerCode+']['+_StartDate+']['+_EndDate+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView4(dataview,position) {
      let BrokerCode = tools.ab2str(dataview, position, 4); position += 4; //String
      let StartDate = dataview.getUint32(position); position += 4; //uint 32
      let EndDate = dataview.getUint32(position); position += 4;
      let ResultStartDate = dataview.getUint32(position); position += 4; //uint 32
      let ResultEndDate = dataview.getUint32(position); position += 4;
      let NoProductBoard = dataview.getUint32(position); position += 4;
      let NoProductBoardArray = new Array();

      for (let i = 0; i<NoProductBoard; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
          let BuyFreq = dataview.getUint32(position); position += 4;
          let BuyLot = tools.getInt64(dataview,position); position += 8; //int 64
          let BuyValue = tools.getInt64(dataview,position); position += 8;
          let BuyAveragePrice = dataview.getFloat64(position); position += 8; //double
          let BuyLotPercent = dataview.getFloat64(position); position += 8;
          let SellFreq = dataview.getUint32(position); position += 4;
          let SellLot = tools.getInt64(dataview,position); position += 8;
          let SellValue = tools.getInt64(dataview,position); position += 8;
          let SellAveragePrice = dataview.getFloat64(position); position += 8;
          let SellLotPercent = dataview.getFloat64(position); position += 8;
          let NetFreq = dataview.getInt32(position); position += 4;
          let NetLot = tools.getInt64(dataview,position); position += 8;
          let NetValue = tools.getInt64(dataview,position); position += 8;
          let BuyForeignFreq = dataview.getUint32(position); position += 4;
          let BuyForeignLot = tools.getInt64(dataview,position); position += 8;
          let BuyForeignValue = tools.getInt64(dataview,position); position += 8;
          let BuyForeignAveragePrice = dataview.getFloat64(position); position += 8;
          let SellForeignFreq = dataview.getUint32(position); position += 4;
          let SellForeignLot = tools.getInt64(dataview,position); position += 8;
          let SellForeignValue = tools.getInt64(dataview,position); position += 8;
          let SellForeignAveragePrice = dataview.getFloat64(position); position += 8;
          let NetForeignFreq = dataview.getInt32(position); position += 4;
          let NetForeignLot = tools.getInt64(dataview,position); position += 8;
          let NetForeignValue = tools.getInt64(dataview,position); position += 8;

          let ProductCodeDisplay = ProductCode;
          if(BoardCode!="RG") ProductCodeDisplay = ProductCode+'.'+BoardCode;
          let ProductBoardArray = {
              "ProductCode":ProductCode,
              "ProductCodeDisplay":ProductCodeDisplay,
              "BoardCode":BoardCode,
              "BuyFreq":BuyFreq,
              "BuyLot":BuyLot,
              "BuyValue":BuyValue,
              "BuyAveragePrice":BuyAveragePrice,
              "BuyLotPercent":BuyLotPercent,
              "SellFreq":SellFreq,
              "SellLot":SellLot,
              "SellValue":SellValue,
              "SellAveragePrice":SellAveragePrice,
              "SellLotPercent":SellLotPercent,
              "NetFreq":NetFreq,
              "NetLot":NetLot,
              "NetValue":NetValue,
              "BuyForeignFreq":BuyForeignFreq,
              "BuyForeignLot":BuyForeignLot,
              "BuyForeignValue":BuyForeignValue,
              "BuyForeignAveragePrice":BuyForeignAveragePrice,
              "SellForeignFreq":SellForeignFreq,
              "SellForeignLot":SellForeignLot,
              "SellForeignValue":SellForeignValue,
              "SellForeignAveragePrice":SellForeignAveragePrice,
              "NetForeignFreq":NetForeignFreq,
              "NetForeignLot":NetForeignLot,
              "NetForeignValue":NetForeignValue,
          };

          NoProductBoardArray.push(ProductBoardArray);
      }

      let view4 = {
          "BrokerCode":BrokerCode,
          "StartDate":StartDate,
          "EndDate":EndDate,
          "NoProductBoard":NoProductBoard,
          "NoProductBoardArray":NoProductBoardArray,
      };

      // tools.logSocket('responView4');
      // tools.logSocket(view4);
      messageCenter.runCallback("view4",view4);
    }
    requestView5(_ProductCode,_BoardCode,_StartDate,_EndDate) {
      if(this.isOpen) {
      //header
        let ghLength = 0;
        let ghMessageId = 0x06;                           ghLength += 1;
        let ghMessageFlag = 0x20;                         ghLength += 1;

        //view
        let viewId = 5;                                   ghLength += 2;
        let viewMessageCode = 0x00;                       ghLength += 1;
        let requestId = 0x00;                             ghLength += 2;
        let windowsId = 0;                                ghLength += 4;
        let viewDataLength = 0;                           ghLength += 4;
        let productCode = _ProductCode;                   ghLength += 24; viewDataLength += 24;
        let boardCode = _BoardCode;                       ghLength += 4;  viewDataLength += 4;
        let startDate = _StartDate.replace(/-/g , "");    ghLength += 4;  viewDataLength += 4;
        let endDate = _EndDate.replace(/-/g , "");        ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
        bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;
        bops.writeUInt32BE(buff, startDate, position);                              position += 4;
        bops.writeUInt32BE(buff, endDate, position);                                position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView5['+_ProductCode+']['+_BoardCode+']['+_StartDate+']['+_EndDate+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView5(dataview:any,position:number) {
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let StartDate = dataview.getUint32(position); position += 4;
      let EndDate = dataview.getUint32(position); position += 4;
      let ResultStartDate = dataview.getUint32(position); position += 4; //uint 32
      let ResultEndDate = dataview.getUint32(position); position += 4;
      let NoBroker = dataview.getUint32(position); position += 4;
      let NoBrokerArray = new Array();
      for (let i = 0; i<NoBroker; i++)
      {
          let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
          let BuyFreq = dataview.getUint32(position); position += 4;
          let BuyLot = tools.getInt64(dataview,position); position += 8;
          let BuyValue = tools.getInt64(dataview,position); position += 8;
          let BuyAveragePrice = dataview.getFloat64(position); position += 8;
          let BuyLotPercent = dataview.getFloat64(position); position += 8;
          let SellFreq = dataview.getUint32(position); position += 4;
          let SellLot = tools.getInt64(dataview,position); position += 8;
          let SellValue = tools.getInt64(dataview,position); position += 8;
          let SellAveragePrice = dataview.getFloat64(position); position += 8;
          let SellLotPercent = dataview.getFloat64(position); position += 8;
          let NetFreq = dataview.getUint32(position); position += 4;
          let NetLot = tools.getInt64(dataview,position); position += 8;
          let NetValue = tools.getInt64(dataview,position); position += 8;
          let BuyForeignFreq = dataview.getUint32(position); position += 4;
          let BuyForeignLot = tools.getInt64(dataview,position); position += 8;
          let BuyForeignValue = tools.getInt64(dataview,position); position += 8;
          let BuyForeignAveragePrice = dataview.getFloat64(position); position += 8;
          let SellForeignFreq = dataview.getUint32(position); position += 4;
          let SellForeignLot = tools.getInt64(dataview,position); position += 8;
          let SellForeignValue = tools.getInt64(dataview,position); position += 8;
          let SellForeignAveragePrice = dataview.getFloat64(position); position += 8;
          let NetForeignFreq = dataview.getUint32(position); position += 4;
          let NetForeignLot = tools.getInt64(dataview,position); position += 8;
          let NetForeignValue = tools.getInt64(dataview,position); position += 8;
          let BrokerArray = {
              "BrokerCode":BrokerCode,
              "BuyFreq":BuyFreq,
              "BuyLot":BuyLot,
              "BuyValue":BuyValue,
              "BuyAveragePrice":BuyAveragePrice,
              "BuyLotPercent":BuyLotPercent,
              "SellFreq":SellFreq,
              "SellLot":SellLot,
              "SellValue":SellValue,
              "SellAveragePrice":SellAveragePrice,
              "SellLotPercent":SellLotPercent,
              "NetFreq":NetFreq,
              "NetLot":NetLot,
              "NetValue":NetValue,
              "BuyForeignFreq":BuyForeignFreq,
              "BuyForeignLot":BuyForeignLot,
              "BuyForeignValue":BuyForeignValue,
              "BuyForeignAveragePrice":BuyForeignAveragePrice,
              "SellForeignFreq":SellForeignFreq,
              "SellForeignLot":SellForeignLot,
              "SellForeignValue":SellForeignValue,
              "SellForeignAveragePrice":SellForeignAveragePrice,
              "NetForeignFreq":NetForeignFreq,
              "NetForeignLot":NetForeignLot,
              "NetForeignValue":NetForeignValue,
          };
          NoBrokerArray.push(BrokerArray);
      }

      let view5 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "StartDate":StartDate,
          "EndDate":EndDate,
          "NoBroker":NoBroker,
          "NoBrokerArray":NoBrokerArray,
      };
      tools.logSocket('responView5');
      tools.logSocket(view5);
      messageCenter.runCallback("view5",view5);
    }
    requestView6(_ProductCode,_BoardCode,_MaxLevel){
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 6;                 ghLength += 2;
        let viewMessageCode = 0x00;     ghLength += 1;
        let requestId = 0x00;           ghLength += 2;
        let windowsId = 0;              ghLength += 4;
        let viewDataLength = 0;         ghLength += 4;
        let productCode = _ProductCode; ghLength += 24; viewDataLength += 24;
        let boardCode = _BoardCode;     ghLength += 4;  viewDataLength += 4;
        let maxLevel = _MaxLevel;       ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(productCode,'utf8'), buff, position, 0, 24); position += 24;
        bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;
        bops.writeUInt32BE(buff, maxLevel, position);                               position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        // tools.logSocket('requestView6['+productCode+']['+boardCode+']['+_MaxLevel+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView6(dataview:any,position:number) {
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let MaxLevel = dataview.getUint32(position); position += 4;
      let NoBrokerBuy = dataview.getUint32(position); position += 4;
      let NoBrokerBuyArray = new Array();
      for (let i = 0; i<NoBrokerBuy; i++)
      {
          let BrokerBuyCode = tools.ab2str(dataview, position, 4); position += 4;
          let BrokerBuyFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyAvgPrice = dataview.getFloat64(position); position += 8;
          let BrokerBuyForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignValue = tools.getInt64(dataview,position); position += 8;
          
          let BrokerBuyArray = {
              "BrokerBuyCode":BrokerBuyCode,
              "BrokerBuyFreq":BrokerBuyFreq,
              "BrokerBuyLot":BrokerBuyLot,
              "BrokerBuyValue":BrokerBuyValue,
              "BrokerBuyAvgPrice":BrokerBuyAvgPrice,
              "BrokerBuyForeignFreq":BrokerBuyForeignFreq,
              "BrokerBuyForeignLot":BrokerBuyForeignLot,
              "BrokerBuyForeignValue":BrokerBuyForeignValue,
          };
          NoBrokerBuyArray.push(BrokerBuyArray);
      }
      let NoBrokerSell = dataview.getUint32(position); position += 4;
      let NoBrokerSellArray = new Array();
      for (let i = 0; i<NoBrokerSell; i++)
      {
          let BrokerSellCode = tools.ab2str(dataview, position, 4); position += 4;
          let BrokerSellFreq = dataview.getUint32(position); position += 4;
          let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellAvgPrice = dataview.getFloat64(position); position += 8;
          let BrokerSellForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerSellForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignValue = tools.getInt64(dataview,position); position += 8;
          
          let BrokerSellArray = {
              "BrokerSellCode":BrokerSellCode,
              "BrokerSellFreq":BrokerSellFreq,
              "BrokerSellLot":BrokerSellLot,
              "BrokerSellValue":BrokerSellValue,
              "BrokerSellAvgPrice":BrokerSellAvgPrice,
              "BrokerSellForeignFreq":BrokerSellForeignFreq,
              "BrokerSellForeignLot":BrokerSellForeignLot,
              "BrokerSellForeignValue":BrokerSellForeignValue,
          };
          NoBrokerSellArray.push(BrokerSellArray);
      }
      
      let view6 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "MaxLevel":MaxLevel,
          "NoBrokerBuy":NoBrokerBuy,
          "NoBrokerBuyArray":NoBrokerBuyArray,
          "NoBrokerSell":NoBrokerSell,
          "NoBrokerSellArray":NoBrokerSellArray,
      };
      // tools.logSocket('responView6');
      // tools.logSocket(view6);
      messageCenter.runCallback("view6",view6);
    }
    requestView7(_ProductCode,_BoardCode) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 7;                 ghLength += 2;
        let viewMessageCode = 0x00;     ghLength += 1;
        let requestId = 0x00;           ghLength += 2;
        let windowsId = 0;              ghLength += 4;
        let viewDataLength = 0;         ghLength += 4;
        let productCode = _ProductCode; ghLength += 24; viewDataLength += 24;
        let boardCode = _BoardCode;     ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
        bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView7');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView7(dataview:any,position:number) {
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24; //string
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4; //string
      let PreviousPrice = dataview.getFloat64(position); position += 8; //double
      let NoTradeBook = dataview.getUint32(position); position += 4; //uint 32
      let NoTradeBookArray = new Array();
      for (let i = 0; i<NoTradeBook; i++)
      {
          let Price = dataview.getFloat64(position); position += 8; //double
          let Freq = dataview.getUint32(position); position += 4; //uint 32
          let Lot = tools.getInt64(dataview,position); position += 8; //int 64
          let Value = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignBuyFreq = dataview.getUint32(position); position += 4; //uint 32
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignSellFreq = dataview.getUint32(position); position += 4; //uint 32
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8; //int 64
          let BLot = tools.getInt64(dataview,position); position += 8; //int 64
          let SLot = tools.getInt64(dataview,position); position += 8; //int 64
          let BFreq = dataview.getUint32(position); position += 4; //uint 32
          let SFreq = dataview.getUint32(position); position += 4; //uint 32

          let ArrayItem = {
              "Price":Price,
              "Freq":Freq,
              "Lot":Lot,
              "Value":Value,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BLot":BLot,
              "SLot":SLot,
              "BFreq":BFreq,
              "SFreq":SFreq,
          };
          NoTradeBookArray.push(ArrayItem);
      }

      let view7 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "PreviousPrice":PreviousPrice,
          "NoTradeBook":NoTradeBook,
          "NoTradeBookArray":NoTradeBookArray,
      };

      // tools.logSocket('responView7');
      // tools.logSocket(view7);
      messageCenter.runCallback("view7",view7);
    }
    requestView8(_ProductCode,_BoardCode,_LastTradeNo,_RecordsRequest) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 8;                 ghLength += 2;
        let viewMessageCode = 0x00;     ghLength += 1;
        let requestId = 0x00;           ghLength += 2;
        let windowsId = 0;              ghLength += 4;
        let viewDataLength = 0;         ghLength += 4;
        let productCode = _ProductCode; ghLength += 24; viewDataLength += 24;
        let boardCode = _BoardCode;     ghLength += 4;  viewDataLength += 4;
        let LastTradeNo = _LastTradeNo;   ghLength += 8;  viewDataLength += 8;
        let RecordsRequest = _RecordsRequest;  ghLength += 4;  viewDataLength += 4;
        

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24);          position += 24;
        bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);             position += 4;
        bops.writeUInt32BE(buff, LastTradeNo, position+4);/*WARNING INT64*/         position += 8;
        bops.writeUInt32BE(buff, RecordsRequest, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView8');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView8(dataview:any,position:number) {
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24; //string
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4; //string
      let LastTradeNo = tools.getInt64(dataview,position); position += 8; //int 64
      let RecordsRequest = dataview.getUint32(position); position += 4; //uint 32
    
      let NoTickTrade = dataview.getUint32(position); position += 4; //uint 32
      let NoTickTradeArray = new Array();
      for (let i = 0; i<NoTickTrade; i++)
      {
        let TradeTime = dataview.getUint32(position); position += 4; //uint 32
        let TradeNo = tools.getInt64(dataview,position); position += 8; //int 64
        let BrokerBuy = tools.ab2str(dataview, position, 4); position += 4; //string
        let BrokerSell = tools.ab2str(dataview, position, 4); position += 4; //string
        let BuyerType = tools.ab2str(dataview, position, 1); position += 1; //string
        let SellerType = tools.ab2str(dataview, position, 1); position += 1; //string
        let Lot = tools.getInt64(dataview,position); position += 8; //int 64
        let Price = dataview.getFloat64(position); position += 8; //double
        let Change = dataview.getFloat64(position); position += 8; //double
        let BuyerOrderNo = tools.getInt64(dataview,position); position += 8; //int 64
        let SellerOrderNo = tools.getInt64(dataview,position); position += 8; //int 64

        let ArrayItem = {
              "TradeTime":TradeTime,
              "TradeNo":TradeNo,
              "BrokerBuy":BrokerBuy,
              "BrokerSell":BrokerSell,
              "BuyerType":BuyerType,
              "SellerType":SellerType,
              "Lot":Lot,
              "Price":Price,
              "Change":Change,
              "BuyerOrderNo":BuyerOrderNo,
              "SellerOrderNo":SellerOrderNo,
          };
          NoTickTradeArray.push(ArrayItem);
      }

      let view8 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "LastTradeNo":LastTradeNo,
          "RecordsRequest":RecordsRequest,
          "NoTickTrade":NoTickTrade,
          "NoTickTradeArray":NoTickTradeArray,
      };

      // tools.logSocket('responView8');
      // tools.logSocket(view8);
      messageCenter.runCallback("view8",view8);
    }
    requestView9(_ProductCode,_BoardCode,_Date,_LastTradeNo,_RecordsRequest) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;                     ghLength += 1;
        let ghMessageFlag = 0x20;                   ghLength += 1;

        //view
        let viewId = 9;                             ghLength += 2;
        let viewMessageCode = 0x00;                 ghLength += 1;
        let requestId = 0x00;                       ghLength += 2;
        let windowsId = 0;                          ghLength += 4;
        let viewDataLength = 0;                     ghLength += 4;
        let productCode = _ProductCode;             ghLength += 24; viewDataLength += 24;
        let boardCode = _BoardCode;                 ghLength += 4;  viewDataLength += 4;
        let iDate = _Date.replace(/-/g , ""); ;     ghLength += 4;  viewDataLength += 4;
        let LastTradeNo = _LastTradeNo;             ghLength += 8;  viewDataLength += 8;
        let RecordsRequest = _RecordsRequest;       ghLength += 4;  viewDataLength += 4;
        

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24);          position += 24;
        bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);             position += 4;
        bops.writeUInt32BE(buff, iDate, position);                                  position += 4;
        bops.writeUInt32BE(buff, LastTradeNo, position+4);/*WARNING INT64*/         position += 8;
        bops.writeUInt32BE(buff, RecordsRequest, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView9');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView9(dataview:any,position:number) {
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24; //string
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4; //string
      let _Date = dataview.getUint32(position); position += 4; //uint 32
      let LastTradeNo = tools.getInt64(dataview,position); position += 8; //int 64
      let RecordsRequest = dataview.getUint32(position); position += 4; //uint 32
    
      let NoTickTrade = dataview.getUint32(position); position += 4; //uint 32
      let NoTickTradeArray = new Array();
      for (let i = 0; i<NoTickTrade; i++)
      {
        let TradeTime = dataview.getUint32(position); position += 4; //uint 32
        let TradeNo = tools.getInt64(dataview,position); position += 8; //int 64
        let BrokerBuy = tools.ab2str(dataview, position, 4); position += 4; //string
        let BrokerSell = tools.ab2str(dataview, position, 4); position += 4; //string
        let BuyerType = tools.ab2str(dataview, position, 1); position += 1; //string
        let SellerType = tools.ab2str(dataview, position, 1); position += 1; //string
        let Lot = tools.getInt64(dataview,position); position += 8; //int 64
        let Price = dataview.getFloat64(position); position += 8; //double
        let Change = dataview.getFloat64(position); position += 8; //double
        let BuyerOrderNo = tools.getInt64(dataview,position); position += 8; //int 64
        let SellerOrderNo = tools.getInt64(dataview,position); position += 8; //int 64

        let ArrayItem = {
              "TradeTime":TradeTime,
              "TradeNo":TradeNo,
              "BrokerBuy":BrokerBuy,
              "BrokerSell":BrokerSell,
              "BuyerType":BuyerType,
              "SellerType":SellerType,
              "Lot":Lot,
              "Price":Price,
              "Change":Change,
              "BuyerOrderNo":BuyerOrderNo,
              "SellerOrderNo":SellerOrderNo,
          };
          NoTickTradeArray.push(ArrayItem);
      }

      let view9 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "Date":_Date,
          "LastTradeNo":LastTradeNo,
          "RecordsRequest":RecordsRequest,
          "NoTickTrade":NoTickTrade,
          "NoTickTradeArray":NoTickTradeArray,
      };

      tools.logSocket('responView9');
      tools.logSocket(view9);
      messageCenter.runCallback("view9",view9);
    }
    requestView10(_ProductCode,_BoardCode,_LastDate,_RecordsRequest){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 10;                                    ghLength += 2;
      let viewMessageCode = 0x00;                         ghLength += 1;
      let requestId = 0x00;                               ghLength += 2;
      let windowsId = 0;                                  ghLength += 4;
      let viewDataLength = 0;                             ghLength += 4;
      let productCode = _ProductCode;                     ghLength += 24; viewDataLength += 24;
      let boardCode = _BoardCode;                         ghLength += 4;  viewDataLength += 4;
      let lastDate = _LastDate.replace(/-/g , "");        ghLength += 4;  viewDataLength += 4;
      let recordsRequest = _RecordsRequest;               ghLength += 4;  viewDataLength += 4;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
      bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;
      bops.writeUInt32BE(buff, lastDate, position);                               position += 4;
      bops.writeUInt32BE(buff, recordsRequest, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);   
    }
    responseView10(dataview,position){
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let LastDate = dataview.getUint32(position); position += 4;
      let RecordsRequest = dataview.getUint32(position); position += 4;
      let NoDate = dataview.getUint32(position); position += 4;
      
      let NoDateArray = new Array();
      for (let i = 0; i<NoDate; i++){
          let nDate = dataview.getUint32(position); position += 4;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          
          let NoDateArrayItem = {
              "Date":nDate,
              "PreviousPrice":PreviousPrice,
              "LastPrice":LastPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
          };
          NoDateArray.push(NoDateArrayItem);
      }
      
      let view10 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "LastDate":LastDate,
          "RecordsRequest":RecordsRequest,
          "NoDate":NoDate,
          "NoDateArray":NoDateArray,
      };
      messageCenter.runCallback("view10",view10);
    }
    requestView13(_ProductCode,_ChartInterval,_LastDate,_LastTime,_RecordsRequest,_AdjustedData) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 13;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      let productCode = _ProductCode;         ghLength += 24; viewDataLength += 24;
      let chartInterval = _ChartInterval;     ghLength += 1;  viewDataLength += 1;
      let lastDate = _LastDate;               ghLength += 4;  viewDataLength += 4;
      let lastTime = _LastTime;               ghLength += 4;  viewDataLength += 4;
      let recordsRequest = _RecordsRequest;   ghLength += 4;  viewDataLength += 4;
      let adjustedData = _AdjustedData;       ghLength += 1;  viewDataLength += 1;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
      bops.copy( bops.from(chartInterval, 'utf8'), buff, position, 0, 1); position += 1;
      bops.writeUInt32BE(buff, lastDate, position);                               position += 4;
      bops.writeUInt32BE(buff, lastTime, position);                               position += 4;
      bops.writeUInt32BE(buff, recordsRequest, position);                         position += 4;
      //bops.copy( bops.from(adjustedData, encoding='utf8'), buff, position, 0, 1); position += 1;
      bops.writeInt8(buff, adjustedData, position);                               position += 1;
      
      //Sending to websocket
      this.websocket.send(buff);
    }
    responseView13(dataview:any,position:number) {
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let ChartInterval = tools.ab2str(dataview, position, 1); position += 1;
      let LastDate = dataview.getUint32(position); position += 4;
      let LastTime = dataview.getUint32(position); position += 4;
      let RecordsRequest = dataview.getUint32(position); position += 4;
      //let AdjustedData = tools.ab2str(dataview, position, 1); position += 1;
      let AdjustedData = String.fromCharCode(dataview.getUint8(position)); position += 1;
      let NoDateTime = dataview.getUint32(position); position += 4;
      let NoDateTimeArray = new Array();
      for (let i = 0; i<NoDateTime; i++)
      {
          let Date = dataview.getUint32(position); position += 4;
          let Time = dataview.getUint32(position); position += 4;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let ClosePrice = dataview.getFloat64(position); position += 8;
          let Volume = tools.getInt64(dataview,position); position += 8;       
          
          let ArrayItem = {
              "Date":Date,
              "Time":Time,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "ClosePrice":ClosePrice,
              "Volume":Volume,
          };
          NoDateTimeArray.push(ArrayItem);
      }
    
      let view13 = {
          "ProductCode":ProductCode,
          "ChartInterval":ChartInterval,
          "LastDate":LastDate,
          "LastTime":LastTime,
          "RecordsRequest":RecordsRequest,
          "AdjustedData":AdjustedData,
          "NoDateTime":NoDateTime,
          "NoDateTimeArray":NoDateTimeArray,
      };
      messageCenter.runCallback("view13",view13);
    }
    requestView14(_PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 14;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView14');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView14(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      for (let i = 0; i<NoProduct; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          let BestBidPrice = dataview.getFloat64(position); position += 8;
          let BestOfferPrice = dataview.getFloat64(position); position += 8;
          let BestBidLot = tools.getInt64(dataview,position); position += 8;
          let BestOfferLot = tools.getInt64(dataview,position); position += 8;

          let ProductArray = {
              "ProductCode":ProductCode,
              "LastPrice":LastPrice,
              "PreviousPrice":PreviousPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BestBidPrice":BestBidPrice,
              "BestOfferPrice":BestOfferPrice,
              "BestBidLot":BestBidLot,
              "BestOfferLot":BestOfferLot,
          };
          NoProductArray.push(ProductArray);
      }
      let view14 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoProduct":NoProduct,
          "NoProductArray":NoProductArray,
      };
      // tools.logSocket('responView14');
      // tools.logSocket(view14);
      messageCenter.runCallback("view14",view14);
    }
    requestView15( _PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 15;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView15');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView15(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      for (let i = 0; i<NoProduct; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          let BestBidPrice = dataview.getFloat64(position); position += 8;
          let BestOfferPrice = dataview.getFloat64(position); position += 8;
          let BestBidLot = tools.getInt64(dataview,position); position += 8;
          let BestOfferLot = tools.getInt64(dataview,position); position += 8;

          let ProductArray = {
              "ProductCode":ProductCode,
              "LastPrice":LastPrice,
              "PreviousPrice":PreviousPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BestBidPrice":BestBidPrice,
              "BestOfferPrice":BestOfferPrice,
              "BestBidLot":BestBidLot,
              "BestOfferLot":BestOfferLot,
          };
          NoProductArray.push(ProductArray);
      }
      let view15 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoProduct":NoProduct,
          "NoProductArray":NoProductArray,
      };
      // tools.logSocket('responView15');
      // tools.logSocket(view15);
      messageCenter.runCallback("view15",view15);
    }
    requestView16( _PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 16;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView16');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView16(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      for (let i = 0; i<NoProduct; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          let BestBidPrice = dataview.getFloat64(position); position += 8;
          let BestOfferPrice = dataview.getFloat64(position); position += 8;
          let BestBidLot = tools.getInt64(dataview,position); position += 8;
          let BestOfferLot = tools.getInt64(dataview,position); position += 8;

          let ProductArray = {
              "ProductCode":ProductCode,
              "LastPrice":LastPrice,
              "PreviousPrice":PreviousPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BestBidPrice":BestBidPrice,
              "BestOfferPrice":BestOfferPrice,
              "BestBidLot":BestBidLot,
              "BestOfferLot":BestOfferLot,
          };
          NoProductArray.push(ProductArray);
      }
      let view16 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoProduct":NoProduct,
          "NoProductArray":NoProductArray,
      };
      tools.logSocket('responView16');
      tools.logSocket(view16);
      messageCenter.runCallback("view16",view16);
    }
    requestView17(_PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 17;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView17');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView17(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      for (let i = 0; i<NoProduct; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          let BestBidPrice = dataview.getFloat64(position); position += 8;
          let BestOfferPrice = dataview.getFloat64(position); position += 8;
          let BestBidLot = tools.getInt64(dataview,position); position += 8;
          let BestOfferLot = tools.getInt64(dataview,position); position += 8;

          let ProductArray = {
              "ProductCode":ProductCode,
              "LastPrice":LastPrice,
              "PreviousPrice":PreviousPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BestBidPrice":BestBidPrice,
              "BestOfferPrice":BestOfferPrice,
              "BestBidLot":BestBidLot,
              "BestOfferLot":BestOfferLot,
          };
          NoProductArray.push(ProductArray);
      }
      let view17 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoProduct":NoProduct,
          "NoProductArray":NoProductArray,
      };
      tools.logSocket('responView17');
      tools.logSocket(view17);
      messageCenter.runCallback("view17",view17);
    }
    requestView18(_PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 18;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView18');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView18(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      for (let i = 0; i<NoProduct; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          let BestBidPrice = dataview.getFloat64(position); position += 8;
          let BestOfferPrice = dataview.getFloat64(position); position += 8;
          let BestBidLot = tools.getInt64(dataview,position); position += 8;
          let BestOfferLot = tools.getInt64(dataview,position); position += 8;

          let ProductArray = {
              "ProductCode":ProductCode,
              "LastPrice":LastPrice,
              "PreviousPrice":PreviousPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BestBidPrice":BestBidPrice,
              "BestOfferPrice":BestOfferPrice,
              "BestBidLot":BestBidLot,
              "BestOfferLot":BestOfferLot,
          };
          NoProductArray.push(ProductArray);
      }
      let view18 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoProduct":NoProduct,
          "NoProductArray":NoProductArray,
      };
      tools.logSocket('responView18');
      tools.logSocket(view18);
      messageCenter.runCallback("view18",view18);
    }
    requestView19(_PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 19;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                               position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView19');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView19(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      for (let i = 0; i<NoProduct; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          let BestBidPrice = dataview.getFloat64(position); position += 8;
          let BestOfferPrice = dataview.getFloat64(position); position += 8;
          let BestBidLot = tools.getInt64(dataview,position); position += 8;
          let BestOfferLot = tools.getInt64(dataview,position); position += 8;

          let ProductArray = {
              "ProductCode":ProductCode,
              "LastPrice":LastPrice,
              "PreviousPrice":PreviousPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BestBidPrice":BestBidPrice,
              "BestOfferPrice":BestOfferPrice,
              "BestBidLot":BestBidLot,
              "BestOfferLot":BestOfferLot,
          };
          NoProductArray.push(ProductArray);
      }
      let view19 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoProduct":NoProduct,
          "NoProductArray":NoProductArray,
      };
      tools.logSocket('responView19');
      tools.logSocket(view19);
      messageCenter.runCallback("view19",view19);
    }
    requestView20(_PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 20;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView20');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView20(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      for (let i = 0; i<NoProduct; i++)
      {
          let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
          let LastPrice = dataview.getFloat64(position); position += 8;
          let PreviousPrice = dataview.getFloat64(position); position += 8;
          let OpenPrice = dataview.getFloat64(position); position += 8;
          let HighPrice = dataview.getFloat64(position); position += 8;
          let LowPrice = dataview.getFloat64(position); position += 8;
          let AveragePrice = dataview.getFloat64(position); position += 8;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          let BestBidPrice = dataview.getFloat64(position); position += 8;
          let BestOfferPrice = dataview.getFloat64(position); position += 8;
          let BestBidLot = tools.getInt64(dataview,position); position += 8;
          let BestOfferLot = tools.getInt64(dataview,position); position += 8;

          let ProductArray = {
              "ProductCode":ProductCode,
              "LastPrice":LastPrice,
              "PreviousPrice":PreviousPrice,
              "OpenPrice":OpenPrice,
              "HighPrice":HighPrice,
              "LowPrice":LowPrice,
              "AveragePrice":AveragePrice,
              "TotalFreq":TotalFreq,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BestBidPrice":BestBidPrice,
              "BestOfferPrice":BestOfferPrice,
              "BestBidLot":BestBidLot,
              "BestOfferLot":BestOfferLot,
          };
          NoProductArray.push(ProductArray);
      }
      let view20 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoProduct":NoProduct,
          "NoProductArray":NoProductArray,
      };
      tools.logSocket('responView20');
      tools.logSocket(view20);
      messageCenter.runCallback("view20",view20);
    }
    requestView21(_BrokerCode,_LastTradeNo,_RecordRequest) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 21;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let brokerCode = _BrokerCode;           ghLength += 4;  viewDataLength += 4;
        let lastTradeNo = _LastTradeNo;         ghLength += 8;  viewDataLength += 8;
        let recordRequest = _RecordRequest;     ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
 
        bops.copy( bops.from(brokerCode, 'utf8'), buff, position, 0, 4);            position += 4;
        bops.writeUInt32BE(buff, lastTradeNo, position+4);/*WARNING INT64*/         position += 8;
        bops.writeUInt32BE(buff, recordRequest, position);                          position += 4; 

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView21');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView21(dataview:any,position:number) {
      let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
      let LastTradeNo = tools.getInt64(dataview,position); position += 8; 
      let RecordRequest = dataview.getUint32(position); position += 4;
      let NoTrade = dataview.getUint32(position); position += 4;
      let NoTradeArray = new Array();
      for (let i = 0; i<NoTrade; i++) { 
        let TradeTime = dataview.getUint32(position); position += 4;
        let TradeNo = tools.getInt64(dataview,position); position += 8;
        let Price = dataview.getFloat64(position); position += 8;
        let Change = dataview.getFloat64(position); position += 8;
        let Lot = tools.getInt64(dataview,position); position += 8; 
        let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
        let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
        let BrokerBuyerCode = tools.ab2str(dataview, position, 4); position += 4;
        let BuyerType = tools.ab2str(dataview, position, 1); position += 1; 
        let BrokerSellerCode = tools.ab2str(dataview, position, 4); position += 4;
        let SellerType = tools.ab2str(dataview, position, 1); position += 1;
        let BuyOrderNo = tools.getInt64(dataview,position); position += 8;
        let SellOrderNo = tools.getInt64(dataview,position); position += 8;

        let ProductArray = {
            "TradeTime":TradeTime,
            "TradeNo":TradeNo,
            "Price":Price,
            "Change":Change,
            "Lot":Lot,
            "ProductCode":ProductCode,
            "BoardCode":BoardCode,
            "BrokerBuyerCode":BrokerBuyerCode,
            "BuyerType":BuyerType,
            "BrokerSellerCode":BrokerSellerCode,
            "SellerType":SellerType,
            "BuyOrderNo":BuyOrderNo,
            "SellOrderNo":SellOrderNo, 
        };
        NoTradeArray.push(ProductArray);
      }
      let view21 = {
          "BrokerCode":BrokerCode,
          "LastTradeNo":LastTradeNo,
          "RecordRequest":RecordRequest,
          "NoTrade":NoTrade,
          "NoTradeArray":NoTradeArray,
      };
      tools.logSocket('responView21');
      tools.logSocket(view21);
      messageCenter.runCallback("view21",view21);
    }

    requestView24(_BrokerCode,_LastDate,_RecordRequest) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 24;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let brokerCode = _BrokerCode;           ghLength += 4;  viewDataLength += 4;
        let lastDate = _LastDate;               ghLength += 4;  viewDataLength += 4;
        let recordRequest = _RecordRequest;     ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
 
        bops.copy( bops.from(brokerCode, 'utf8'), buff, position, 0, 4);            position += 4;
        bops.writeUInt32BE(buff, lastDate, position);                               position += 4;
        bops.writeUInt32BE(buff, recordRequest, position);                          position += 4; 

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView21');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView24(dataview:any,position:number) {
      let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
      let LastDate = dataview.getUint32(position); position += 4;
      let RecordRequest = dataview.getUint32(position); position += 4;
      let NoDate = dataview.getUint32(position); position += 4;
      let NoDateArray = new Array();
      for (let i = 0; i<NoDate; i++) { 
        let BrokerDate = dataview.getUint32(position); position += 4;
        let BrokerBuyFreq = dataview.getUint32(position); position += 4;
        let BrokerBuyVolume = tools.getInt64(dataview,position); position += 8;
        let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
        let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
        let BrokerSellFreq = dataview.getUint32(position); position += 4;
        let BrokerSellVolume = tools.getInt64(dataview,position); position += 8;
        let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
        let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
        let BrokerForeignBuyFreq = dataview.getUint32(position); position += 4;
        let BrokerForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
        let BrokerForeignBuyLot = tools.getInt64(dataview,position); position += 8;
        let BrokerForeignBuyValue = tools.getInt64(dataview,position); position += 8;
        let BrokerForeignSellFreq = dataview.getUint32(position); position += 4;
        let BrokerForeignSellVolume = tools.getInt64(dataview,position); position += 8;
        let BrokerForeignSellLot = tools.getInt64(dataview,position); position += 8;
        let BrokerForeignSellValue = tools.getInt64(dataview,position); position += 8;
 
        let ProductArray = {
            "Date":BrokerDate,
            "BrokerBuyFreq":BrokerBuyFreq,
            "BrokerBuyVolume":BrokerBuyVolume,
            "BrokerBuyLot":BrokerBuyLot,
            "BrokerBuyValue":BrokerBuyValue,
            "BrokerSellFreq":BrokerSellFreq,
            "BrokerSellVolume":BrokerSellVolume,
            "BrokerSellLot":BrokerSellLot,
            "BrokerSellValue":BrokerSellValue,
            "BrokerForeignBuyFreq":BrokerForeignBuyFreq,
            "BrokerForeignBuyVolume":BrokerForeignBuyVolume,
            "BrokerForeignBuyLot":BrokerForeignBuyLot,
            "BrokerForeignBuyValue":BrokerForeignBuyValue, 
            "BrokerForeignSellFreq":BrokerForeignSellFreq, 
            "BrokerForeignSellVolume":BrokerForeignSellVolume, 
            "BrokerForeignSellLot":BrokerForeignSellLot, 
            "BrokerForeignSellValue":BrokerForeignSellValue, 
        };
        NoDateArray.push(ProductArray);
      }
      let view24 = {
          "BrokerCode":BrokerCode,
          "LastDate":LastDate,
          "RecordRequest":RecordRequest,
          "NoDate":NoDate,
          "NoDateArray":NoDateArray,
      };
      tools.logSocket('responView24');
      tools.logSocket(view24);
      messageCenter.runCallback("view24",view24);
    }
    requestView25( _PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 25;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestView25');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView25(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoBroker = dataview.getUint32(position); position += 4;
      let NoBrokerArray = new Array();
      for (let i = 0; i<NoBroker; i++)
      {
          let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
          let BrokerBuyFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellFreq = dataview.getUint32(position); position += 4;
          let BrokerSellVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyForeignVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerSellForeignVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignValue = tools.getInt64(dataview,position); position += 8;

          let NoBrokerArrayItem = {
              "BrokerCode":BrokerCode,
              "BrokerBuyFreq":BrokerBuyFreq,
              "BrokerBuyVolume":BrokerBuyVolume,
              "BrokerBuyLot":BrokerBuyLot,
              "BrokerBuyValue":BrokerBuyValue,
              "BrokerSellFreq":BrokerSellFreq,
              "BrokerSellVolume":BrokerSellVolume,
              "BrokerSellLot":BrokerSellLot,
              "BrokerSellValue":BrokerSellValue,
              "BrokerBuyForeignFreq":BrokerBuyForeignFreq,
              "BrokerBuyForeignVolume":BrokerBuyForeignVolume,
              "BrokerBuyForeignLot":BrokerBuyForeignLot,
              "BrokerBuyForeignValue":BrokerBuyForeignValue,
              "BrokerSellForeignFreq":BrokerSellForeignFreq,
              "BrokerSellForeignVolume":BrokerSellForeignVolume,
              "BrokerSellForeignLot":BrokerSellForeignLot,
              "BrokerSellForeignValue":BrokerSellForeignValue,
          };
          NoBrokerArray.push(NoBrokerArrayItem);
      }
      let view25 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoBroker":NoBroker,
          "NoBrokerArray":NoBrokerArray,
      };
      // tools.logSocket('responView25');
      // tools.logSocket(view25);
      messageCenter.runCallback("view25",view25);
    }
    requestView26( _PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 26;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestView26');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView26(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoBroker = dataview.getUint32(position); position += 4;
      let NoBrokerArray = new Array();
      for (let i = 0; i<NoBroker; i++)
      {
          let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
          let BrokerBuyFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellFreq = dataview.getUint32(position); position += 4;
          let BrokerSellVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyForeignVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerSellForeignVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignValue = tools.getInt64(dataview,position); position += 8;

          let NoBrokerArrayItem = {
              "BrokerCode":BrokerCode,
              "BrokerBuyFreq":BrokerBuyFreq,
              "BrokerBuyVolume":BrokerBuyVolume,
              "BrokerBuyLot":BrokerBuyLot,
              "BrokerBuyValue":BrokerBuyValue,
              "BrokerSellFreq":BrokerSellFreq,
              "BrokerSellVolume":BrokerSellVolume,
              "BrokerSellLot":BrokerSellLot,
              "BrokerSellValue":BrokerSellValue,
              "BrokerBuyForeignFreq":BrokerBuyForeignFreq,
              "BrokerBuyForeignVolume":BrokerBuyForeignVolume,
              "BrokerBuyForeignLot":BrokerBuyForeignLot,
              "BrokerBuyForeignValue":BrokerBuyForeignValue,
              "BrokerSellForeignFreq":BrokerSellForeignFreq,
              "BrokerSellForeignVolume":BrokerSellForeignVolume,
              "BrokerSellForeignLot":BrokerSellForeignLot,
              "BrokerSellForeignValue":BrokerSellForeignValue,
          };
          NoBrokerArray.push(NoBrokerArrayItem);
      }
      let view26 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoBroker":NoBroker,
          "NoBrokerArray":NoBrokerArray,
      };
      // tools.logSocket('responView26');
      // tools.logSocket(view26);
      messageCenter.runCallback("view26",view26);
    }
    requestView27( _PageNo,_RecordsPerPages) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 27;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;

        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestView27');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView27(dataview:any,position:number) {
      let PageNo = dataview.getUint32(position); position += 4;
      let RecordsPerPages = dataview.getUint32(position); position += 4;
      let NoBroker = dataview.getUint32(position); position += 4;
      let NoBrokerArray = new Array();
      for (let i = 0; i<NoBroker; i++)
      {
          let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
          let BrokerBuyFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellFreq = dataview.getUint32(position); position += 4;
          let BrokerSellVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerBuyForeignVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyForeignValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignFreq = dataview.getUint32(position); position += 4;
          let BrokerSellForeignVolume = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignLot = tools.getInt64(dataview,position); position += 8;
          let BrokerSellForeignValue = tools.getInt64(dataview,position); position += 8;

          let NoBrokerArrayItem = {
              "BrokerCode":BrokerCode,
              "BrokerBuyFreq":BrokerBuyFreq,
              "BrokerBuyVolume":BrokerBuyVolume,
              "BrokerBuyLot":BrokerBuyLot,
              "BrokerBuyValue":BrokerBuyValue,
              "BrokerSellFreq":BrokerSellFreq,
              "BrokerSellVolume":BrokerSellVolume,
              "BrokerSellLot":BrokerSellLot,
              "BrokerSellValue":BrokerSellValue,
              "BrokerBuyForeignFreq":BrokerBuyForeignFreq,
              "BrokerBuyForeignVolume":BrokerBuyForeignVolume,
              "BrokerBuyForeignLot":BrokerBuyForeignLot,
              "BrokerBuyForeignValue":BrokerBuyForeignValue,
              "BrokerSellForeignFreq":BrokerSellForeignFreq,
              "BrokerSellForeignVolume":BrokerSellForeignVolume,
              "BrokerSellForeignLot":BrokerSellForeignLot,
              "BrokerSellForeignValue":BrokerSellForeignValue,
          };
          NoBrokerArray.push(NoBrokerArrayItem);
      }
      let view27 = {
          "PageNo":PageNo,
          "RecordsPerPages":RecordsPerPages,
          "NoBroker":NoBroker,
          "NoBrokerArray":NoBrokerArray,
      };
      // tools.logSocket('responView27');
      // tools.logSocket(view27);
      messageCenter.runCallback("view27",view27);
    }
    requestView29(_IndicesCode) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 29;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let indicesCode = _IndicesCode;         ghLength += 12;  viewDataLength += 12;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.copy( bops.from(indicesCode, 'utf8'), buff, position, 0, 12); position += 12;

        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestView29['+indicesCode+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView29(dataview:any,position:number) {
        let IndicesCode = tools.ab2str(dataview, position, 12); position += 12;
        let PreviousIndices = dataview.getFloat64(position); position += 8;
        let LastIndices = dataview.getFloat64(position); position += 8;
        let OpenIndices = dataview.getFloat64(position); position += 8;
        let HighIndices = dataview.getFloat64(position); position += 8;
        let LowIndices = dataview.getFloat64(position); position += 8;
        let TotalFreq = dataview.getUint32(position); position += 4;
        let TotalVolume = tools.getInt64(dataview,position); position += 8;
        let TotalLot = tools.getInt64(dataview,position); position += 8;
        let TotalValue = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyFreq = dataview.getUint32(position); position += 4;
        let ForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
        let ForeignSellFreq = dataview.getUint32(position); position += 4;
        let ForeignSellVolume = tools.getInt64(dataview,position); position += 8;
        let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
        let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
        let TotalUpProduct = dataview.getUint32(position); position += 4;
        let TotalDownProduct = dataview.getUint32(position); position += 4;
        let TotalUnchangeProduct = dataview.getUint32(position); position += 4;
        let TotalNoTransactionProduct = dataview.getUint32(position); position += 4;
        let OneWIndices = dataview.getFloat64(position); position += 8;
        let OneWHighIndices = dataview.getFloat64(position); position += 8;
        let OneWLowIndices = dataview.getFloat64(position); position += 8;
        let OneMIndices = dataview.getFloat64(position); position += 8;
        let OneMHighIndices = dataview.getFloat64(position); position += 8;
        let OneMLowIndices = dataview.getFloat64(position); position += 8;
        let OneQIndices = dataview.getFloat64(position); position += 8;
        let OneQHighIndices = dataview.getFloat64(position); position += 8;
        let OneQLowIndices = dataview.getFloat64(position); position += 8;
        let OneHIndices = dataview.getFloat64(position); position += 8;
        let OneHHighIndices = dataview.getFloat64(position); position += 8;
        let OneHLowIndices = dataview.getFloat64(position); position += 8;
        let OneYIndices = dataview.getFloat64(position); position += 8;
        let OneYHighIndices = dataview.getFloat64(position); position += 8;
        let OneYLowIndices = dataview.getFloat64(position); position += 8;
        let LifeHighIndices = dataview.getFloat64(position); position += 8;
        let LifeLowIndices = dataview.getFloat64(position); position += 8;
        let LastYearCloseIndices = dataview.getFloat64(position); position += 8;
        let LastYearHighIndices = dataview.getFloat64(position); position += 8;
        let LastYearLowIndices = dataview.getFloat64(position); position += 8;
        let NonRGTotalFreq = dataview.getUint32(position); position += 4;
        let NonRGTotalVolume = tools.getInt64(dataview,position); position += 8;
        let NonRGTotalLot = tools.getInt64(dataview,position); position += 8;
        let NonRGTotalValue = tools.getInt64(dataview,position); position += 8;

        let view29 = {
            "IndicesCode":IndicesCode,
            "PreviousIndices":PreviousIndices,
            "LastIndices":LastIndices,
            "OpenIndices":OpenIndices,
            "HighIndices":HighIndices,
            "LowIndices":LowIndices,
            "TotalFreq":TotalFreq,
            "TotalVolume":TotalVolume,
            "TotalLot":TotalLot,
            "TotalValue":TotalValue,
            "ForeignBuyFreq":ForeignBuyFreq,
            "ForeignBuyVolume":ForeignBuyVolume,
            "ForeignBuyLot":ForeignBuyLot,
            "ForeignBuyValue":ForeignBuyValue,
            "ForeignSellFreq":ForeignSellFreq,
            "ForeignSellVolume":ForeignSellVolume,
            "ForeignSellLot":ForeignSellLot,
            "ForeignSellValue":ForeignSellValue,
            "TotalUpProduct":TotalUpProduct,
            "TotalDownProduct":TotalDownProduct,
            "TotalUnchangeProduct":TotalUnchangeProduct,
            "TotalNoTransactionProduct":TotalNoTransactionProduct,
            "OneWIndices":OneWIndices,
            "OneWHighIndices":OneWHighIndices,
            "OneWLowIndices":OneWLowIndices,
            "OneMIndices":OneMIndices,
            "OneMHighIndices":OneMHighIndices,
            "OneMLowIndices":OneMLowIndices,
            "OneQIndices":OneQIndices,
            "OneQHighIndices":OneQHighIndices,
            "OneQLowIndices":OneQLowIndices,
            "OneHIndices":OneHIndices,
            "OneHHighIndices":OneHHighIndices,
            "OneHLowIndices":OneHLowIndices,
            "OneYIndices":OneYIndices,
            "OneYHighIndices":OneYHighIndices,
            "OneYLowIndices":OneYLowIndices,
            "LifeHighIndices":LifeHighIndices,
            "LifeLowIndices":LifeLowIndices,
            "LastYearCloseIndices":LastYearCloseIndices,
            "LastYearHighIndices":LastYearHighIndices,
            "LastYearLowIndices":LastYearLowIndices,
            "NonRGTotalFreq":NonRGTotalFreq,
            "NonRGTotalVolume":NonRGTotalVolume,
            "NonRGTotalLot":NonRGTotalLot,
            "NonRGTotalValue":NonRGTotalValue,
        };
        // tools.logSocket(view29);
        tools.logSocket('responView29');
        tools.logSocket(view29) 
        messageCenter.runCallback('view29H', view29);
        messageCenter.runCallback('view29', view29);
    }
    requestView31(_IndicesCode,_LastDate,_RecordsRequest){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 31;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      let indicesCode = _IndicesCode;         ghLength += 12;     viewDataLength += 12;
      let lastDate = _LastDate;               ghLength += 4;      viewDataLength += 4;
      let recordsRequest = _RecordsRequest;   ghLength += 4;      viewDataLength += 4;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      bops.copy( bops.from(indicesCode, 'utf8'), buff, position, 0, 12); position += 12;
      bops.writeUInt32BE(buff, lastDate, position);                               position += 4;
      bops.writeUInt32BE(buff, recordsRequest, position);                         position += 4;
      
      //Sending to websocket
        this.websocket.send(buff);
    }
  responseView31(dataview,position){
    let IndicesCode = tools.ab2str(dataview, position, 12); position += 12;
    let LastDate = dataview.getUint32(position); position += 4;
    let RecordsRequest = dataview.getUint32(position); position += 4;
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
        let DateReq = dataview.getUint32(position); position += 4;
        let PreviousIndices = dataview.getFloat64(position); position += 8;
        let LastIndices = dataview.getFloat64(position); position += 8;
        let OpenIndices = dataview.getFloat64(position); position += 8;
        let HighIndices = dataview.getFloat64(position); position += 8;
        let LowIndices = dataview.getFloat64(position); position += 8;
        let TotalFreq = dataview.getUint32(position); position += 4;
        let TotalVolume = tools.getInt64(dataview,position); position += 8;
        let TotalLot = tools.getInt64(dataview,position); position += 8;
        let TotalValue = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyFreq = dataview.getUint32(position); position += 4;
        let ForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
        let ForeignSellFreq = dataview.getUint32(position); position += 4;
        let ForeignSellVolume = tools.getInt64(dataview,position); position += 8;
        let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
        let ForeignSellValue = tools.getInt64(dataview,position); position += 8;

        let NoDataArrayItem = {
            "DateReq":DateReq,
            "PreviousIndices":PreviousIndices,
            "LastIndices":LastIndices,
            "OpenIndices":OpenIndices,
            "HighIndices":HighIndices,
            "LowIndices":LowIndices,
            "TotalFreq":TotalFreq,
            "TotalVolume":TotalVolume,
            "TotalLot":TotalLot,
            "TotalValue":TotalValue,
            "ForeignBuyFreq":ForeignBuyFreq,
            "ForeignBuyVolume":ForeignBuyVolume,
            "ForeignBuyLot":ForeignBuyLot,
            "ForeignBuyValue":ForeignBuyValue,
            "ForeignSellFreq":ForeignSellFreq,
            "ForeignSellVolume":ForeignSellVolume,
            "ForeignSellLot":ForeignSellLot,
            "ForeignSellValue":ForeignSellValue,
        };
        NoDataArray.push(NoDataArrayItem);
    }
    let view31 = {
        "IndicesCode":IndicesCode,
        "LastDate":LastDate,
        "RecordsRequest":RecordsRequest,
        "NoData":NoData,
        "NoDataArray":NoDataArray,
    };
    messageCenter.runCallback("view31",view31);
  }  
  requestView33(){
    if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 33;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket("RequestView33");
    }
  }
  responseView33(dataview,position){
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
      let Name = tools.ab2str(dataview, position,32); position += 32;
      let Value = dataview.getFloat64(position); position += 8;
      let ChangeValue = dataview.getFloat64(position); position += 8;
      let ChangePercent = dataview.getFloat64(position); position += 8;
      let DateTime = tools.ab2str(dataview, position,16); position += 16; 
      let temp1 = DateTime.split(" ");
      
      let tempItem = {
        "Name":Name,
        "Value":Value,  
        "ChangeValue":ChangeValue,
        "ChangePercent":ChangePercent, 
        "DateTime":DateTime, 
        "Date":temp1[0], 
        "Time":temp1[1], 
      };
      NoDataArray.push(tempItem);
    }
    let view33 = {
      "NoData":NoData,
      "NoDataArray":NoDataArray,
    };
    tools.logSocket("view33");
    tools.logSocket(view33);
    messageCenter.runCallback('view33', view33);
  }
  requestView34(){
    if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 34;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket("RequestView34");
    }
  }
  responseView34(dataview,position){
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
      let Name = tools.ab2str(dataview, position,32); position += 32;
      let Value = dataview.getFloat64(position); position += 8;
      let ChangeValue = dataview.getFloat64(position); position += 8;
      let ChangePercent = dataview.getFloat64(position); position += 8;
      let DateTime = tools.ab2str(dataview, position,16); position += 16; 
      let temp1 = DateTime.split(" ");
      
      let tempItem = {
        "Name":Name,
        "Value":Value,  
        "ChangeValue":ChangeValue,
        "ChangePercent":ChangePercent, 
        "DateTime":DateTime, 
        "Date":temp1[0], 
        "Time":temp1[1], 
      };
      NoDataArray.push(tempItem);
    }
    let view34 = {
      "NoData":NoData,
      "NoDataArray":NoDataArray,
    };
    tools.logSocket("view34");
    tools.logSocket(view34);
    messageCenter.runCallback('view34', view34);
  }
  requestView35(){
    if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 35;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket("RequestView35");
    }
  }
  responseView35(dataview,position){
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
      let Name = tools.ab2str(dataview, position,32); position += 32;
      let Value = dataview.getFloat64(position); position += 8;
      let ChangeValue = dataview.getFloat64(position); position += 8;
      let ChangePercent = dataview.getFloat64(position); position += 8;
      let DateTime = tools.ab2str(dataview, position,16); position += 16; 
      let temp1 = DateTime.split(" ");
      
      let tempItem = {
        "Name":Name,
        "Value":Value,  
        "ChangeValue":ChangeValue,
        "ChangePercent":ChangePercent, 
        "DateTime":DateTime, 
        "Date":temp1[0], 
        "Time":temp1[1], 
      };
      NoDataArray.push(tempItem);
    }
    let view35 = {
      "NoData":NoData,
      "NoDataArray":NoDataArray,
    };
    tools.logSocket("view35");
    tools.logSocket(view35);
    messageCenter.runCallback('view35', view35);
  }
  requestView36(){
    if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 36;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket("RequestView36");
    }
  }
  responseView36(dataview,position){
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
      let Name = tools.ab2str(dataview, position,32); position += 32;
      let Value = dataview.getFloat64(position); position += 8;
      let ChangeValue = dataview.getFloat64(position); position += 8;
      let ChangePercent = dataview.getFloat64(position); position += 8;
      let DateTime = tools.ab2str(dataview, position,16); position += 16; 
      let temp1 = DateTime.split(" ");
      
      let tempItem = {
        "Name":Name,
        "Value":Value,  
        "ChangeValue":ChangeValue,
        "ChangePercent":ChangePercent, 
        "DateTime":DateTime, 
        "Date":temp1[0], 
        "Time":temp1[1], 
      };
      NoDataArray.push(tempItem);
    }
    let view36 = {
      "NoData":NoData,
      "NoDataArray":NoDataArray,
    };
    tools.logSocket("view36");
    tools.logSocket(view36);
    messageCenter.runCallback('view36', view36);
  }
  requestView37(){
    if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 37;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket("RequestView37");
    }
  }
  responseView37(dataview,position){
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
      let Name = tools.ab2str(dataview, position,32); position += 32;
      let Value = dataview.getFloat64(position); position += 8;
      let ChangeValue = dataview.getFloat64(position); position += 8;
      let ChangePercent = dataview.getFloat64(position); position += 8;
      let DateTime = tools.ab2str(dataview, position,16); position += 16; 
      let temp1 = DateTime.split(" ");
      
      let tempItem = {
        "Name":Name,
        "Value":Value,  
        "ChangeValue":ChangeValue,
        "ChangePercent":ChangePercent, 
        "DateTime":DateTime, 
        "Date":temp1[0], 
        "Time":temp1[1], 
      };
      NoDataArray.push(tempItem);
    }
    let view37 = {
      "NoData":NoData,
      "NoDataArray":NoDataArray,
    };
    tools.logSocket("view37");
    tools.logSocket(view37);
    messageCenter.runCallback('view37', view37);
  }
  requestView38(){
    if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 38;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket("RequestView38");
    }
  }
  responseView38(dataview,position){
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
      let Name = tools.ab2str(dataview, position,32); position += 32;
      let Value = dataview.getFloat64(position); position += 8;
      let ChangeValue = dataview.getFloat64(position); position += 8;
      let ChangePercent = dataview.getFloat64(position); position += 8;
      let DateTime = tools.ab2str(dataview, position,16); position += 16; 
      let temp1 = DateTime.split(" ");
      
      let tempItem = {
        "Name":Name,
        "Value":Value,  
        "ChangeValue":ChangeValue,
        "ChangePercent":ChangePercent, 
        "DateTime":DateTime, 
        "Date":temp1[0], 
        "Time":temp1[1], 
      };
      NoDataArray.push(tempItem);
    }
    let view38 = {
      "NoData":NoData,
      "NoDataArray":NoDataArray,
    };
    tools.logSocket("view38");
    tools.logSocket(view38);
    messageCenter.runCallback('view38', view38);
  }
  requestView40(){
    if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 40;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket("RequestView40");
    }
  }
  responseView40(dataview,position){
    let NoData = dataview.getUint32(position); position += 4;
    let NoDataArray = new Array();
    for (let i = 0; i<NoData; i++)
    {
      let Name = tools.ab2str(dataview, position,32); position += 32;
      let Value = dataview.getFloat64(position); position += 8;
      let ChangeValue = dataview.getFloat64(position); position += 8;
      let ChangePercent = dataview.getFloat64(position); position += 8;
      let DateTime = tools.ab2str(dataview, position,16); position += 16; 
      let temp1 = DateTime.split(" ");
      
      let tempItem = {
        "Name":Name,
        "Value":Value,  
        "ChangeValue":ChangeValue,
        "ChangePercent":ChangePercent, 
        "DateTime":DateTime, 
        "Date":temp1[0], 
        "Time":temp1[1], 
      };
      NoDataArray.push(tempItem);
    }
    let view40 = {
      "NoData":NoData,
      "NoDataArray":NoDataArray,
    };
    tools.logSocket("view40");
    tools.logSocket(view40);
    messageCenter.runCallback('view40', view40);
  }
    requestView43(){
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 43;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        //Sending to websocket
        this.websocket.send(buff);
        
        //socketLog('requestView43');
      }
    }
    responseView43(dataview,position){
      let NoCommonStock = dataview.getUint32(position); position += 4;
      let NoCommonStockArray = new Array();
      for (let i = 0; i<NoCommonStock; i++)
      {
          let BoardCode = tools.ab2str(dataview, position,4); position += 4;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalVolume = tools.getInt64(dataview,position); position += 8;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellVolume = tools.getInt64(dataview,position); position += 8;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
          
          let NoCommonStockArrayItem = {
              "BoardCode":BoardCode,
              "TotalFreq":TotalFreq,  
              "TotalVolume":TotalVolume,
              "TotalLot":TotalLot, 
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq, 
              "ForeignBuyVolume":ForeignBuyVolume,
              "ForeignBuyLot":ForeignBuyLot, 
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellVolume":ForeignSellVolume,
              "ForeignSellLot":ForeignSellLot, 
              "ForeignSellValue":ForeignSellValue,
              };
              NoCommonStockArray.push(NoCommonStockArrayItem);
      }
      let view43 = {
          "NoCommonStockArray":NoCommonStockArray,
      };
      messageCenter.runCallback('view43', view43);
    }
    
    
    requestView50(){
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 50;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data 

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView50');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView50(dataview:any,position:number) {
      let ServerDate = dataview.getUint32(position); position += 4;
      let ServerTime = dataview.getUint32(position); position += 4;
       
      let view50 = {
          "ServerDate":ServerDate,
          "ServerTime":ServerTime,
      };
      messageCenter.runCallback("view50",view50);
    }
    requestViewHome(){
      if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;         ghLength += 1;
      let ghMessageFlag = 0x20;       ghLength += 1;

      //view
      let viewId = 51;                ghLength += 2;
      let viewMessageCode = 0x00;     ghLength += 1;
      let requestId = 0x00;           ghLength += 2;
      let windowsId = 0;              ghLength += 4;
      let viewDataLength = 0;         ghLength += 4;
      let NoData = 0;                 ghLength += 4;      viewDataLength += 4;
      let DowJonesT = '1';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let DowJones = "Dow Jones";     ghLength += 32;     viewDataLength += 32;
      let NASDAQT = '1';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let NASDAQ = "NASDAQ";     ghLength += 32;     viewDataLength += 32;
      let SPT = '1';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let SP = "S&P";     ghLength += 32;     viewDataLength += 32;
      let FTSET = '6';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let FTSE = "UK FTSE";       ghLength += 32;     viewDataLength += 32;
      let GermanyDAXT = '6';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let GermanyDAX = "GermanyDAX";      ghLength += 32;     viewDataLength += 32;
      let HongKongT = '3';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let HongKong = "HongKong";      ghLength += 32;     viewDataLength += 32;
      let NikkeiT = '3';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Nikkei = "Nikkei 225";      ghLength += 32;     viewDataLength += 32;
      let KoreaT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Korea = "Korea";    ghLength += 32;     viewDataLength += 32;
      let SingaporeT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Singapore = "Singapore";    ghLength += 32;     viewDataLength += 32;
      let ShangHaiT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let ShangHai = "ShangHai";    ghLength += 32;     viewDataLength += 32;
      let MalaysiaT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Malaysia = "Malaysia";    ghLength += 32;     viewDataLength += 32;

      // let COM_BRCRT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let COM_BRCR = "Brent Crude";     ghLength += 32;     viewDataLength += 32;

      // let COM_COPPERT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let COM_COPPER = "Copper";     ghLength += 32;     viewDataLength += 32;

      // let COM_GOLDT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let COM_GOLD = "Gold Future";     ghLength += 32;     viewDataLength += 32;

      // let COM_SILVERT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let COM_SILVER = "Silver";     ghLength += 32;     viewDataLength += 32;    

      // let COM_WTICRUDT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let COM_WTICRUD = "WTI Crude";     ghLength += 32;     viewDataLength += 32;    

      let USDIDRT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let USDIDR = "USD-IDR";     ghLength += 32;     viewDataLength += 32;
      // let USDJPYT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let USDJPY = "USD-JPY";     ghLength += 32;     viewDataLength += 32;
      // let USDCHFT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let USDCHF = "USD-CHF";     ghLength += 32;     viewDataLength += 32;
      // let EURUSDT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let EURUSD = "EUR-USD";     ghLength += 32;     viewDataLength += 32;
      // let GBPUSDT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let GBPUSD = "GBP-USD";     ghLength += 32;     viewDataLength += 32;
      // let AUDUSDT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      // let AUDUSD = "AUD-USD";     ghLength += 32;     viewDataLength += 32;

      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;

      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      bops.writeUInt32BE(buff, NoData, position);                                 position += 4;
      bops.copy( bops.from(DowJonesT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(DowJones, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(NASDAQT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(NASDAQ, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(SPT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(SP, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(FTSET, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(FTSE, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(GermanyDAXT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(GermanyDAX, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(HongKongT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(HongKong, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(NikkeiT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(Nikkei, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(KoreaT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(Korea, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(MalaysiaT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(Malaysia, 'utf8'), buff, position, 0, 32);   position += 32;

      // bops.copy( bops.from(COM_BRCRT, 'utf8'), buff, position, 0, 1);   position += 1;
      // bops.copy( bops.from(COM_BRCR, 'utf8'), buff, position, 0, 32);   position += 32;

      // bops.copy( bops.from(COM_COPPERT, 'utf8'), buff, position, 0, 1);   position += 1;
      // bops.copy( bops.from(COM_COPPER, 'utf8'), buff, position, 0, 32);   position += 32;

      // bops.copy( bops.from(COM_GOLDT, 'utf8'), buff, position, 0, 1);   position += 1;
      // bops.copy( bops.from(COM_GOLD, 'utf8'), buff, position, 0, 32);   position += 32;

      // bops.copy( bops.from(COM_SILVERT, 'utf8'), buff, position, 0, 1);   position += 1;
      // bops.copy( bops.from(COM_SILVER, 'utf8'), buff, position, 0, 32);   position += 32;

      // bops.copy( bops.from(COM_WTICRUDT, 'utf8'), buff, position, 0, 1);   position += 1;
      // bops.copy( bops.from(COM_WTICRUD, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(SingaporeT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(Singapore, 'utf8'), buff, position, 0, 32);   position += 32;
      bops.copy( bops.from(ShangHaiT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(ShangHai, 'utf8'), buff, position, 0, 32);   position += 32;
      bops.copy( bops.from(USDIDRT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(USDIDR, 'utf8'), buff, position, 0, 32);  position += 32;
      // bops.copy( bops.from(USDJPYT, 'utf8'), buff, position, 0, 1);  position += 1;
      // bops.copy( bops.from(USDJPY, 'utf8'), buff, position, 0, 32);  position += 32;
      // bops.copy( bops.from(USDCHFT, 'utf8'), buff, position, 0, 1);  position += 1;
      // bops.copy( bops.from(USDCHF, 'utf8'), buff, position, 0, 32);  position += 32;
      // bops.copy( bops.from(EURUSDT, 'utf8'), buff, position, 0, 1);  position += 1;
      // bops.copy( bops.from(EURUSD, 'utf8'), buff, position, 0, 32);  position += 32;
      // bops.copy( bops.from(GBPUSDT, 'utf8'), buff, position, 0, 1);  position += 1;
      // bops.copy( bops.from(GBPUSD, 'utf8'), buff, position, 0, 32);  position += 32;
      // bops.copy( bops.from(AUDUSDT, 'utf8'), buff, position, 0, 1);  position += 1;
      // bops.copy( bops.from(AUDUSD, 'utf8'), buff, position, 0, 32);  position += 32;

      //Sending to websocket
      this.websocket.send(buff);

      tools.logSocket('requestViewHome');
      }
    }
    requestViewHeaderMenu(){
      if(this.isOpen) {
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;         ghLength += 1;
      let ghMessageFlag = 0x20;       ghLength += 1;

      //view
      let viewId = 51;                ghLength += 2;
      let viewMessageCode = 0x00;     ghLength += 1;
      let requestId = 0x00;           ghLength += 2;
      let windowsId = 0;              ghLength += 4;
      let viewDataLength = 0;         ghLength += 4;
      let NoData = 0;                 ghLength += 4;      viewDataLength += 4;
      let DowJonesT = '1';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let DowJones = "Dow Jones";     ghLength += 32;     viewDataLength += 32;
      let NASDAQT = '1';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let NASDAQ = "NASDAQ";     ghLength += 32;     viewDataLength += 32;
      let SPT = '1';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let SP = "S&P";     ghLength += 32;     viewDataLength += 32;
      let FTSET = '6';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let FTSE = "UK FTSE";       ghLength += 32;     viewDataLength += 32;
      let GermanyDAXT = '6';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let GermanyDAX = "GermanyDAX";      ghLength += 32;     viewDataLength += 32;
      let HongKongT = '3';                ghLength += 1;      viewDataLength += 1; NoData += 1;
      let HongKong = "HongKong";      ghLength += 32;     viewDataLength += 32;
      let NikkeiT = '3';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Nikkei = "Nikkei 225";      ghLength += 32;     viewDataLength += 32;
      let KoreaT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Korea = "Korea";    ghLength += 32;     viewDataLength += 32;
      let SingaporeT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Singapore = "Singapore";    ghLength += 32;     viewDataLength += 32;
      let ShangHaiT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let ShangHai = "ShangHai";    ghLength += 32;     viewDataLength += 32;
      let MalaysiaT = '3';               ghLength += 1;      viewDataLength += 1; NoData += 1;
      let Malaysia = "Malaysia";    ghLength += 32;     viewDataLength += 32;

      let COM_BRCRT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let COM_BRCR = "Brent Crude";     ghLength += 32;     viewDataLength += 32;

      let COM_COPPERT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let COM_COPPER = "Copper";     ghLength += 32;     viewDataLength += 32;

      let COM_GOLDT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let COM_GOLD = "Gold Future";     ghLength += 32;     viewDataLength += 32;

      let COM_SILVERT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let COM_SILVER = "Silver";     ghLength += 32;     viewDataLength += 32;    

      let COM_WTICRUDT = '4';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let COM_WTICRUD = "WTI Crude";     ghLength += 32;     viewDataLength += 32;    

      let USDIDRT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let USDIDR = "USD-IDR";     ghLength += 32;     viewDataLength += 32;
      let USDJPYT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let USDJPY = "USD-JPY";     ghLength += 32;     viewDataLength += 32;
      let USDCHFT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let USDCHF = "USD-CHF";     ghLength += 32;     viewDataLength += 32;
      let EURUSDT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let EURUSD = "EUR-USD";     ghLength += 32;     viewDataLength += 32;
      let GBPUSDT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let GBPUSD = "GBP-USD";     ghLength += 32;     viewDataLength += 32;
      let AUDUSDT = '5';              ghLength += 1;      viewDataLength += 1; NoData += 1;
      let AUDUSD = "AUD-USD";     ghLength += 32;     viewDataLength += 32;

      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;

      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      bops.writeUInt32BE(buff, NoData, position);                                 position += 4;
      bops.copy( bops.from(DowJonesT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(DowJones, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(NASDAQT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(NASDAQ, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(SPT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(SP, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(FTSET, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(FTSE, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(GermanyDAXT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(GermanyDAX, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(HongKongT, 'utf8'), buff, position, 0, 1);    position += 1;
      bops.copy( bops.from(HongKong, 'utf8'), buff, position, 0, 32);    position += 32;
      bops.copy( bops.from(NikkeiT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(Nikkei, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(KoreaT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(Korea, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(MalaysiaT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(Malaysia, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(COM_BRCRT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(COM_BRCR, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(COM_COPPERT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(COM_COPPER, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(COM_GOLDT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(COM_GOLD, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(COM_SILVERT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(COM_SILVER, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(COM_WTICRUDT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(COM_WTICRUD, 'utf8'), buff, position, 0, 32);   position += 32;

      bops.copy( bops.from(SingaporeT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(Singapore, 'utf8'), buff, position, 0, 32);   position += 32;
      bops.copy( bops.from(ShangHaiT, 'utf8'), buff, position, 0, 1);   position += 1;
      bops.copy( bops.from(ShangHai, 'utf8'), buff, position, 0, 32);   position += 32;
      bops.copy( bops.from(USDIDRT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(USDIDR, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(USDJPYT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(USDJPY, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(USDCHFT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(USDCHF, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(EURUSDT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(EURUSD, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(GBPUSDT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(GBPUSD, 'utf8'), buff, position, 0, 32);  position += 32;
      bops.copy( bops.from(AUDUSDT, 'utf8'), buff, position, 0, 1);  position += 1;
      bops.copy( bops.from(AUDUSD, 'utf8'), buff, position, 0, 32);  position += 32;

      //Sending to websocket
      this.websocket.send(buff);

      tools.logSocket('requestViewHome');
      }
    }
    requestView51(_NoData,_Type,_Name){
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 51;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let noData = _NoData;                   ghLength += 4; viewDataLength += 4;
        let type = _Type;
        let name = _Name;
        for(let i=0;i<noData;i++)
        {
            ghLength += 1; viewDataLength += 1;
            ghLength += 32; viewDataLength += 32;
        }

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, noData, position);                                 position += 4;
        for(let i=0;i<noData;i++)
        {
            bops.writeInt8(buff, type[i], position);                                position += 1;
            bops.copy( bops.from(name[i], 'utf8'), buff, position, 0, 32); position += 32;

        }

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView51');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView51(dataview:any,position:number) {
      let NoData = dataview.getUint32(position); position += 4;
      let NoDataArray = new Array();
      for (let i = 0; i<NoData; i++)
      {
          let Name = tools.ab2str(dataview, position, 32); position += 32;
          let Value = dataview.getFloat64(position); position += 8;
          let ChangeValue = dataview.getFloat64(position); position += 8;
          let ChangePercent = dataview.getFloat64(position); position += 8;
          let Time = tools.ab2str(dataview, position, 16); position += 16;

          let NoDataArrayItem = {
              "Name":Name,
              "Value":Value,
              "ChangeValue":ChangeValue,
              "ChangePercent":ChangePercent,
              "Time":Time,
          };
          NoDataArray.push(NoDataArrayItem);
      }
      let view51 = {
          "NoData":NoData,
          "NoDataArray":NoDataArray,
      };
      messageCenter.runCallback("view51",view51);
    }
    requestView57(_BoardCode){
    //header
    let ghLength = 0;
    let ghMessageId = 0x06;     ghLength += 1;
    let ghMessageFlag = 0x20;   ghLength += 1;
    
    //view
    let viewId = 57;                        ghLength += 2;
    let viewMessageCode = 0x00;             ghLength += 1;
    let requestId = 0x00;                   ghLength += 2;
    let windowsId = 0;                      ghLength += 4;
    let viewDataLength = 0;                 ghLength += 4;
    //data
    let boardCode = _BoardCode;             ghLength += 4; viewDataLength += 4;
    
    //Init buff
    let buff = bops.create(ghLength+4);
    for(let i =0; i< buff.length;i++)
        buff[i] = 0x00;
    
    //Create packet
    let position = 0;
    bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
    bops.writeInt8(buff, ghMessageId, position);                                position += 1;
    bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
    
    bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
    bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
    bops.writeUInt16BE(buff, requestId, position);                              position += 2;
    bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
    bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
    
    bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;
    
    //Sending to websocket
    this.websocket.send(buff);
    }
    responseView57(dataview,position){
    let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
    let TotalFreq = dataview.getUint32(position); position += 4;
    let TotalVolume = tools.getInt64(dataview,position); position += 8;       
    let TotalLot = tools.getInt64(dataview,position); position += 8;       
    let TotalValue = tools.getInt64(dataview,position); position += 8;       
    let ForeignBuyFreq = dataview.getUint32(position); position += 4;
    let ForeignBuyVolume = tools.getInt64(dataview,position); position += 8; 
    let ForeignBuyLot = tools.getInt64(dataview,position); position += 8; 
    let ForeignBuyValue = tools.getInt64(dataview,position); position += 8; 
    let ForeignSellFreq = dataview.getUint32(position); position += 4;
    let ForeignSellVolume = tools.getInt64(dataview,position); position += 8; 
    let ForeignSellLot = tools.getInt64(dataview,position); position += 8; 
    let ForeignSellValue = tools.getInt64(dataview,position); position += 8; 
    let view57 = {
        "BoardCode":BoardCode,
        "TotalFreq":TotalFreq,
        "TotalVolume":TotalVolume,
        "TotalLot":TotalLot,
        "TotalValue":TotalValue,
        "ForeignBuyFreq":ForeignBuyFreq,
        "ForeignBuyVolume":ForeignBuyVolume,
        "ForeignBuyLot":ForeignBuyLot,
        "ForeignBuyValue":ForeignBuyValue,
        "ForeignSellFreq":ForeignSellFreq,
        "ForeignSellVolume":ForeignSellVolume,
        "ForeignSellLot":ForeignSellLot,
        "ForeignSellValue":ForeignSellValue,
    };
    messageCenter.runCallback("view57",view57);
    }
    requestView59(_ProductCode,_ChartInterval,_StartDate,_EndDate,_AdjustedData){

        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 59;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let productCode = _ProductCode;         ghLength += 24; viewDataLength += 24;
        let chartInterval = _ChartInterval;     ghLength += 1;  viewDataLength += 1;
        let startDate = _StartDate;             ghLength += 4;  viewDataLength += 4;
        let endDate = _EndDate;                 ghLength += 4;  viewDataLength += 4;
        let adjustedData = _AdjustedData;       ghLength += 1;  viewDataLength += 1;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
        bops.copy( bops.from(chartInterval, 'utf8'), buff, position, 0, 1); position += 1;
        bops.writeUInt32BE(buff, endDate, position);                                position += 4;
        bops.writeUInt32BE(buff, startDate, position);                              position += 4;
        bops.writeInt8(buff, adjustedData, position);                              position += 1;
        
        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView59(dataview,position){
    
        let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
        //var ChartInterval = ab2str(dataview, position, 1); position += 1;
        let ChartInterval =  String.fromCharCode(dataview.getUint8(position)); position += 1;
        let BeginDate = dataview.getUint32(position); position += 4;
        let EndDate = dataview.getUint32(position); position += 4;
        //var AdjustedData = ab2str(dataview, position, 1); position += 1;
        let AdjustedData = String.fromCharCode(dataview.getUint8(position)); position += 1;


        let NoDateTime = dataview.getUint32(position); position += 4;
        let NoDataArray = new Array();
        for (let i = 0; i<NoDateTime; i++)
        {
            let Date = dataview.getUint32(position); position += 4;
            let Time = dataview.getUint32(position); position += 4;
            let OpenPrice = dataview.getFloat64(position); position += 8;
            let HighPrice = dataview.getFloat64(position); position += 8;
            let LowPrice = dataview.getFloat64(position); position += 8;
            let ClosePrice = dataview.getFloat64(position); position += 8;
            let Volume = tools.getInt64(dataview,position); position += 8;       
            
            let ArrayItem = {
                "Date":Date,
                "Time":Time,
                "OpenPrice":OpenPrice,
                "HighPrice":HighPrice,
                "LowPrice":LowPrice,
                "ClosePrice":ClosePrice,
                "Volume":Volume,
            };
            NoDataArray.push(ArrayItem);
        }

        let view59 = {
            "ProductCode":ProductCode,
            "ChartInterval":ChartInterval,
            "BeginDate":BeginDate,
            "EndDate":EndDate,
            "AdjustedData":AdjustedData,
            "NoDataArray":NoDataArray,
        };
        messageCenter.runCallback("view59",view59);
    }
    requestView60(_IndicesCode,_ChartInterval,_StartDate,_EndDate){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 60;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let indicesCode = _IndicesCode;         ghLength += 12; viewDataLength += 12;
        let chartInterval = _ChartInterval;     ghLength += 1;  viewDataLength += 1;
        let startDate = _StartDate;             ghLength += 4;  viewDataLength += 4;
        let endDate = _EndDate;                 ghLength += 4;  viewDataLength += 4;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i=0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        
        bops.copy( bops.from(indicesCode, 'utf8'), buff, position, 0, 12);          position += 12;
        bops.copy( bops.from(chartInterval, 'utf8'), buff, position, 0, 1);         position += 1;
        bops.writeUInt32BE(buff, endDate, position);                                position += 4;
        bops.writeUInt32BE(buff, startDate, position);                              position += 4;
        
        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView60(dataview,position){
        
        let IndicesCode = tools.ab2str(dataview, position, 12); position += 12;
        let ChartInterval = tools.ab2str(dataview, position, 1); position += 1;
        let BeginDate = dataview.getUint32(position); position += 4;
        let EndDate = dataview.getUint32(position); position += 4;

        let NoDateTime = dataview.getUint32(position); position += 4;
        let NoDataArray = new Array();
        for (let i= 0; i<NoDateTime; i++)
        {
            let Date = dataview.getUint32(position); position += 4;
            let Time = dataview.getUint32(position); position += 4;
            let OpenIndices = dataview.getFloat64(position); position += 8;
            let HighIndices = dataview.getFloat64(position); position += 8;
            let LowIndices = dataview.getFloat64(position); position += 8;
            let CloseIndices = dataview.getFloat64(position); position += 8;
            let Volume = tools.getInt64(dataview,position); position += 8;       
            
            let ArrayItem = {
                "Date":Date,
                "Time":Time,
                "OpenIndices":OpenIndices,
                "HighIndices":HighIndices,
                "LowIndices":LowIndices,
                "CloseIndices":CloseIndices,
                "Volume":Volume,
            };
            NoDataArray.push(ArrayItem);
        }

        let view60 = {
            "IndicesCode":IndicesCode,
            "ChartInterval":ChartInterval,
            "BeginDate":BeginDate,
            "EndDate":EndDate,
            "NoDataArray":NoDataArray,
        };
        messageCenter.runCallback("view60",view60);
    }
    requestView61(_ProductCode,_BoardCode,_Date) {
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 61;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;

      //data
      let productCode = _ProductCode;         ghLength += 24;  viewDataLength += 24;
      let boardCode = _BoardCode;         ghLength += 4;  viewDataLength += 4;
      let date = _Date;         ghLength += 8;  viewDataLength += 8;
     
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  

      bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
      bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4); position += 4;
      bops.writeUInt32BE(buff, date, position);                              position += 8;

      //Sending to websocket
      this.websocket.send(buff);
    }
    responseView61(dataview,position){
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let Status = String.fromCharCode(dataview.getUint8(position)); position += 1;
      let Type = tools.ab2str(dataview, position, 12); position += 12;
      let Sector = tools.ab2str(dataview, position, 4); position += 4;

      let IPOPrice = dataview.getFloat64(position); position += 8;
      let BasePrice = dataview.getFloat64(position); position += 8;

      let ListedShares = tools.getInt64(dataview,position); position += 8;
      let TradableShares = tools.getInt64(dataview,position); position += 8;

      let LotSize = dataview.getUint32(position); position += 4;
      let FinancialDate = dataview.getUint32(position); position += 4;
      let FinancialYear = dataview.getUint32(position); position += 4;

      let Pengali = String.fromCharCode(dataview.getUint8(position)); position += 1;

      let GrossProfit = dataview.getFloat64(position); position += 8;
      let NetIncome = dataview.getFloat64(position); position += 8;
      let TotalAssets = dataview.getFloat64(position); position += 8;
      let TotalLiabilities = dataview.getFloat64(position); position += 8;
      let TotalEquity = dataview.getFloat64(position); position += 8;
      let TotalSales = dataview.getFloat64(position); position += 8;
      let OperatingProfit = dataview.getFloat64(position); position += 8;
      let CashFlowForOperating = dataview.getFloat64(position); position += 8;   
      let CashFlowForInvesting = dataview.getFloat64(position); position += 8;   
      let CashFlowForFinancing = dataview.getFloat64(position); position += 8; 
      let PreviousPrice = dataview.getFloat64(position); position += 8;   
      let LastPrice = dataview.getFloat64(position); position += 8;
      let OpenPrice = dataview.getFloat64(position); position += 8;
      let HighPrice = dataview.getFloat64(position); position += 8;    
      let LowPrice = dataview.getFloat64(position); position += 8;    
      let AvgPrice = dataview.getFloat64(position); position += 8; 

      let TotalFreq = dataview.getUint32(position); position += 4;

      let TotalLot = tools.getInt64(dataview,position); position += 8;  
      let LastTradeLot = tools.getInt64(dataview,position); position += 8;    
      let TotalValue = tools.getInt64(dataview,position); position += 8;

      let BestBidPrice = dataview.getFloat64(position); position += 8;    
      let BestOfferPrice = dataview.getFloat64(position); position += 8;  

      let BestBidLot = tools.getInt64(dataview,position); position += 8;   
      let BestOfferLot = tools.getInt64(dataview,position); position += 8;

      let ForeignBuyFreq = dataview.getUint32(position); position += 4;    

      let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;   
      let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;   

      let ForeignSellFreq = dataview.getUint32(position); position += 4; 

      let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
      let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
      let ForeignAvailable = tools.getInt64(dataview,position); position += 8; 

      let Remark = tools.ab2str(dataview, position, 8); position += 8;

      let BidHighPrice = dataview.getFloat64(position); position += 8;
      let BidLowPrice = dataview.getFloat64(position); position += 8;
      let BidOpenPrice = dataview.getFloat64(position); position += 8;
      let OfferHighPrice = dataview.getFloat64(position); position += 8;        
      let OfferLowPrice = dataview.getFloat64(position); position += 8;      
      let OfferOpenPrice = dataview.getFloat64(position); position += 8;        
      let OneyHighPrice = dataview.getFloat64(position); position += 8;       
      let OneyLowPrice = dataview.getFloat64(position); position += 8;       
      let OneWeekPrice = dataview.getFloat64(position); position += 8;        
      let OneMonthPrice = dataview.getFloat64(position); position += 8;        
      let OneQPrice = dataview.getFloat64(position); position += 8;    
      let OneHPrice = dataview.getFloat64(position); position += 8;        
      let OneYPrice = dataview.getFloat64(position); position += 8;       
      let LifeHighPrice = dataview.getFloat64(position); position += 8;
      let LifeLowPrice = dataview.getFloat64(position); position += 8;

      let TimeLastPrice = dataview.getUint32(position); position += 4;
      let TimeOpenPrice = dataview.getUint32(position); position += 4;
      let TimeLowPrice = dataview.getUint32(position); position += 4;
      let TimeHighPrice = dataview.getUint32(position); position += 4;
      let TimeBidHighPrice = dataview.getUint32(position); position += 4;
      let TimeBidLowPrice = dataview.getUint32(position); position += 4;
      let TimeBidOpenPrice = dataview.getUint32(position); position += 4;
      let TimeOfferHighPrice = dataview.getUint32(position); position += 4;
      let TimeOfferLowPrice = dataview.getUint32(position); position += 4;
      let TimeOfferOpenPrice = dataview.getUint32(position); position += 4;

      let TopRejectionPrice = dataview.getFloat64(position); position += 8;
      let BottomRejectionPrice = dataview.getFloat64(position); position += 8;        
      let OneWeekHighPrice = dataview.getFloat64(position); position += 8;   
      let OneWeekLowPrice = dataview.getFloat64(position); position += 8;      
      let OneMonthHighPrice = dataview.getFloat64(position); position += 8;        
      let OneMonthLowPrice = dataview.getFloat64(position); position += 8;      
      let OneQHighPrice = dataview.getFloat64(position); position += 8;    
      let OneQLowPrice = dataview.getFloat64(position); position += 8;      
      let OneHHighPrice = dataview.getFloat64(position); position += 8;        
      let OneHLowPrice = dataview.getFloat64(position); position += 8;      
      let LastYearClosePrice = dataview.getFloat64(position); position += 8;
      let LastYearHighPrice = dataview.getFloat64(position); position += 8;
      let LastYearLowPrice = dataview.getFloat64(position); position += 8;      
      let LastFinancialFlag = tools.ab2str(dataview, position, 1); position += 1;
      
      let view61 = {
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "Status":Status,
          "Type":Type,
          "IPOPrice":IPOPrice,
          "BasePrice":BasePrice,
          "ListedShares":ListedShares,
          "TradableShares":TradableShares,
          "LotSize":LotSize,
          "FinancialDate":FinancialDate,
          "FinancialYear":FinancialYear,
          "Pengali":Pengali,
          "GrossProfit":GrossProfit,
          "NetIncome":NetIncome,
          "TotalAssets":TotalAssets,
          "TotalLiabilities":TotalLiabilities,
          "TotalEquity":TotalEquity,
          "TotalSales":TotalSales,
          "OperatingProfit":OperatingProfit,
          "CashFlowForOperating":CashFlowForOperating,
          "CashFlowForInvesting":CashFlowForInvesting,
          "CashFlowForFinancing":CashFlowForFinancing,
          "PreviousPrice":PreviousPrice,
          "LastPrice":LastPrice,

          "OpenPrice":OpenPrice,
          "HighPrice":HighPrice,
          "LowPrice":LowPrice,
          "AvgPrice":AvgPrice,
          "TotalFreq":TotalFreq,
          "TotalLot":TotalLot,
          "LastTradeLot":LastTradeLot,
          "TotalValue":TotalValue,
          "BestBidPrice":BestBidPrice,
          "BestOfferPrice":BestOfferPrice,
          "BestBidLot":BestBidLot,
          "BestOfferLot":BestOfferLot,
          "ForeignBuyFreq":ForeignBuyFreq,
          "ForeignBuyLot":ForeignBuyLot,
          "ForeignBuyValue":ForeignBuyValue,
          "ForeignSellFreq":ForeignSellFreq,
          "ForeignSellLot":ForeignSellLot,
          "ForeignSellValue":ForeignSellValue,
          "ForeignAvailable":ForeignAvailable,
          "Remark":Remark,
          "BidHighPrice":BidHighPrice,
          "BidLowPrice":BidLowPrice,
          "BidOpenPrice":BidOpenPrice,
          "OfferHighPrice":OfferHighPrice,
          "OfferLowPrice":OfferLowPrice,
          "OfferOpenPrice":OfferOpenPrice,
          "OneyHighPrice":OneyHighPrice,
          "OneyLowPrice":OneyLowPrice,
          "OneWeekPrice":OneWeekPrice,
          "OneMonthPrice":OneMonthPrice,
          "OneQPrice":OneQPrice,
          "OneHPrice":OneHPrice,
          "OneYPrice":OneYPrice,
          "LifeHighPrice":LifeHighPrice,
          "LifeLowPrice":LifeLowPrice,
          "TimeLastPrice":TimeLastPrice,
          "TimeOpenPrice":TimeOpenPrice,
          "TimeLowPrice":TimeLowPrice,
          "TimeHighPrice":TimeHighPrice,
          "TimeBidHighPrice":TimeBidHighPrice,
          "TimeBidLowPrice":TimeBidLowPrice,
          "TimeBidOpenPrice":TimeBidOpenPrice,
          "TimeOfferHighPrice":TimeOfferHighPrice,
          "TimeOfferLowPrice":TimeOfferLowPrice,
          "TimeOfferOpenPrice":TimeOfferOpenPrice,
          "TopRejectionPrice":TopRejectionPrice,
          "BottomRejectionPrice":BottomRejectionPrice,
          "OneWeekHighPrice":OneWeekHighPrice,
          "OneWeekLowPrice":OneWeekLowPrice,
          "OneMonthHighPrice":OneMonthHighPrice,
          "OneMonthLowPrice":OneMonthLowPrice,
          "OneQHighPrice":OneQHighPrice,
          "OneQLowPrice":OneQLowPrice,
          "OneHHighPrice":OneHHighPrice,
          "OneHLowPrice":OneHLowPrice,
          "LastYearClosePrice":LastYearClosePrice,
          "LastYearHighPrice":LastYearHighPrice,
          "LastYearLowPrice":LastYearLowPrice,
          "LastFinancialFlag":LastFinancialFlag,
      };
      messageCenter.runCallback("view61",view61);
    }
    requestView66(_TopType, _PageNo,_RecordsPerPages){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 66;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let TopType = _TopType;                  ghLength += 1;  viewDataLength += 1;
        let pageNo = _PageNo;                   ghLength += 4;  viewDataLength += 4;
        let recordsPerPages = _RecordsPerPages; ghLength += 4;  viewDataLength += 4;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(TopType, 'utf8'), buff, position, 0, 1);               position += 1;
        bops.writeUInt32BE(buff, pageNo, position);                                 position += 4;
        bops.writeUInt32BE(buff, recordsPerPages, position);                        position += 4;
        
        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView66(dataview,position){       
        let TopType = tools.ab2str(dataview, position, 1); position += 1;
        let PageNo = dataview.getUint32(position); position += 4;
        let RecordsPerPages = dataview.getUint32(position); position += 4;
        let NoProduct = dataview.getUint32(position); position += 4;
        let NoProductArray = new Array();
        for (let i = 0; i<NoProduct; i++)
        {
            let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
            let LastPrice = dataview.getFloat64(position); position += 8;
            let PreviousPrice = dataview.getFloat64(position); position += 8;
            let OpenPrice = dataview.getFloat64(position); position += 8;
            let HighPrice = dataview.getFloat64(position); position += 8;
            let LowPrice = dataview.getFloat64(position); position += 8;
            let AveragePrice = dataview.getFloat64(position); position += 8;
            let TotalFreq = dataview.getUint32(position); position += 4;
            let TotalLot = tools.getInt64(dataview,position); position += 8;
            let TotalValue = tools.getInt64(dataview,position); position += 8;
            let ForeignBuyFreq = dataview.getUint32(position); position += 4;
            let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
            let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
            let ForeignSellFreq = dataview.getUint32(position); position += 4;
            let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
            let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
            let BestBidPrice = dataview.getFloat64(position); position += 8;
            let BestOfferPrice = dataview.getFloat64(position); position += 8;
            let BestBidLot = tools.getInt64(dataview,position); position += 8;
            let BestOfferLot = tools.getInt64(dataview,position); position += 8;
            
            let ProductArray = {
                "ProductCode":ProductCode,
                "LastPrice":LastPrice,
                "PreviousPrice":PreviousPrice,
                "OpenPrice":OpenPrice,
                "HighPrice":HighPrice,
                "LowPrice":LowPrice,
                "AveragePrice":AveragePrice,
                "TotalFreq":TotalFreq,
                "TotalLot":TotalLot,
                "TotalValue":TotalValue,
                "ForeignBuyFreq":ForeignBuyFreq,
                "ForeignBuyLot":ForeignBuyLot,
                "ForeignBuyValue":ForeignBuyValue,
                "ForeignSellFreq":ForeignSellFreq,
                "ForeignSellLot":ForeignSellLot,
                "ForeignSellValue":ForeignSellValue,
                "BestBidPrice":BestBidPrice,
                "BestOfferPrice":BestOfferPrice,
                "BestBidLot":BestBidLot,
                "BestOfferLot":BestOfferLot,
            };
            NoProductArray.push(ProductArray);
        }
        let view66 = {
            "TopType":TopType,
            "PageNo":PageNo,
            "RecordsPerPages":RecordsPerPages,
            "NoProduct":NoProduct,
            "NoProductArray":NoProductArray,
        };
        messageCenter.runCallback("view66",view66);
    }

    requestView74(){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 74;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data 
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
       
      
      //Sending to websocket
      this.websocket.send(buff);
      tools.logSocket('requestView74');
  }
  responseView74(dataview,position){        
      let NoSector = dataview.getUint32(position); position += 4;
      let NoSectorArray = new Array();
      for (let i = 0; i<NoSector; i++)
      {
          let SectorCode = tools.ab2str(dataview, position, 4); position += 4;
          let TotalFreq = dataview.getUint32(position); position += 4;
          let TotalVolume = tools.getInt64(dataview,position); position += 8;
          let TotalLot = tools.getInt64(dataview,position); position += 8;
          let TotalValue = tools.getInt64(dataview,position); position += 8; 
          let ForeignBuyFreq = dataview.getUint32(position); position += 4;
          let ForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
          let ForeignSellFreq = dataview.getUint32(position); position += 4;
          let ForeignSellVolume = tools.getInt64(dataview,position); position += 8;
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8; 
          
          let tempItem = {
              "SectorCode":SectorCode, 
              "TotalFreq":TotalFreq,
              "TotalVolume":TotalVolume,
              "TotalLot":TotalLot,
              "TotalValue":TotalValue,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyVolume":ForeignBuyVolume,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellVolume":ForeignSellVolume,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue, 
          };
          NoSectorArray.push(tempItem);
      }
      let view74 = { 
          "NoSector":NoSector,
          "NoSectorArray":NoSectorArray,
      };
      tools.logSocket('view74');
      tools.logSocket(view74);
      messageCenter.runCallback("view74",view74);
    }
    requestView84() {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 84;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView84');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView84(dataview:any,position:number) {
        let NoProduct = dataview.getUint32(position); position += 4;
        let NoProductArray = new Array();
        for (let i = 0; i<NoProduct; i++)
        {
            let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
            let ProductName = tools.ab2str(dataview, position, 50); position += 50;
            let ContractUnit = dataview.getUint32(position); position += 4;
            let Sector = tools.ab2str(dataview, position, 4); position += 4;

            let NoProductArrayItem = {
                "ProductCode":ProductCode,
                "ProductName":ProductName,
                "ContractUnit":ContractUnit,
                "Sector":Sector,
                "ProductFullName":ProductCode+" - "+ProductName,
            };
            NoProductArray.push(NoProductArrayItem);
        }
        let view84 = {
            "NoProduct":NoProduct,
            "NoProductArray":NoProductArray,
        };
        messageCenter.runCallback("view84",view84);
        messageCenter.runCallback("loginProgress","Product Data");
        this.global.setStockList(NoProductArray);
        this.global.gemeratedsStockList();
        // this.singledata.setValue(NoProductArray);
        tools.logSocket("responseView84");
        tools.logSocket(view84);
    }
    requestView85() {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 85;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView85');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView85(dataview:any,position:number) {
        let NoIndices = dataview.getUint32(position); position += 4;
        let NoIndicesArray = new Array();
        for (let i = 0; i<NoIndices; i++)
        {
            let IndicesCode = tools.ab2str(dataview, position, 12); position += 12;
            let IndicesName = tools.ab2str(dataview, position, 12); position += 12;

            let NoIndicesArrayItem = {
                "IndicesCode":IndicesCode,
                "IndicesName":IndicesName,
            };
            NoIndicesArray.push(NoIndicesArrayItem);
        }
        let view85 = {
            "NoIndices":NoIndices,
            "NoIndicesArray":NoIndicesArray,
        };
        messageCenter.runCallback("view85",view85);
        messageCenter.runCallback("loginProgress","Indices Data");
        tools.logSocket("responseView85");
        tools.logSocket(view85);
    }
    requestView86() {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1; 

        //view
        let viewId = 86;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView86');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView86(dataview:any,position:number) {
        let NoBroker = dataview.getUint32(position); position += 4;
        let NoBrokerArray = new Array();
        for (let i = 0; i<NoBroker; i++)
        {
            let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
            let BrokerName = tools.ab2str(dataview, position, 50); position += 50;
            let BrokerType = tools.ab2str(dataview, position, 1); position += 1;

            let NoBrokerArrayItem = {
                "BrokerCode":BrokerCode,
                "BrokerName":BrokerName,
                "BrokerType":BrokerType,        };
            NoBrokerArray.push(NoBrokerArrayItem); 
        }
        let view86 = {
            "NoBroker":NoBroker,
            "NoBrokerArray":NoBrokerArray,
        };
        
        this.global.setBrokerList(NoBrokerArray);
        messageCenter.runCallback("view86",view86);
        messageCenter.runCallback("loginProgress","Broker Data");

        tools.logSocket("responseView86");
        tools.logSocket(view86);
    }
    requestView90(_OrderNo){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 90;                        ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data 
      let orderNo = _OrderNo; ghLength += 8;  viewDataLength += 8;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      bops.writeUInt32BE(buff, orderNo, position+4);/*WARNING INT64*/               position += 8;
      
      //Sending to websocket
      this.websocket.send(buff);
  }
  responseView90(dataview,position){       

    let OrderNo = tools.getInt64(dataview,position); position += 8;
    let Status = tools.ab2str(dataview, position, 1); position += 1;
    let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
    let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
    let BuySell = tools.ab2str(dataview, position, 1); position += 1;
    let Price = dataview.getFloat64(position); position += 8;
    let OVolume = tools.getInt64(dataview,position); position += 8;
    let RVolume = tools.getInt64(dataview,position); position += 8;
    let TVolume = tools.getInt64(dataview,position); position += 8;
    let EstPriceQueueVolumes = tools.getInt64(dataview,position); position += 8;
    let EstPriceQueueOrders = dataview.getUint32(position); position += 4;
    let EstAllQueueVolumes = tools.getInt64(dataview,position); position += 8;
    let EstAllQueueOrders = dataview.getUint32(position); position += 4;
 
      let view90 = {
        "OrderNo":OrderNo,
        "Status":Status,
        "ProductCode":ProductCode,
        "BoardCode":BoardCode,
        "BuySell":BuySell,
        "Price":Price,
        "OVolume":OVolume,
        "RVolume":RVolume,
        "TVolume":TVolume,
        "EstPriceQueueVolumes":EstPriceQueueVolumes,
        "EstPriceQueueOrders":EstPriceQueueOrders,
        "EstAllQueueVolumes":EstAllQueueVolumes,
        "EstAllQueueOrders":EstAllQueueOrders,
      };
      messageCenter.runCallback("view90",view90);
  }

    requestView96(){
      if(this.isOpen){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 96;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data 
            
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        

        //Sending to websocket
        this.websocket.send(buff);
      }
    }
    responseView96(dataview,position){ 

        // let successFlag = String.fromCharCode(dataview.getUint8(position)); position += 1;
        // let successFlag = tools.ab2str(dataview, position, 1); position += 1;
        let successFlag = dataview.getUint8(position);

        let view96 = { 
            "SuccessFlag":successFlag,
        };
        messageCenter.runCallback("view96",view96);
    }
    requestView97(_AccountCode) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 97;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView97');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView97(dataview:any,position:number) {
      let AccountCode     = tools.ab2str(dataview, position, 8); position += 8;
      let BankName        = tools.ab2str(dataview, position, 30); position += 30;
      let BranchName      = tools.ab2str(dataview, position, 30); position += 30;
      let AccountNo       = tools.ab2str(dataview, position, 30); position += 30;
      let UnderName       = tools.ab2str(dataview, position, 50); position += 50;
      let RDI_BankName    = tools.ab2str(dataview, position, 30); position += 30;
      let RDI_BranchName  = tools.ab2str(dataview, position, 30); position += 30;
      let RDI_AccountNo   = tools.ab2str(dataview, position, 30); position += 30;
      let RDI_UnderName   = tools.ab2str(dataview, position, 50); position += 50;


      let view97 = {
          "AccountCode":AccountCode,
          "BankName":BankName,
          "BranchName":BranchName,
          "AccountNo":AccountNo,
          "UnderName":UnderName,
          "RDI_BankName":RDI_BankName,
          "RDI_BranchName":RDI_BranchName,
          "RDI_AccountNo":RDI_AccountNo,
          "RDI_UnderName":RDI_UnderName,
      };
      messageCenter.runCallback("view97",view97);
    }
    requestView108( _AccountCode, _Status, _DueDateBegin, _DueDateEnd){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 108;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let accountCode = _AccountCode;                       ghLength += 15;  viewDataLength += 15;
        let status = _Status;                                 ghLength += 1;   viewDataLength += 1;
        let dueDateBegin = _DueDateBegin.replace(/-/g , "");  ghLength += 4;  viewDataLength += 4;
        let dueDateEnd = _DueDateEnd.replace(/-/g , "");      ghLength += 4;  viewDataLength += 4;
            
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 15); position += 15;
        bops.copy( bops.from(status, 'utf8'), buff, position, 0, 1);     position += 1;
        bops.writeUInt32BE(buff, dueDateBegin, position);                     position += 4;
        bops.writeUInt32BE(buff, dueDateEnd, position);                     position += 4;
           
        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket("requestView108");
    }
    responseView108(dataview,position){
        let AccountCode = tools.ab2str(dataview, position, 15); position += 15;
        let Status = String.fromCharCode(dataview.getUint8(position)); position += 1;
        let DueDateBegin = dataview.getUint32(position); position += 4; //uint 32
        let DueDateEnd = dataview.getUint32(position); position += 4; //uint 32
        let NoWithdrawal = dataview.getUint32(position); position += 4;
        let NoWithdrawalArray = new Array();
        for (let i = 0; i<NoWithdrawal; i++)
        {
            let WithdrawalId = tools.getInt64(dataview,position); position += 8;
            let InputDate = dataview.getUint32(position); position += 4;
            let InputTime = dataview.getUint32(position); position += 4;
            let DueDate = dataview.getUint32(position); position += 4;
            let Refference = tools.ab2str(dataview, position, 32); position += 32;
            let Notes = tools.ab2str(dataview, position, 64); position += 64;
            let Status = tools.ab2str(dataview, position, 1); position += 1;
            let Amount = dataview.getFloat64(position); position += 8; //double        
            let BankName = tools.ab2str(dataview, position, 32); position += 32;
            let BankBranch = tools.ab2str(dataview, position, 32); position += 32;
            let BankAccountNo = tools.ab2str(dataview, position, 32); position += 32;
            let BankAccountName = tools.ab2str(dataview, position, 50); position += 50;
            let InputIpPublic = tools.ab2str(dataview, position, 16); position += 16;
            let InputIpLocal = tools.ab2str(dataview, position, 16); position += 16;
            let InputUserId = tools.ab2str(dataview, position, 20); position += 20;
            let UpdateIpPublic = tools.ab2str(dataview, position, 16); position += 16;
            let UpdateIpLocal = tools.ab2str(dataview, position, 16); position += 16;
            let UpdateUserId = tools.ab2str(dataview, position, 20); position += 20;
            let UpdateDate = dataview.getUint32(position); position += 4;
            let UpdateTime = dataview.getUint32(position); position += 4;
            let AccountCode = tools.ab2str(dataview, position, 15); position += 15;

            let NoWithdrawalArrayItem = {
                "WithdrawalId":WithdrawalId,
                "InputDate":InputDate,
                "InputTime":InputTime,  
                "DueDate":DueDate,
                "Refference":Refference, 
                "Notes":Notes,
                "Status":Status, 
                "Amount":Amount,
                "BankName":BankName, 
                "BankBranch":BankBranch,
                "BankAccountNo":BankAccountNo, 
                "BankAccountName":BankAccountName,
                "InputIpPublic":InputIpPublic, 
                "InputIpLocal":InputIpLocal,
                "InputUserId":InputUserId, 
                "UpdateIpPublic":UpdateIpPublic, 
                "UpdateIpLocal":UpdateIpLocal,
                "UpdateUserId":UpdateUserId, 
                "UpdateDate":UpdateDate, 
                "UpdateTime":UpdateTime, 
                "AccountCode":AccountCode, 
                };
            NoWithdrawalArray.push(NoWithdrawalArrayItem);
        }
        let view108 = {
            "AccountCode":AccountCode,
            "Status":Status,
            "DueDateBegin":DueDateBegin,
            "DueDateEnd":DueDateEnd,
            "NoWithdrawalArray":NoWithdrawalArray,
        };
        messageCenter.runCallback("view108",view108);
        tools.logSocket("View108");
        tools.logSocket(view108);
    }
    requestView109(_AccountCode, _DueDate, _Amount, _BankName, _BankBranch, _BankAccountNo, _BankAccountName){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 109;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let accountCode = _AccountCode;   ghLength += 15;  viewDataLength += 15;
        let dueDate = _DueDate.replace(/-/g , "");;   ghLength += 4;  viewDataLength += 4;
        let amount = _Amount;   ghLength += 8;  viewDataLength += 8;
        let bankName = _BankName;   ghLength += 32;  viewDataLength += 32;
        let bankBranch = _BankBranch;   ghLength += 32;  viewDataLength += 32;
        let bankAccountNo = _BankAccountNo;   ghLength += 32;  viewDataLength += 32;
        let bankAccountName = _BankAccountName;   ghLength += 50;  viewDataLength += 50;
            
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
       
        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 15); position += 15;
        bops.writeUInt32BE(buff, dueDate, position);                                position += 4;
        bops.writeDoubleBE(buff, amount, position);                                 position += 8;
        bops.copy( bops.from(bankName, 'utf8'), buff, position, 0, 32);    position += 32;
        bops.copy( bops.from(bankBranch, 'utf8'), buff, position, 0, 32);  position += 32;
        bops.copy( bops.from(bankAccountNo, 'utf8'), buff, position, 0, 32); position += 32;
        bops.copy( bops.from(bankAccountName, 'utf8'), buff, position, 0, 50); position += 50;

        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView109(dataview,position){
        let accountCode = String.fromCharCode(dataview.getUint8(position)); position += 15;
        let dueDate = dataview.getUint32(position); position += 4; //uint 32
        let amount = dataview.getFloat64(position); position += 8; //double
        let bankName = String.fromCharCode(dataview.getUint8(position)); position += 32;
        let bankBranch = String.fromCharCode(dataview.getUint8(position)); position += 32;
        let bankAccountNo = String.fromCharCode(dataview.getUint8(position)); position += 32;
        let bankAccountName = String.fromCharCode(dataview.getUint8(position)); position += 50;
        let successFlag = String.fromCharCode(dataview.getUint8(position)); position += 1;
        
        let view109 = {
            "AccountCode":accountCode,
            "DueDate":dueDate,
            "Amount":amount,
            "BankName":bankName,
            "BankBranch":bankBranch,
            "BankAccountNo":bankAccountNo,
            "BankAccountName":bankAccountName,
            "SuccessFlag":successFlag,
        };
        messageCenter.runCallback("view109",view109);
    }
    requestView110(_WithdrawalId){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 110;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let withdrawalId = _WithdrawalId;   ghLength += 8;  viewDataLength += 8;
            
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
       
        if(withdrawalId > 4294967295)
        {
            bops.writeUInt32BE(buff, withdrawalId - 4294967295, position);   position += 4;
            bops.writeUInt32BE(buff, 4294967295, position);                 position += 4;
        }
        else
        {
                bops.writeUInt32BE(buff, 0, position); position += 4;
                bops.writeUInt32BE(buff,withdrawalId, position); position += 4;
        }

        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView110(dataview,position){
        let WithdrawalId = tools.getInt64(dataview,position); position += 8;
        let Flasg =  String.fromCharCode(dataview.getUint8(position)); position += 1;
        
        let view110 = {
            "WithdrawalId":WithdrawalId,
            "Flasg":Flasg,
        };
        messageCenter.runCallback("view110",view110);
    }
    requestView113(_AccountCode){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 113;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let accountCode = _AccountCode;   ghLength += 15;  viewDataLength += 15;
            
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
       
        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 15); position += 15;

        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView113(dataview,position){
        let AccountCode = tools.ab2str(dataview, position, 15); position += 15;
        let BankName = tools.ab2str(dataview, position, 32); position += 32;
        let BankBranch = tools.ab2str(dataview, position, 32); position += 32;
        let BankAccountNo = tools.ab2str(dataview, position, 32); position += 32;
        let BankAccountName = tools.ab2str(dataview, position, 50); position += 50;
        
        let view113 = {
            "AccountCode":AccountCode,
            "BankName":BankName,
            "BankBranch":BankBranch,
            "BankAccountNo":BankAccountNo,
            "BankAccountName":BankAccountName,
        };
        messageCenter.runCallback("view113",view113);
    }
    requestView117( _AccountCode, _Date, _Tn){
        //header

        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 117;                 ghLength += 2;
        let viewMessageCode = 0x00;     ghLength += 1;
        let requestId = 0x00;           ghLength += 2;
        let windowsId = 0;              ghLength += 4;
        let viewDataLength = 0;         ghLength += 4;

        let accountCode = _AccountCode;   ghLength += 12;  viewDataLength += 12;
        let date = _Date;   ghLength += 4;  viewDataLength += 4;
        let tn = _Tn;   ghLength += 4;  viewDataLength += 4;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 12); position += 12;
        bops.writeUInt32BE(buff, date, position);                                position += 4;
        bops.writeUInt32BE(buff, tn, position);                                position += 4;
        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView117(dataview,position){
        let accountCode = String.fromCharCode(dataview.getUint8(position)); position += 12;
        let date = dataview.getUint32(position); position += 4; //uint 32
        let tn = dataview.getUint32(position); position += 4; //uint 32
        let tnDate = dataview.getUint32(position); position += 4; //uint 32
        let beginBalance = dataview.getFloat64(position); position += 8; //double
        
        let view117 = {
            "AccountCode":accountCode,
            "Date":date,
            "Tn":tn,
            "TnDate":tnDate,
            "BeginBalance":beginBalance,
        };
        messageCenter.runCallback("view117",view117);
    }
    requestView118(_ProductCode, _TotalDataRequest, _FinancialType){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 118;                 ghLength += 2;
      let viewMessageCode = 0x00;     ghLength += 1;
      let requestId = 0x00;           ghLength += 2;
      let windowsId = 0;              ghLength += 4;
      let viewDataLength = 0;         ghLength += 4;

      let productCode = _ProductCode; ghLength += 24; viewDataLength += 24;
      let totalDataRequest = _TotalDataRequest; ghLength += 4; viewDataLength += 4;
      let financialType = _FinancialType; ghLength += 1; viewDataLength += 1;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

      bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
      bops.writeUInt32BE(buff, totalDataRequest, position);                       position += 4;
      bops.copy( bops.from(financialType, 'utf8'), buff, position, 0, 1); position += 1;
      
      //Sending to websocket
      this.websocket.send(buff);
    }
    responseView118(dataview:any,position:number){   
    let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
    let TotalDataRequest = dataview.getUint32(position); position += 4;
    let FinancialType = dataview.getUint8(position); position += 1;
    let NoData = dataview.getUint32(position); position += 4;
    let data = new Array();
    for(var i=0;i<NoData;i++){

        let FinancialDate = dataview.getUint32(position); position += 4;
        let Currency = tools.ab2str(dataview, position, 3); position += 3;
        let FinancialYearEnd = tools.ab2str(dataview, position, 3); position += 3;
        let MonthCovered = dataview.getUint16(position); position+=2;
        let RateNotes = tools.ab2str(dataview, position, 32); position += 32;
        let Receivables = dataview.getFloat64(position); position += 8;
        let Inventories = dataview.getFloat64(position); position += 8;
        let CurrentAssets = dataview.getFloat64(position); position += 8;
        let FixedAssets = dataview.getFloat64(position); position += 8;
        let OtherAssets = dataview.getFloat64(position); position += 8;
        let TotalAssets = dataview.getFloat64(position); position += 8;
        let CurrentLiabilities = dataview.getFloat64(position); position += 8;
        let LongtermLiabilities = dataview.getFloat64(position); position += 8;
        let TotalLiabilities = dataview.getFloat64(position); position += 8;
        let Authorized = dataview.getFloat64(position); position += 8;
        let PaidupCapital = dataview.getFloat64(position); position += 8;
        let ParValue = tools.ab2str(dataview, position, 32); position += 32;
        let PaidupCapitalShares = dataview.getFloat64(position); position += 8;
        let RetainedEarnings = dataview.getFloat64(position); position += 8;
        let TotalEquity = dataview.getFloat64(position); position += 8;
        let MinorityInterest = dataview.getFloat64(position); position += 8;
        let TotalSales = dataview.getFloat64(position); position += 8;
        let CostofGoodSold = dataview.getFloat64(position); position += 8;
        let GrossProfit = dataview.getFloat64(position); position += 8;
        let OpeningProfit = dataview.getFloat64(position); position += 8;
        let OtherIncome = dataview.getFloat64(position); position += 8;
        let EarningBeforeTax = dataview.getFloat64(position); position += 8;
        let Tax = dataview.getFloat64(position); position += 8;
        let NetIncome = dataview.getFloat64(position); position += 8;
        let EPS = dataview.getFloat64(position); position += 8;
        let BV = dataview.getFloat64(position); position += 8;
        let DER = dataview.getFloat64(position); position += 8;
        let ROA = dataview.getFloat64(position); position += 8;
        let ROE = dataview.getFloat64(position); position += 8;
        let NPM = dataview.getFloat64(position); position += 8;
        let OPM = dataview.getFloat64(position); position += 8;
        let CashFlowFromOperatingActivities = dataview.getFloat64(position); position += 8;
        let CashFlowFromInvestingActivities = dataview.getFloat64(position); position += 8;
        let CashFlowFromFinancingActivities = dataview.getFloat64(position); position += 8;
        let NetIncreaseInCash = dataview.getFloat64(position); position += 8;
        let CashBegin = dataview.getFloat64(position); position += 8;
        let CashEnd = dataview.getFloat64(position); position += 8;

        let item = {
            'FinancialDate' : FinancialDate,
            'Currency' : Currency,
            'FinancialYearEnd' : FinancialYearEnd,
            ///*
            'MonthCovered' : MonthCovered,
            'RateNotes' : RateNotes,
            'Receivables' : Receivables,
            'Inventories' : Inventories,
            'CurrentAssets' : CurrentAssets,
            'FixedAssets' : FixedAssets,
            'OtherAssets' : OtherAssets,
            'TotalAssets' : TotalAssets,
            'CurrentLiabilities' : CurrentLiabilities,
            'LongtermLiabilities' : LongtermLiabilities,
            'TotalLiabilities' : TotalLiabilities,
            'Authorized' : Authorized,
            'PaidupCapital' : PaidupCapital,
            'ParValue' : ParValue,
            'PaidupCapitalShares' : PaidupCapitalShares,
            'RetainedEarnings' : RetainedEarnings,
            'TotalEquity' : TotalEquity,
            'MinorityInterest' : MinorityInterest,
            'TotalSales' : TotalSales,
            'CostofGoodSold' : CostofGoodSold,
            'GrossProfit' : GrossProfit,
            'OpeningProfit' : OpeningProfit,
            'OtherIncome' : OtherIncome,
            'EarningBeforeTax' : EarningBeforeTax,
            'Tax' : Tax,
            'NetIncome' : NetIncome,
            //*/
            'EPS' : EPS,
            'BV' : BV,
            'DER' : DER,
            'ROA' : ROA,
            'ROE' : ROE,
            'NPM' : NPM,
            'OPM' : OPM,
            'CashFlowFromOperatingActivities': CashFlowFromOperatingActivities,
            'CashFlowFromInvestingActivities': CashFlowFromInvestingActivities,
            'CashFlowFromFinancingActivities': CashFlowFromFinancingActivities,
            'NetIncreaseInCash': NetIncreaseInCash,
            'CashBegin': CashBegin,
            'CashEnd': CashEnd,
        }
        data.push(item);
    }
    
    let view118 = {
        "ProductCode": ProductCode,
        "TotalDataRequest": TotalDataRequest,
        "FinancialType": FinancialType,
        "NoData": NoData,
        "Data" : data
    };
    messageCenter.runCallback("view118",view118);
}
    requestView130(_ProductCode){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 130;                 ghLength += 2;
      let viewMessageCode = 0x00;     ghLength += 1;
      let requestId = 0x00;           ghLength += 2;
      let windowsId = 0;              ghLength += 4;
      let viewDataLength = 0;         ghLength += 4;

      let productCode = _ProductCode; ghLength += 24; viewDataLength += 24;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

      bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket('requestView130');
    }
    responseView130(dataview:any,position:number){
      let ProductCode = tools.ab2str(dataview, position, 24);                     position += 24;
      let Title = tools.ab2str(dataview, position, 150);                          position += 150;
      let AddressLength = dataview.getUint32(position);                           position += 4;
      let Address = tools.ab2str(dataview, position, AddressLength);              position += AddressLength;
      let BackgroundLength = dataview.getUint32(position);                        position += 4;
      let Background = tools.ab2str(dataview, position, BackgroundLength);        position += BackgroundLength;
      let ProductLength = dataview.getUint32(position);                           position += 4;
      let Product = tools.ab2str(dataview, position, ProductLength);              position += ProductLength;
      let SubsidiaryLength = dataview.getUint32(position);                        position += 4;
      let Subsidiary = tools.ab2str(dataview, position, SubsidiaryLength);        position += SubsidiaryLength;
      let CommisionersLength = dataview.getUint32(position);                      position += 4;
      let Commisioners = tools.ab2str(dataview, position, CommisionersLength);    position += CommisionersLength;
      let DirectorsLength = dataview.getUint32(position);                         position += 4;
      let Directors = tools.ab2str(dataview, position, DirectorsLength);          position += DirectorsLength;
      let UnderwriterLength = dataview.getUint32(position);                       position += 4;
      let Underwriter = tools.ab2str(dataview, position, UnderwriterLength);      position += UnderwriterLength;
      let ShareRegistarLength = dataview.getUint32(position);                     position += 4;
      let ShareRegistar = tools.ab2str(dataview, position, ShareRegistarLength);  position += ShareRegistarLength;
      let ShareHolderLength = dataview.getUint32(position);                       position += 4;
      let ShareHolder = tools.ab2str(dataview, position, ShareHolderLength);      position += ShareHolderLength;
      let HistoryStockLength = dataview.getUint32(position);                      position += 4;
      let HistoryStock = tools.ab2str(dataview, position, HistoryStockLength);    position += HistoryStockLength;
      let OtherInfoLength = dataview.getUint32(position);                         position += 4;
      let OtherInfo = tools.ab2str(dataview, position, OtherInfoLength);          position += OtherInfoLength;
      
      let view130 = {
          "ProductCode":ProductCode,
          "Title":Title,
          "Address":decodeURIComponent(Address),
          "Background":decodeURIComponent(Background),
          "Product":decodeURIComponent(Product),
          "Subsidiary":decodeURIComponent(Subsidiary),
          "Commisioners":decodeURIComponent(Commisioners),
          "Directors":decodeURIComponent(Directors),
          "Underwriter":decodeURIComponent(Underwriter),
          "ShareRegistar":decodeURIComponent(ShareRegistar),
          "ShareHolder":decodeURIComponent(ShareHolder),
          "HistoryStock":decodeURIComponent(HistoryStock),
          "OtherInfo":decodeURIComponent(OtherInfo),
      };
      messageCenter.runCallback("view130",view130);
    }
    requestView134(_accountCode,_Date){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 134;               ghLength += 2;
      let viewMessageCode = 0x00;     ghLength += 1;
      let requestId = 0x00;           ghLength += 2;
      let windowsId = 0;              ghLength += 4;
      let viewDataLength = 0;         ghLength += 4;

      let accountCode = _accountCode;       ghLength += 15; viewDataLength += 15;
      let _date = _Date.replace(/-/g , ""); ghLength += 4; viewDataLength += 4;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

      bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 15);          position += 15;
      bops.writeUInt32BE(buff, _date, position);                                  position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
      
      tools.logSocket('requestView134');
    }
    responseView134(dataview:any,position:number){
      let AccountCode = tools.ab2str(dataview, position, 15);                     position += 15; 
      let _Date = dataview.getUint32(position);                                    position += 4;
      let Name = tools.ab2str(dataview, position, 64);                            position += 64; 
      let Address = tools.ab2str(dataview, position, 64);                         position += 64; 
      let SubDistrict = tools.ab2str(dataview, position, 64);                     position += 24; 
      let City = tools.ab2str(dataview, position, 64);                            position += 24; 
      let SalesId = tools.ab2str(dataview, position, 64);                         position += 6; 
      let FeeBuy = dataview.getFloat64(position);                                 position += 8; 
      let FeeSell = dataview.getFloat64(position);                                 position += 8;
      let Email = tools.ab2str(dataview, position, 64);                           position += 64; 
      let RDI_Bank = tools.ab2str(dataview, position, 32);                        position += 32; 
      let RDI_Bank_Branch = tools.ab2str(dataview, position, 32);                 position += 32; 
      let RDI_Bank_Account = tools.ab2str(dataview, position, 32);                position += 32;  
      let SettlementDate = dataview.getUint32(position);                          position += 4;
      let NoTrade = dataview.getUint32(position);                                 position += 4;
      let TradeData = [];
      for(let i =0;i<NoTrade;i++){
        let ProductCode = tools.ab2str(dataview, position, 24);   position += 24;
        let B_or_S = tools.ab2str(dataview, position, 1);         position += 1; 
        let Price = dataview.getFloat64(position);                position += 8;
        let Volume = tools.getInt64(dataview,position);            position += 8;

        let TradeItem = {
          'No':i+1,
          'ProductCode' : ProductCode, 
          'ProductName' : this.global.getStockNameFromCode(ProductCode), 
          'BuyOrSell':B_or_S,
          'Price':Price,
          'Volume':Volume/100,
          'Share':Volume,
          'Value':Volume*Price,
        }
        TradeData.push(TradeItem); 
      }

      
      let view134 = {
        "AccountCode":AccountCode, 
        "Date":_Date, 
        "Name":Name, 
        "Address":Address, 
        "SubDistrict":SubDistrict, 
        "City":City, 
        "SalesId":SalesId, 
        "FeeBuy":FeeBuy, 
        "FeeSell":FeeSell, 
        "Email":Email, 
        "RDI_Bank":RDI_Bank, 
        "RDI_Bank_Branch":RDI_Bank_Branch, 
        "RDI_Bank_Account":RDI_Bank_Account, 
        "SettlementDate":SettlementDate, 
        "TradeData":TradeData,  
      };
      messageCenter.runCallback("view134",view134);
    }
    requestView201() {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 201;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView201');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView201(dataview:any,position:number) {

        let NoAnnouncement = dataview.getUint32(position); position += 4;
        let dataAnnouncement = [];
        for(let i =0;i<NoAnnouncement;i++){

            let NoAnnouncementId = tools.getInt64(dataview,position); position += 8;
            let dDate = dataview.getUint32(position); position += 4;
            let dTime = dataview.getUint32(position); position += 4;
            let Title = tools.ab2str(dataview, position, 255); position += 255;

            let news = {
                'NoAnnouncementId' : NoAnnouncementId,
                'Date' : dDate,
                'Time' : dTime,
                'Title' : Title
            }

            dataAnnouncement.push(news);

        }

        let view201 = {
            "NoAnnouncement": NoAnnouncement,
            "Data":dataAnnouncement,
        };
        messageCenter.runCallback("view201",view201);
    }
    requestView202(_announcementId) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 202;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;

        //data
        let announcementId = _announcementId;     ghLength += 8;  viewDataLength += 8;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, announcementId, position+4);                         position += 8;

        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView202(dataview:any,position:number) {
      let NoAnnouncementId = tools.getInt64(dataview,position); position += 8;
      let Length = dataview.getUint32(position); position += 4;
      let announcement = tools.ab2str(dataview, position, Length); position += Length;

      let view202 = {
          "NoAnnouncementId" : NoAnnouncementId,
          "announcement": announcement,
      };

      messageCenter.runCallback("view202",view202);
    }
    requestView203(_LastIDXNewsId,_RecordsRequest) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 203;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let lastIDXNewsId = _LastIDXNewsId;     ghLength += 8;  viewDataLength += 8;
        let recordsRequest = _RecordsRequest;   ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, lastIDXNewsId, position);/*WARNING INT64*/         position += 8;
        bops.writeUInt32BE(buff, recordsRequest, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView203');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView203(dataview:any,position:number) {
      let LastIDXNewsId = tools.getInt64(dataview,position); position += 8;
      let RecordRequest = dataview.getUint32(position); position += 4;
      let NoIDXNews = dataview.getUint32(position); position += 4;
      let dataNews = [];
      for(let i =0;i<NoIDXNews;i++){

          let IDXNewsId = tools.getInt64(dataview,position); position += 8;
          let dDate = dataview.getUint32(position); position += 4;
          let dTime = dataview.getUint32(position); position += 4;
          let Subject = tools.ab2str(dataview, position, 10); position += 10;
          let Title = tools.ab2str(dataview, position, 40); position += 40;

          let news = {
              'Id' : IDXNewsId,
              'Date' : dDate,
              'Time' : dTime,
              'Subject' : Subject,
              'Title' : Title
          }

          dataNews.push(news);

      }

      let view203 = {
          "LastIDXNewsId" : LastIDXNewsId,
          "RecordRequest" : RecordRequest,
          "NoIDXNews": NoIDXNews,
          "Data":dataNews,
      };
      messageCenter.runCallback("view203",view203);
    }
    requestView204(_IDXNewsId) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 204;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let IDXNewsId = _IDXNewsId;             ghLength += 8;  viewDataLength += 8;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, IDXNewsId, position+4);/*WARNING INT64*/             position += 8;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView204');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView204(dataview:any,position:number) {
      let IDXNewsId = tools.getInt64(dataview,position); position += 8;
      let IDXNews = tools.ab2str(dataview, position, 2000); position += 2000;

      let view204 = {
          "Id" : IDXNewsId,
          "News": IDXNews.trim().replace(/\/\//g, '<br/>')
      };
      // tools.logSocket('responseView204');
      // tools.logSocket(view204);
      messageCenter.runCallback("view204",view204);
    }
    requestView205(_LastNewsId, _RecordsRequest) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 205;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let lastNewsId = _LastNewsId;           ghLength += 8;  viewDataLength += 8;
        let recordsRequest = _RecordsRequest;   ghLength += 4;  viewDataLength += 4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, lastNewsId, position+4);/*WARNING INT64*/            position += 8;
        bops.writeUInt32BE(buff, recordsRequest, position);                         position += 4;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView205');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView205(dataview:any,position:number) {
      let LastNewsId = tools.getInt64(dataview,position); position += 8;
      let RecordRequest = dataview.getUint32(position); position += 4;
      let NoNews = dataview.getUint32(position); position += 4;
      let dataNews = [];
      for(let i =0;i<NoNews;i++){

          let NewsId = tools.getInt64(dataview,position); position += 8;
          let dDate = dataview.getUint32(position); position += 4;
          let dTime = dataview.getUint32(position); position += 4;
          let Source = tools.ab2str(dataview, position, 10); position += 10;
          let Title = tools.ab2str(dataview, position, 255); position += 255;

          let news = {
              'Id' : NewsId,
              'Date' : dDate,
              'Time' : dTime,
              'Source' : Source,
              'Title' : Title
          }

          dataNews.push(news);

      }

      let view205 = {
          "LastNewsId" : LastNewsId,
          "RecordRequest" : RecordRequest,
          "NoNews": NoNews,
          "Data":dataNews,
      };
      messageCenter.runCallback("view205",view205);
    }
    requestView207(_NewsId) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 207;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let NewsId = _NewsId;                   ghLength += 8;  viewDataLength += 8;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.writeUInt32BE(buff, NewsId, position+4);/*WARNING INT64*/                position += 8;

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView207');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView207(dataview:any,position:number) {
      let NewsId = tools.getInt64(dataview,position); position += 8;
      let Length = dataview.getUint32(position); position += 4;
      let News = tools.ab2str(dataview, position, Length); position += Length;

      let view207 = {
          "Id" : NewsId,
          "News": News,
      };

      messageCenter.runCallback("view207",view207);
    }
    requestView212(_EmailAddress,_Subject,_Email) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 212;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let EmailAddress = _EmailAddress;       ghLength += 64;              viewDataLength += 64;
        let Subject = _Subject;                 ghLength += 128;             viewDataLength += 128;
        let Email = _Email;                     ghLength += _Email.length+4; viewDataLength += _Email.length+4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.copy( bops.from(EmailAddress, 'utf8'), buff, position, 0, 64);         position += 64;
        bops.copy( bops.from(Subject, 'utf8'), buff, position, 0, 128);             position += 128;
        bops.writeUInt32BE(buff, Email.length, position);                           position += 4;
        bops.copy( bops.from(Email, 'utf8'), buff, position, 0, Email.length);      position += Email.length;
        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestView212['+EmailAddress+']['+Subject+']['+Email+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView212(dataview:any,position:number) {
        let SuccessFlag = String.fromCharCode(dataview.getUint8(position)); position += 1;
        let Subject = tools.ab2str(dataview, position, 128); position += 128;

        let view212 = {
            "SuccessFlag":SuccessFlag,
            "Subject":Subject,

        };
        tools.logSocket(view212);
        messageCenter.runCallback('view212', view212);
    }
    requestView217(_LastNewsId, _RecordsRequest){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 217;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let lastNewsId = _LastNewsId;           ghLength += 8;  viewDataLength += 8;
        let recordsRequest = _RecordsRequest;   ghLength += 4;  viewDataLength += 4;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.writeUInt32BE(buff, lastNewsId, position+4);/*WARNING INT64*/            position += 8;
        bops.writeUInt32BE(buff, recordsRequest, position);                         position += 4;
        
        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView217(dataview,position){
    let LastNewsId = tools.getInt64(dataview,position); position += 8;
    let RecordRequest = dataview.getUint32(position); position += 4;
    let NoNews = dataview.getUint32(position); position += 4;
    let dataNews = [];
    for(let i =0;i<NoNews;i++){

        let NewsId = tools.getInt64(dataview,position); position += 8;
        let dDate = dataview.getUint32(position); position += 4;
        let dTime = dataview.getUint32(position); position += 4;
        let Source = tools.ab2str(dataview, position, 10); position += 10;
        let Title = tools.ab2str(dataview, position, 255); position += 255;
        let Url = tools.ab2str(dataview, position, 128); position += 128;

        let news = {
            'NewsId' : NewsId,
            'Date' : dDate,
            'Time' : dTime,
            'Source' : Source,
            'Title' : Title,
            'Url' : Url
        }

        dataNews.push(news);

    }
    
    let view217 = {
        "LastNewsId" : LastNewsId,
        "RecordRequest" : RecordRequest,
        "NoNews": NoNews,
        "Data":dataNews,
    };
    messageCenter.runCallback('view217', view217);
    }
    requestView218(_Keyword,_Source,_StartDate,_EndDate,_LastNewsId,_RecordsRequest){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 218;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data
      let keyword = _Keyword;                 ghLength += 64;     viewDataLength += 64;
      let source = _Source;                   ghLength += 10;     viewDataLength += 10;
      let startDate = _StartDate;             ghLength += 4;      viewDataLength += 4;
      let endDate = _EndDate;                 ghLength += 4;      viewDataLength += 4;
      let lastNewsId = _LastNewsId;           ghLength += 8;      viewDataLength += 8;
      let recordsRequest = _RecordsRequest;   ghLength += 4;      viewDataLength += 4;
      
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      bops.copy( bops.from(keyword, 'utf8'), buff, position, 0, 64);     position += 64;
      bops.copy( bops.from(source, 'utf8'), buff, position, 0, 10);      position += 10;
      bops.writeUInt32BE(buff, startDate, position);                              position += 4;
      bops.writeUInt32BE(buff, endDate, position);                                position += 4;
      bops.writeUInt32BE(buff, lastNewsId, position+4);/*WARNING INT64*/            position += 8;
      bops.writeUInt32BE(buff, recordsRequest, position);                         position += 4;
      
      //Sending to websocket
      this.websocket.send(buff);
    }
    responseView218(dataview,position){
        let keyword = tools.ab2str(dataview, position, 64); position += 64;
        let source = tools.ab2str(dataview, position, 10); position += 10;
        let dateStart = dataview.getUint32(position); position += 4;
        let dateEnd = dataview.getUint32(position); position += 4;
        let LastNewsId = tools.getInt64(dataview,position); position += 8;
        let RecordRequest = dataview.getUint32(position); position += 4;
        let NoNews = dataview.getUint32(position); position += 4;
        let dataNews = [];
        for(let i =0;i<NoNews;i++){

            let NewsId = tools.getInt64(dataview,position); position += 8;
            let dDate = dataview.getUint32(position); position += 4;
            let dTime = dataview.getUint32(position); position += 4;
            let Source = tools.ab2str(dataview, position, 10); position += 10;
            let Title = tools.ab2str(dataview, position, 255); position += 255;
            let Url = tools.ab2str(dataview, position, 128); position += 128;

            let news = {
                'NewsId' : NewsId,
                'Date' : dDate,
                'Time' : dTime,
                'Source' : Source,
                'Title' : Title,
                'Url' : Url
            }

            dataNews.push(news);

        }
        
        let view218 = {
            "Keyword" : keyword,
            "Source" : source,
            "DateStart" : dateStart,
            "DateEnd" : dateEnd,
            "LastNewsId" : LastNewsId,
            "RecordRequest" : RecordRequest,
            "NoNews": NoNews,
            "Data":dataNews,
        };
        messageCenter.runCallback('view218', view218);
    }
    requestView219( _NewsId){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 219;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let NewsId = _NewsId;                   ghLength += 8;  viewDataLength += 8;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.writeUInt32BE(buff, NewsId, position+4);/*WARNING INT64*/                position += 8;
        
        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView219(dataview,position){
    let NewsId = tools.getInt64(dataview,position); position += 8;
    let Length = dataview.getUint32(position); position += 4;
    let News = tools.ab2str(dataview, position, Length); position += Length;
    let Url = tools.ab2str(dataview, position, 128); position += 128;
    
    let view219 = {
        "NewsId" : NewsId,
        "Length" : Length,
        "News": News,
        "Url": Url
    };
    messageCenter.runCallback("view219",view219);
}
    requestView227(_ParameterKey,_ParameterValue) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 227;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let ParameterKey = _ParameterKey;       ghLength += 20;                       viewDataLength += 20;
        let ParameterValue = _ParameterValue;   ghLength += _ParameterValue.length+4;   viewDataLength += _ParameterValue.length+4;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.copy( bops.from(ParameterKey, 'utf8'), buff, position, 0, 20);         position += 20;
        bops.writeUInt32BE(buff, ParameterValue.length, position);                  position += 4;
        bops.copy( bops.from(ParameterValue, 'utf8'), buff, position, 0, ParameterValue.length);         position += ParameterValue.length;
        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestView227['+ParameterKey+']['+ParameterValue+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView227(dataview:any,position:number) {
        let ParameterKey = tools.ab2str(dataview, position, 20); position += 20;
        let SuccessFlag = String.fromCharCode(dataview.getUint8(position)); position += 1;

        let view227 = {
            "ParameterKey":ParameterKey,
            "SuccessFlag":SuccessFlag,

        };
        // tools.logSocket(view227);
        messageCenter.runCallback('view227', view227);
    }
    requestView228(_ParameterKey) {
      if(this.isOpen) {
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;

        //view
        let viewId = 228;                        ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data
        let ParameterKey = _ParameterKey;       ghLength += 20; viewDataLength += 20;
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

        bops.copy( bops.from(ParameterKey, 'utf8'), buff, position, 0, 20);         position += 20;
        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestView228');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView228(dataview:any,position:number) {
        let ParameterKey = tools.ab2str(dataview, position, 20); position += 20;
        let ValueLength = dataview.getUint32(position); position += 4;
        let ParameterValue = "";
        if(ValueLength>0) ParameterValue = tools.ab2str(dataview, position, ValueLength); position += ValueLength;

        let view228 = {
            "ParameterKey":ParameterKey,
            "ValueLength":ValueLength,
            "ParameterValue":ParameterValue,
        };
        // tools.logSocket(view228); 
        messageCenter.runCallback('view228', view228);
    }
    requestView301(_UserId,_PIN_OLD,_PIN_NEW){
      if(this.isOpen) {
        if(this.isEnc){
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 301;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 500;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let UserId = _UserId==""?this.username:_UserId;                         ghLength += 20;  viewDataLength += 20;
          let PIN_OLD = _PIN_OLD;                         ghLength += 20;  viewDataLength += 20;
          let PIN_NEW = _PIN_NEW;                         ghLength += 20;  viewDataLength += 20;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(UserId, 'utf8'), buff, position, 0, 20);              position += 20;
          bops.copy( bops.from(PIN_OLD, 'utf8'), buff, position, 0, 20);                  position += 20;
          bops.copy( bops.from(PIN_NEW, 'utf8'), buff, position, 0, 20);                  position += 20;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);
          for(let i =0; i< bufftosend.length;i++)
              bufftosend[i] = 0x00;

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);
          tools.logSocket('requestView301_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20;               ghLength += 1;

          //view
          let viewId = 301;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 500;                    ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let UserId = _UserId==""?this.username:_UserId;                   ghLength += 20;  viewDataLength += 20;
          let PIN_OLD = _PIN_OLD;                 ghLength += 20;  viewDataLength += 20;
          let PIN_NEW = _PIN_NEW;                 ghLength += 20;  viewDataLength += 20;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(UserId, 'utf8'), buff, position, 0, 20);               position += 20;
          bops.copy( bops.from(PIN_OLD, 'utf8'), buff, position, 0, 20);              position += 20;
          bops.copy( bops.from(PIN_NEW, 'utf8'), buff, position, 0, 20);              position += 20;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView301');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView301(dataview:any,position:number) {
      let ResFlag =  String.fromCharCode(dataview.getUint8(position)); position += 1;

      let view301 = {
          ResultFlag:ResFlag
      };
      messageCenter.runCallback("view301",view301);
    }
    requestView311(_PIN_OLD,_PIN_NEW){
      if(this.isOpen) {
        if(this.isEnc){
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 311;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 500;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          //var UserId = _UserId==""?this.username:_UserId; ghLength += 20;  viewDataLength += 20;
          let PIN_OLD = _PIN_OLD;                         ghLength += 20;  viewDataLength += 20;
          let PIN_NEW = _PIN_NEW;                         ghLength += 20;  viewDataLength += 20;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          //bops.copy( bops.from(_UserId, 'utf8'), buff, position, 0, 20);              position += 20;
          bops.copy( bops.from(PIN_OLD, 'utf8'), buff, position, 0, 20);                  position += 20;
          bops.copy( bops.from(PIN_NEW, 'utf8'), buff, position, 0, 20);                  position += 20;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);
          for(let i =0; i< bufftosend.length;i++)
              bufftosend[i] = 0x00;

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);
          tools.logSocket('requestView301_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20;               ghLength += 1;

          //view
          let viewId = 311;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 500;                    ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          //var UserId = _UserId==""?this.username:_UserId;                   ghLength += 20;  viewDataLength += 20;
          let PIN_OLD = _PIN_OLD;                 ghLength += 20;  viewDataLength += 20;
          let PIN_NEW = _PIN_NEW;                 ghLength += 20;  viewDataLength += 20;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          //bops.copy( bops.from(UserId, 'utf8'), buff, position, 0, 20);               position += 20;
          bops.copy( bops.from(PIN_OLD, 'utf8'), buff, position, 0, 20);              position += 20;
          bops.copy( bops.from(PIN_NEW, 'utf8'), buff, position, 0, 20);              position += 20;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView311');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView311(dataview:any,position:number) {
      let ResFlag =  String.fromCharCode(dataview.getUint8(position)); position += 1;

      let view311 = {
          ResultFlag:ResFlag
      };
      messageCenter.runCallback("view311",view311);
    }
    requestView323(_PIN){
      if(this.isOpen) {
        if(this.isEnc){
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 323;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 500;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let PIN = _PIN;                         ghLength += 20;  viewDataLength += 20;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(PIN, 'utf8'), buff, position, 0, 20);                  position += 20;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);
          for(let i =0; i< bufftosend.length;i++)
              bufftosend[i] = 0x00;

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);
          tools.logSocket('requestView323_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 323;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let PIN = _PIN;                         ghLength += 20;  viewDataLength += 20;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(PIN, 'utf8'), buff, position, 0, 20);                  position += 20;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView323');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView323(dataview:any,position:number) {
      let ResFlag =  String.fromCharCode(dataview.getUint8(position)); position += 1;

      let view323 = {
          ResultFlag:ResFlag
      };
      console.log(view323);
      messageCenter.runCallback("view323",view323);
    }
    requestView408(_AccountCode){
      if(this.isOpen) {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 408;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView408_ENC');
        }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView408(dataview:any,position:number) {
      if(dataview.byteLength>12) {
        let AccountCode = tools.ab2str(dataview, position, 12); position += 12;
        let NoOrder = dataview.getUint32(position); position += 4;
        let NoOrderArray = new Array();
        for(let i=0;i<NoOrder;i++) {
          let Status = tools.ab2str(dataview, position, 1); position += 1;
          let Flag = tools.ab2str(dataview, position, 1); position += 1;
          let Notes = tools.ab2str(dataview, position, 96); position += 96;
          let Time = tools.ab2str(dataview, position, 9); position += 9;
          let ExchangeOrderNo = tools.getInt64(dataview,position); position += 8;
          let ExchangeTime = tools.ab2str(dataview, position, 9); position += 9;
          let Side = tools.ab2str(dataview, position, 1); position += 1;
          let ProductCode = tools.ab2str(dataview, position, 20); position += 20;
          let Price = dataview.getFloat64(position); position += 8;
          let LotOrder = tools.getInt64(dataview,position); position += 8;
          let SharesOrder = tools.getInt64(dataview,position); position += 8;
          let ContractUnit = dataview.getUint32(position); position += 4;
          let SASOrderNo = tools.ab2str(dataview, position, 32); position += 32;
          let NewSASOrderNo = tools.ab2str(dataview, position, 32); position += 32;
          let OldSASOrderNo = tools.ab2str(dataview, position, 32); position += 32;
          let AmountDone = dataview.getFloat64(position); position += 8;
          let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
          let TimeInForce = tools.ab2str(dataview, position, 1); position += 1;
          let SharesDone = tools.getInt64(dataview,position); position += 8;
          let Uid = tools.ab2str(dataview, position, 16); position += 16;
          
          let OrderItem = {
            Status:Status,
            Flag:Flag,
            Notes:Notes,
            Time:Time,
            ExchangeOrderNo:ExchangeOrderNo,
            ExchangeTime:ExchangeTime,
            Side:Side,
            ProductCode:ProductCode,
            Price:Price,
            LotOrder:LotOrder,
            SharesOrder:SharesOrder,
            ContractUnit:ContractUnit,
            SASOrderNo:SASOrderNo,
            NewSASOrderNo:NewSASOrderNo,
            OldSASOrderNo:OldSASOrderNo,
            AmountDone:AmountDone,
            BoardCode:BoardCode,
            TimeInForce:TimeInForce,
            SharesDone:SharesDone,
            Uid:Uid,
          };
          NoOrderArray.push(OrderItem);
        }

        let view408 = {
            AccountCode:AccountCode,
            NoOrder:NoOrder,
            NoOrderArray:NoOrderArray,
        };
        messageCenter.runCallback("view408",view408);
      }
    }
    requestView409(_AccountCode){
      if(this.isOpen) {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 409;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView409_ENC');
        }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView409(dataview:any,position:number) {
      if(dataview.byteLength>12) {
        let AccountCode = tools.ab2str(dataview, position, 12); position += 12;
        let NoTrade = dataview.getUint32(position); position += 4;
        let NoTradeArray = new Array();
        for(let i=0;i<NoTrade;i++) {
          let TradeTime = tools.ab2str(dataview, position, 9); position += 9;
          let TradeNo = tools.getInt64(dataview,position); position += 8;
          let OrderNo = tools.getInt64(dataview,position); position += 8;
          let Side = tools.ab2str(dataview, position, 1); position += 1;
          let ProductCode = tools.ab2str(dataview, position, 20); position += 20;
          let Price = dataview.getFloat64(position); position += 8;
          let SharesTrade = tools.getInt64(dataview,position); position += 8;
          let LotTrade = tools.getInt64(dataview,position); position += 8;
   
          let TradeItem = {
            TradeTime:TradeTime,
            TradeNo:TradeNo,
            OrderNo:OrderNo,
            Side:Side,
            ProductCode:ProductCode,
            Price:Price,
            SharesTrade:SharesTrade,
            LotTrade:LotTrade,
          };
          NoTradeArray.push(TradeItem);
        }

        let view409 = {
            AccountCode:AccountCode,
            NoTrade:NoTrade,
            NoTradeArray:NoTradeArray,
        };
        messageCenter.runCallback("view409",view409);
      }
    }
    requestView410(_AccountCode){
      if(this.isOpen) {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 410;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView410_ENC');
        }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView410(dataview:any,position:number) {
      if(dataview.byteLength>12) {
        let AccountCode = tools.ab2str(dataview, position, 12); position += 12;
        let NoStock = dataview.getUint32(position); position += 4;
        let NoStockArray = new Array();
        for(let i=0;i<NoStock;i++) {
          let ProductCode = tools.ab2str(dataview, position, 20); position += 20;
          let BeginBalance = tools.getInt64(dataview,position); position += 8;
          let Balance = tools.getInt64(dataview,position); position += 8;
          let NetBalance = tools.getInt64(dataview,position); position += 8;
          let AvgPrice = dataview.getFloat64(position); position += 8;
          let CurrentPrice = dataview.getFloat64(position); position += 8;

          let StockItem = {
            ProductCode:ProductCode,
            BeginBalance:BeginBalance,
            Balance:Balance,
            NetBalance:NetBalance,
            AvgPrice:AvgPrice,
            CurrentPrice:CurrentPrice,
          };
          NoStockArray.push(StockItem);
        }

        let view410 = {
            AccountCode:AccountCode,
            NoStock:NoStock,
            NoStockArray:NoStockArray,
        };
        messageCenter.runCallback("view410",view410);
      }
    }
    requestView411(_AccountCode){
      if(this.isOpen) {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 411;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 12;  viewDataLength += 12;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 12);           position += 12;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView411_ENC');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView411(dataview:any,position:number) {
      if(dataview.byteLength>12) {
        let AccountCode = tools.ab2str(dataview, position, 12); position += 12;
        let CustomerName = tools.ab2str(dataview, position, 64); position += 64;
        let CustomerCategory = tools.ab2str(dataview, position, 1); position += 1;
        let CreditLimit = dataview.getFloat64(position); position += 8;
        let TradingLimit = dataview.getFloat64(position); position += 8;
        let CashMargin = dataview.getFloat64(position); position += 8;
        let StockMargin = dataview.getFloat64(position); position += 8;
        let MarginRatio = dataview.getFloat64(position); position += 8;
        let CurrentRatio = dataview.getFloat64(position); position += 8;
        let CashBalance = dataview.getFloat64(position); position += 8;
        let TotalOpenOrderBuy = dataview.getFloat64(position); position += 8;
        let TotalOpenOrderSell = dataview.getFloat64(position); position += 8;
        let TotalTradeDoneBuy = dataview.getFloat64(position); position += 8;
        let TotalTradeDoneSell = dataview.getFloat64(position); position += 8;
        let CurrentTradingLimit = dataview.getFloat64(position); position += 8;
        let OverLimit = dataview.getFloat64(position); position += 8;

        let view411 = {
            AccountCode:AccountCode,
            CustomerName:CustomerName,
            CustomerCategory:CustomerCategory,
            CreditLimit:CreditLimit,
            TradingLimit:TradingLimit,
            CashMargin:CashMargin,
            StockMargin:StockMargin,
            MarginRatio:MarginRatio,
            CurrentRatio:CurrentRatio,
            CashBalance:CashBalance,
            TotalOpenOrderBuy:TotalOpenOrderBuy,
            TotalOpenOrderSell:TotalOpenOrderSell,
            TotalTradeDoneBuy:TotalTradeDoneBuy,
            TotalTradeDoneSell:TotalTradeDoneSell,
            CurrentTradingLimit:CurrentTradingLimit,
            OverLimit:OverLimit,

        };
        messageCenter.runCallback("view411",view411);
      }
    }
    requestView422(_AccountCode){
      if(this.isOpen) {
        if(this.isEncInfo){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 422;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView422_ENC');
        }
        else {


          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 422;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView422');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView422(dataview:any,position:number) {
      if(dataview.byteLength>12) {

        let AccountCode = tools.ab2str(dataview, position, 8); position += 8;
        let NoOrder = dataview.getUint32(position); position += 4;
        let NoOrderArray = new Array();
        for(let i=0;i<NoOrder;i++) {

          let OrderStatus =  dataview.getUint8(position); position += 1;
          let OrderId = tools.ab2str(dataview, position, 12); position += 12;
          let JsxId = tools.ab2str(dataview, position, 20); position += 20;
          let OrderDate = dataview.getUint32(position); position += 4;
          let OrderTime = dataview.getUint32(position); position += 4;
          let SendTime = dataview.getUint32(position); position += 4;
          let Exchange = tools.ab2str(dataview, position, 5); position += 5;
          let MarketCode = tools.ab2str(dataview, position, 5); position += 5;
          let Expiry =  dataview.getUint8(position); position += 1;
          let Command =  dataview.getUint8(position); position += 1;
          let StockCode = tools.ab2str(dataview, position, 30); position += 30;
          let Price = dataview.getUint32(position); position += 4;
          let OrderVolume = tools.getInt64(dataview,position); position += 8;
          let RemainVolume = tools.getInt64(dataview,position); position += 8;
          let TradedVolume = tools.getInt64(dataview,position); position += 8;
          let InputUser = tools.ab2str(dataview, position, 30); position += 30;
          let CounterPartyUid = tools.ab2str(dataview, position, 20); position += 20;
          let SourceId =  dataview.getUint8(position); position += 1;
          let ComplianceId = tools.ab2str(dataview, position, 20); position += 20;
          let ClientId = tools.ab2str(dataview, position, 20); position += 20;
          let AutoPriceFraction = dataview.getUint32(position); position += 4;

          let OrderItem = {
              OrderStatus:OrderStatus,
              OrderId:OrderId,
              JsxId:JsxId,
              OrderDate:OrderDate,
              OrderTime:OrderTime,
              SendTime:SendTime,
              Exchange:Exchange,
              MarketCode:MarketCode,
              Expiry:Expiry,
              Command:Command,
              StockCode:StockCode,
              Price:Price,
              PricePrice:MarketCode,
              OrderVolume:OrderVolume,
              RemainVolume:RemainVolume,
              TradedVolume:TradedVolume,
              InputUser:InputUser,
              CounterPartyUid:CounterPartyUid,
              SourceId:SourceId,
              ComplianceId:ComplianceId,
              ClientId:ClientId,
              AutoPriceFraction:AutoPriceFraction,
          };
          NoOrderArray.push(OrderItem);
        }

        let view422 = {
            AccountCode:AccountCode,
            NoOrder:NoOrder,
            NoOrderArray:NoOrderArray,
        };
        messageCenter.runCallback("view422",view422);
      }
    }
    requestView423(_AccountCode){
      if(this.isOpen) {
        if(this.isEncInfo){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 423;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView423_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 423;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView423');
        }

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView423(dataview:any,position:number) {
      if(dataview.byteLength>12) {

        let AccountCode = tools.ab2str(dataview, position, 8); position += 8;
        let NoTrades = dataview.getUint32(position); position += 4;
        let NoTradesArray = new Array();
        for(let i=0;i<NoTrades;i++) {
          let OrderId = tools.ab2str(dataview, position, 12); position += 12;
          let JsxId = tools.ab2str(dataview, position, 20); position += 20;
          let TradeId = tools.ab2str(dataview, position, 20); position += 20;
          let TradeDate = dataview.getUint32(position); position += 4;
          let TradeTime = dataview.getUint32(position); position += 4;
          let Exchange = tools.ab2str(dataview, position, 5); position += 5;
          let MarketCode = tools.ab2str(dataview, position, 5); position += 5;
          let Expiry =  dataview.getUint8(position); position += 1;
          let Command =  dataview.getUint8(position); position += 1;
          let StockCode = tools.ab2str(dataview, position, 30); position += 30;
          let Price = dataview.getUint32(position); position += 4;
          let Volume = tools.getInt64(dataview,position); position += 8;
          let CounterPartyBroker = tools.ab2str(dataview, position, 2); position += 2;
          let SourceId =  dataview.getUint8(position); position += 1;

          let TradesItem = {
              OrderId:OrderId,
              JsxId:JsxId,
              TradeId:TradeId,
              TradeDate:TradeDate,
              TradeTime:TradeTime,
              Exchange:Exchange,
              MarketCode:MarketCode,
              Expiry:Expiry,
              Command:Command,
              StockCode:StockCode,
              Price:Price,
              Volume:Volume,
              CounterPartyBroker:CounterPartyBroker,
              SourceId:SourceId,
          };
          NoTradesArray.push(TradesItem);
        }

        let view423 = {
            AccountCode:AccountCode,
            NoTrades:NoTrades,
            NoTradesArray:NoTradesArray,
        };
        messageCenter.runCallback("view423",view423);
      }
    }
    requestView424(_AccountCode,_FromDate,_ToDate) {
      if(this.isOpen) {
        if(this.isEncInfo){
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 424;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;
          let FromDate = _FromDate;               ghLength += 4;  viewDataLength += 4;
          let ToDate = _ToDate;                   ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;
          bops.writeUInt32BE(buff, FromDate, position);                               position += 4;
          bops.writeUInt32BE(buff, ToDate, position);                                 position += 4;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView424_ENC');
        }
        else {

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 424;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;
          let FromDate = _FromDate;               ghLength += 4;  viewDataLength += 4;
          let ToDate = _ToDate;                   ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;
          bops.writeUInt32BE(buff, FromDate, position);                               position += 4;
          bops.writeUInt32BE(buff, ToDate, position);                                 position += 4;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView424');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView424(dataview:any,position:number) {
      if(dataview.byteLength>12) {

        let AccountCode = tools.ab2str(dataview, position, 8); position += 8;
        let FromDate = dataview.getUint32(position); position += 4;
        let ToDate = dataview.getUint32(position); position += 4;
        let NoOrder = dataview.getUint32(position); position += 4;
        let NoOrderArray = new Array();
        for(let i=0;i<NoOrder;i++) {

          let OrderStatus =  dataview.getUint8(position); position += 1;
          let OrderId = tools.ab2str(dataview, position, 12); position += 12;
          let JsxId = tools.ab2str(dataview, position, 20); position += 20;
          let OrderDate = dataview.getUint32(position); position += 4;
          let OrderTime = dataview.getUint32(position); position += 4;
          let SendTime = dataview.getUint32(position); position += 4;
          let Exchange = tools.ab2str(dataview, position, 5); position += 5;
          let MarketCode = tools.ab2str(dataview, position, 5); position += 5;
          let Expiry =  dataview.getUint8(position); position += 1;
          let Command =  dataview.getUint8(position); position += 1;
          let StockCode = tools.ab2str(dataview, position, 30); position += 30;
          let Price = dataview.getUint32(position); position += 4;
          let OrderVolume = tools.getInt64(dataview,position); position += 8;
          let RemainVolume = tools.getInt64(dataview,position); position += 8;
          let TradedVolume = tools.getInt64(dataview,position); position += 8;
          let InputUser = tools.ab2str(dataview, position, 30); position += 30;
          let CounterPartyUid = tools.ab2str(dataview, position, 20); position += 20;
          let SourceId =  dataview.getUint8(position); position += 1;
          let ComplianceId = tools.ab2str(dataview, position, 20); position += 20;
          let ClientId = tools.ab2str(dataview, position, 20); position += 20;
          let AutoPriceFraction = dataview.getUint32(position); position += 4;

          let OrderItem = {
              OrderStatus:OrderStatus,
              OrderId:OrderId,
              JsxId:JsxId,
              OrderDate:OrderDate,
              OrderTime:OrderTime,
              SendTime:SendTime,
              Exchange:Exchange,
              MarketCode:MarketCode,
              Expiry:Expiry,
              Command:Command,
              StockCode:StockCode,
              Price:Price,
              PricePrice:MarketCode,
              OrderVolume:OrderVolume,
              RemainVolume:RemainVolume,
              TradedVolume:TradedVolume,
              InputUser:InputUser,
              CounterPartyUid:CounterPartyUid,
              SourceId:SourceId,
              ComplianceId:ComplianceId,
              ClientId:ClientId,
              AutoPriceFraction:AutoPriceFraction,
          };
          NoOrderArray.push(OrderItem);
        }

        let view424 = {
            AccountCode:AccountCode,
            FromDate:FromDate,
            ToDate:ToDate,
            NoOrder:NoOrder,
            NoOrderArray:NoOrderArray,
        };
        messageCenter.runCallback("view424",view424);
      }
    }
    requestView425(_AccountCode,_FromDate,_ToDate) {
      if(this.isOpen) {
        if(this.isEncInfo){
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20|0x10;   ghLength += 1;

          //view
          let viewId = 425;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;
          let FromDate = _FromDate;               ghLength += 4;  viewDataLength += 4;
          let ToDate = _ToDate;                   ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;
          bops.writeUInt32BE(buff, FromDate, position);                               position += 4;
          bops.writeUInt32BE(buff, ToDate, position);                                 position += 4;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView425_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 425;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;
          let FromDate = _FromDate;               ghLength += 4;  viewDataLength += 4;
          let ToDate = _ToDate;                   ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;
          bops.writeUInt32BE(buff, FromDate, position);                               position += 4;
          bops.writeUInt32BE(buff, ToDate, position);                                 position += 4;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView425');
        }

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView425(dataview:any,position:number) {
      if(dataview.byteLength>12) {

        let AccountCode = tools.ab2str(dataview, position, 8); position += 8;
        let FromDate = dataview.getUint32(position); position += 4;
        let ToDate = dataview.getUint32(position); position += 4;
        let NoTrades = dataview.getUint32(position); position += 4;
        let NoTradesArray = new Array();
        for(let i=0;i<NoTrades;i++) {
          let OrderId = tools.ab2str(dataview, position, 12); position += 12;
          let JsxId = tools.ab2str(dataview, position, 20); position += 20;
          let TradeId = tools.ab2str(dataview, position, 20); position += 20;
          let TradeDate = dataview.getUint32(position); position += 4;
          let TradeTime = dataview.getUint32(position); position += 4;
          let Exchange = tools.ab2str(dataview, position, 5); position += 5;
          let MarketCode = tools.ab2str(dataview, position, 5); position += 5;
          let Expiry =  dataview.getUint8(position); position += 1;
          let Command =  dataview.getUint8(position); position += 1;
          let StockCode = tools.ab2str(dataview, position, 30); position += 30;
          let Price = dataview.getUint32(position); position += 4;
          let Volume = tools.getInt64(dataview,position); position += 8;
          let CounterPartyBroker = tools.ab2str(dataview, position, 2); position += 2;
          let SourceId =  dataview.getUint8(position); position += 1;

          let TradesItem = {
              OrderId:OrderId,
              JsxId:JsxId,
              TradeId:TradeId,
              TradeDate:TradeDate,
              TradeTime:TradeTime,
              Exchange:Exchange,
              MarketCode:MarketCode,
              Expiry:Expiry,
              Command:Command,
              StockCode:StockCode,
              Price:Price,
              Volume:Volume,
              CounterPartyBroker:CounterPartyBroker,
              SourceId:SourceId,
          };
          NoTradesArray.push(TradesItem);
        }

        let view425 = {
            AccountCode:AccountCode,
            FromDate:FromDate,
            ToDate:ToDate,
            NoTrades:NoTrades,
            NoTradesArray:NoTradesArray,
        };
        messageCenter.runCallback("view425",view425);
      }
    }
    requestView426(_AccountCode){
      if(this.isOpen) {
        if(this.isEncInfo){
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;             ghLength += 1;
          let ghMessageFlag = 0x20|0x10;      ghLength += 1;

          //view
          let viewId = 426;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);
          for(let i =0; i< bufftosend.length;i++)
              bufftosend[i] = 0x00;

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          // tools.logSocket('requestView426_ENC');
          // tools.logSocket(tools.buf2hex(bufftosend));
          // tools.logSocket(tools.buf2hex(buff));

        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 426;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView426');
        }

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView426(dataview:any,position:number) {
      if(dataview.byteLength>110) {
      let AccountCode = tools.ab2str(dataview, position, 8); position += 8;
      let CustomerName = tools.ab2str(dataview, position, 100); position += 100;
      let AccountType =  dataview.getUint8(position); position += 1;
      let CurrentCash = tools.getInt64(dataview,position); position += 8;
      let CashT3 = tools.getInt64(dataview,position); position += 8;
      let UsedTradingLimit = tools.getInt64(dataview,position); position += 8;
      let TradingLimit = tools.getInt64(dataview,position); position += 8;
      let CurrentRatio = dataview.getInt32(position); position += 4;
      let LimitRatio = dataview.getInt32(position); position += 4;
      let NoStock = dataview.getUint32(position); position += 4;
      let NoStockArray = new Array();
      for(let i=0;i<NoStock;i++) {
        let StockCode = tools.ab2str(dataview, position, 30); position += 30;
        let AveragePrice = dataview.getUint32(position); position += 4;
        let LastPrice = dataview.getUint32(position); position += 4;
        let Volume = tools.getInt64(dataview,position); position += 8;
        let StockValue = tools.getInt64(dataview,position); position += 8;
        let GainLoss = tools.getInt64(dataview,position); position += 8;
        let GainLossPercent = dataview.getInt32(position); position += 4;
        let IsMarginable =  dataview.getUint8(position); position += 1;

        let StockItem = {
            StockCode:StockCode,
            AveragePrice:AveragePrice,
            LastPrice:LastPrice,
            Volume:Volume,
            StockValue:StockValue,
            GainLoss:GainLoss,
            GainLossPercent:GainLossPercent,
            IsMarginable:IsMarginable,
        };
        NoStockArray.push(StockItem);
      }
      let TotalStockValue = tools.getInt64(dataview,position); position += 8;
      let TotalGainLoss = tools.getInt64(dataview,position); position += 8;
      let DueAR = tools.getInt64(dataview,position); position += 8;
      let DueAP = tools.getInt64(dataview,position); position += 8;
      let DateT0 = dataview.getUint32(position); position += 4;
      let AR0 = tools.getInt64(dataview,position); position += 8;
      let AP0 = tools.getInt64(dataview,position); position += 8;
      let DateT1 = dataview.getUint32(position); position += 4;
      let AR1 = tools.getInt64(dataview,position); position += 8;
      let AP1 = tools.getInt64(dataview,position); position += 8;
      let DateT2 = dataview.getUint32(position); position += 4;
      let AR2 = tools.getInt64(dataview,position); position += 8;
      let AP2 = tools.getInt64(dataview,position); position += 8;
      let DateT3 = dataview.getUint32(position); position += 4;
      let AR3 = tools.getInt64(dataview,position); position += 8;
      let AP3 = tools.getInt64(dataview,position); position += 8;

      let view426 = {
          AccountCode:AccountCode,
          CustomerName:CustomerName,
          AccountType:AccountType,
          CurrentCash:CurrentCash,
          CashT3:CashT3,
          UsedTradingLimit:UsedTradingLimit,
          TradingLimit:TradingLimit,
          CurrentRatio:CurrentRatio,
          LimitRatio:LimitRatio,
          NoStock:NoStock,
          NoStockArray:NoStockArray,
          TotalStockValue:TotalStockValue,
          TotalGainLoss:TotalGainLoss,
          DueAR:DueAR,
          DueAP:DueAP,
          DateT0:DateT0,
          AR0:AR0,
          AP0:AP0,
          DateT1:DateT1,
          AR1:AR1,
          AP1:AP1,
          DateT2:DateT2,
          AR2:AR2,
          AP2:AP2,
          DateT3:DateT3,
          AR3:AR3,
          AP3:AP3,
      };
      messageCenter.runCallback("view426",view426);
      }
    }
    requestView427(_AccountCode,_StockCode,_Status,_BuyOrSell){
      if(this.isOpen) {
        if(this.isEncInfo){
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;             ghLength += 1;
          let ghMessageFlag = 0x20|0x10;      ghLength += 1;

          //view
          let viewId = 427;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;             ghLength += 30; viewDataLength += 30;
          let Status = _Status;                   ghLength += 1;  viewDataLength += 1;
          let BuyOrSell = _BuyOrSell;             ghLength += 1;  viewDataLength += 1;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(Status, 'utf8'), buff, position, 0, 1);                position += 1;
          bops.copy( bops.from(BuyOrSell, 'utf8'), buff, position, 0, 1);             position += 1;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);
          for(let i =0; i< bufftosend.length;i++)
              bufftosend[i] = 0x00;

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView427_ENC');
          // tools.logSocket(tools.buf2hex(bufftosend));
          // tools.logSocket(tools.buf2hex(buff));

        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 427;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountCode = _AccountCode;         ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;             ghLength += 30; viewDataLength += 30;
          let Status = _Status;                   ghLength += 1;  viewDataLength += 1;
          let BuyOrSell = _BuyOrSell;             ghLength += 1;  viewDataLength += 1;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountCode, 'utf8'), buff, position, 0, 8);           position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(Status, 'utf8'), buff, position, 0, 1);                position += 1;
          bops.copy( bops.from(BuyOrSell, 'utf8'), buff, position, 0, 1);             position += 1;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView427');
        }

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView427(dataview:any,position:number) {
      if(dataview.byteLength>110) {
      let AccountCode = tools.ab2str(dataview, position, 8); position += 8;
      let StockCode = tools.ab2str(dataview, position, 30); position += 30;
      let Status =  tools.ab2str(dataview, position, 1); position += 1;
      let BuyOrSell =  tools.ab2str(dataview, position, 1); position += 1;
      let NoOrder = dataview.getUint32(position); position += 4;
      let NoOrderArray = new Array();
      for(let i=0;i<NoOrder;i++) {
        let OrderId = tools.getInt64(dataview,position); position += 8;
        let StockCode = tools.ab2str(dataview, position, 30); position += 30;
        let Board =  dataview.getUint8(position); position += 1;
        let Command =  tools.ab2str(dataview, position, 1); position += 1;
        let IndicatorFlag =  tools.ab2str(dataview, position, 1); position += 1;
        let IndicatorPrice = dataview.getFloat64(position); position += 8;
        let OrderPrice = dataview.getFloat64(position); position += 8;
        let Volume = tools.getInt64(dataview,position); position += 8;
        let Status =  tools.ab2str(dataview, position, 1); position += 1;
        let ExpireDate = dataview.getUint32(position); position += 4;
        let InputTimeStamp = tools.ab2str(dataview, position, 20); position += 20;
        let InputUserId = tools.ab2str(dataview, position, 20); position += 20;
        let SendTimeStamp = tools.ab2str(dataview, position, 20); position += 20;
        let CancelTimeStamp = tools.ab2str(dataview, position, 20); position += 20;
        let CancelUserId = tools.ab2str(dataview, position, 20); position += 20;


        let OrderItem = {
            OrderId:OrderId,
            StockCode:StockCode,
            Board:Board,
            Command:Command,
            IndicatorFlag:IndicatorFlag,
            IndicatorPrice:IndicatorPrice,
            OrderPrice:OrderPrice,
            Volume:Volume,
            Status:Status,
            ExpireDate:ExpireDate,
            InputTimeStamp:InputTimeStamp,
            InputUserId:InputUserId,
            SendTimeStamp:SendTimeStamp,
            CancelTimeStamp:CancelTimeStamp,
            CancelUserId:CancelUserId,
        };
        NoOrderArray.push(OrderItem);
      }

      let view427 = {
          AccountCode:AccountCode,
          StockCode:StockCode,
          Status:Status,
          BuyOrSell:BuyOrSell,
          NoOrder:NoOrder,
          NoOrderArray:NoOrderArray,
      };
      messageCenter.runCallback("view427",view427);
      }
    }
    requestView431(_AccountCode,_DateStart,_DateEnd){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 431;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;

      //data
      let accountCode = _AccountCode;                             ghLength += 12;  viewDataLength += 12;
      let dateStart = _DateStart.replace(/-/g , "");              ghLength += 4;  viewDataLength += 4;
      let dateEnd = _DateEnd.replace(/-/g , "");                  ghLength += 4;  viewDataLength += 4;
    
   //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  
      bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 12);    position += 12;
      bops.writeUInt32BE(buff, dateStart, position);                              position += 4;
      bops.writeUInt32BE(buff, dateEnd, position);                                position += 4;
      //Sending to websocket
      this.websocket.send(buff);

      tools.logSocket('requestView431['+_AccountCode+']['+_DateStart+']['+_DateEnd+']');
    }
    responseView431(dataview,position){
      let AccountCode = tools.ab2str(dataview, position, 12); position += 12;
      let DateStart = dataview.getUint32(position); position += 4;
      let DateEnd = dataview.getUint32(position); position += 4;
      let NoOrders = dataview.getUint32(position); position += 4;
      let NoOrdersArray = new Array();
      for (var i = 0; i<NoOrders; i++)
      {
          let OrderId = tools.ab2str(dataview, position, 20); position += 20;
          let IdxOrderId = tools.ab2str(dataview, position, 15); position += 15;
          let Side = tools.ab2str(dataview, position, 1); position += 1;
          let Product = tools.ab2str(dataview, position, 12); position += 12;        
          let Price = dataview.getUint32(position); position += 4;
          let OrderVolume = dataview.getUint32(position); position += 4;
          let RemainVolume = dataview.getUint32(position); position += 4;
          let TradedVolume = dataview.getUint32(position); position += 4;
          let Board = tools.ab2str(dataview, position, 3); position += 3;
          let Tif = tools.ab2str(dataview, position, 3); position += 3;
          let OrderStatus = tools.ab2str(dataview, position, 1); position += 1; //unchar
          let OrderDate = dataview.getUint32(position); position += 4;
          let OrderTime = dataview.getUint32(position); position += 4;
          let SentDate = dataview.getUint32(position); position += 4;
          let SentTime = dataview.getUint32(position); position += 4;
          let RejectNote = tools.ab2str(dataview, position, 100); position += 100;
          let UserId = tools.ab2str(dataview, position, 20); position += 20;
          let LastTradeTime = dataview.getUint32(position); position += 4;
          let AvgTradePrice = dataview.getUint32(position); position += 4;
          let CounterPart = tools.ab2str(dataview, position, 12); position += 12;
          
          //var BrokerCode = ab2str(dataview, position, 4); position += 4; //String
          //var StartDate = dataview.getUint32(position); position += 4; //uint 32
          //var BuyLot = getUint64(dataview,position); position += 8; //int 64
          //var BuyAveragePrice = dataview.getFloat64(position); position += 8; //double
          //ab2str(dataview, position, 1); position += 1; //unchar
          //ab2str(dataview, position, 1); position += 1; //char
          
          let NoOrdersArrayItem = {
              "OrderId":OrderId,
              "IdxOrderId":IdxOrderId,  
              "Side":Side,
              "Product":Product, 
              "Price":Price,
              "OrderVolume":OrderVolume, 
              "RemainVolume":RemainVolume,
              "TradedVolume":TradedVolume, 
              "Board":Board,
              "Tif":Tif,
              "OrderStatus":OrderStatus,
              "OrderDate":OrderDate, 
              "OrderTime":OrderTime,
              "SentDate":SentDate, 
              "SentTime":SentTime,
              "RejectNote":RejectNote,
              "UserId":UserId,
              "LastTradeTime":LastTradeTime, 
              "AvgTradePrice":AvgTradePrice,
              "CounterPart":CounterPart,
              };
          NoOrdersArray.push(NoOrdersArrayItem);
      }
      let view431 = {
          "AccountCode":AccountCode,
          "DateStart":DateStart,
          "DateEnd":DateEnd,
          "NoOrdersArray":NoOrdersArray,
      };
      messageCenter.runCallback("view431",view431);
      messageCenter.runCallback("view431a",view431);

      tools.logSocket('ResponView431');
      tools.logSocket(view431);
    }
    requestView434(_AccountCode){
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 1434;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;

        //data
        let accountCode = _AccountCode;         ghLength += 12;  viewDataLength += 12;
       
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  
        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 12);    position += 12;
        //Sending to websocket
        this.websocket.send(buff);
        
        tools.logSocket('RequestView434['+ accountCode +']');
    }
    responseView434(dataview,position){
      let AccountCode = tools.ab2str(dataview, position, 12); position += 12;
      let Name = tools.ab2str(dataview, position, 64); position += 64;
      let ParameterArap = dataview.getFloat64(position); position += 8;
      let ParameterPortofolio = dataview.getFloat64(position); position += 8;
      let AccountType = tools.ab2str(dataview, position, 1); position += 1;
      let AllowShort = tools.ab2str(dataview, position, 1); position += 1;
      let AllowMargin = tools.ab2str(dataview, position, 1); position += 1;
      let FeeBuy = dataview.getFloat64(position); position += 8;
      let FeeSell = dataview.getFloat64(position); position += 8;
      let CreditLimit = dataview.getFloat64(position); position += 8;
      let TradingRatio = dataview.getFloat64(position); position += 8;
      let PrevCash = dataview.getFloat64(position); position += 8;
      let CurrentBalance = dataview.getFloat64(position); position += 8;
      let DateT0 = tools.ab2str(dataview, position, 12); position += 12;
      let ReceivableT0 = dataview.getFloat64(position); position += 8;
      let PayableT0 = dataview.getFloat64(position); position += 8;
      let DateT1 = tools.ab2str(dataview, position, 12); position += 12;
      let ReceivableT1 = dataview.getFloat64(position); position += 8;
      let PayableT1 = dataview.getFloat64(position); position += 8;
      let DateT2 = tools.ab2str(dataview, position, 12); position += 12;
      let ReceivableT2 = dataview.getFloat64(position); position += 8;
      let PayableT2 = dataview.getFloat64(position); position += 8;
      let DateT3 = tools.ab2str(dataview, position, 12); position += 12;
      let ReceivableT3 = dataview.getFloat64(position); position += 8;
      let PayableT3 = dataview.getFloat64(position); position += 8;
      let PendingBuyValue = dataview.getFloat64(position); position += 8;
      let PendingSellValue = dataview.getFloat64(position); position += 8;
      let ProfilId = tools.ab2str(dataview, position, 10); position += 10;
      let RdiBank = tools.ab2str(dataview, position, 32); position += 32;
      let Rdi = dataview.getFloat64(position); position += 8;
      let Sid = tools.ab2str(dataview, position, 18); position += 18;
      let RdiAccountBank = tools.ab2str(dataview, position, 32); position += 32;
      let WithdrawValue = dataview.getFloat64(position); position += 8;
      let DateTMinus1 = tools.ab2str(dataview, position, 12); position += 12;
      let ReceivableTMinus1 = dataview.getFloat64(position); position += 8;
      let PayableTMinus1 = dataview.getFloat64(position); position += 8;
      let DateTMinus2 = tools.ab2str(dataview, position, 12); position += 12;
      let ReceivableTMinus2 = dataview.getFloat64(position); position += 8;
      let PayableTMinus2 = dataview.getFloat64(position); position += 8;
      let DepositAdjustment = dataview.getFloat64(position); position += 8;
      let NoProduct = dataview.getUint32(position); position += 4;
      let NoProductArray = new Array();
      
      /*TAMBAHAN SUMIN BUAT ARAP*/
      /* TABLE ini kalo di ZP kebalik, istilahnya T3 -> T0, bukan T0 -> T3, tapi aku cocokin dari protokol remote aja biar liatnya gampang
      *                      Margin        OverDue          T0          T1          T2          T3
      *    Receive                                          ReceivableT0ReceivableT1ReceivableT2ReceivableT3 
      *    Pay                                              PayableT0    PayableT1    PayableT2    PayableT3
      *    Outstanding        OM            OO              OT0          OT1          OT2          OT3
      */
      
      /*  utk ditampilkan jangan pake _OT0, _OT1, _OT2, _OT3.
      *    pake yang OT0, OT1, OT2, OT3;
      */
      let OT0 =0, OT1 = 0, OT2 = 0, OT3 = 0;
      
       let _OT2 = PrevCash + ReceivableT0 +ReceivableT1 + ReceivableT2 - PayableT0 -PayableT1 - PayableT2;
       let _OT3 = _OT2 + ReceivableT3 - PayableT3 - WithdrawValue + DepositAdjustment;
      let _OT1 = _OT2 - ReceivableT2 + PayableT2;
      let _OT0 = _OT1 - ReceivableT1 + PayableT1;
      let OO = 0;
      let OM = 0;
      if(_OT0 < 0)
      {
        OO = _OT0 - ReceivableT0 + PayableT0;
        OM = OO - ReceivableTMinus1 + PayableTMinus1;
      }
     
      if(_OT3 < 0)  OT3 = _OT3;
      if(_OT2 < 0)  OT2 = _OT2;
      if(_OT1 < 0)   OT1 = _OT1;
       if(_OT0 < 0)   OT0 = _OT0;
        
      /*END OF TAMBAHAN SUMIN BUAT ARAP*/
      
      for (var i = 0; i<NoProduct; i++)
      {
          let Product = tools.ab2str(dataview, position, 12); position += 12;
          let OpenVolume = tools.getInt64(dataview,position); position += 8;
          let BalanceVolume = tools.getInt64(dataview,position); position += 8;
          let AvgPrice = dataview.getFloat64(position); position += 8;
          let LastPrice = dataview.getUint32(position); position += 4;
          let ValuationRatio = dataview.getFloat64(position); position += 8;
          
          //var BrokerCode = ab2str(dataview, position, 4); position += 4; //String
          //var StartDate = dataview.getUint32(position); position += 4; //uint 32
          //var BuyLot = getUint64(dataview,position); position += 8; //int 64
          //var BuyAveragePrice = dataview.getFloat64(position); position += 8; //double
          
          let NoProductArrayItem = {
              "Product":Product,
              "OpenVolume":OpenVolume,
              "BalanceVolume":BalanceVolume,  
              "AvgPrice":AvgPrice,  
              "LastPrice":LastPrice,  
              "ValuationRatio":ValuationRatio,  
              };
          NoProductArray.push(NoProductArrayItem);
      }
      let view434 = {
          "AccountCode":AccountCode,
          "Name":Name,
          "ParameterArap":ParameterArap,
          "ParameterPortofolio":ParameterPortofolio,
          "AccountType":AccountType,
          "AllowShort":AllowShort,
          "AllowMargin":AllowMargin,
          "FeeBuy":FeeBuy,
          "FeeSell":FeeSell,
          "CreditLimit":CreditLimit,
          "TradingRatio":TradingRatio,
          "PrevCash":PrevCash,
          "CurrentBalance":CurrentBalance,
          "DateT0":DateT0,
          "ReceivableT0":ReceivableT0,
          "PayableT0":PayableT0,
          "DateT1":DateT1,
          "ReceivableT1":ReceivableT1,
          "PayableT1":PayableT1,
          "DateT2":DateT2,
          "ReceivableT2":ReceivableT2,
          "PayableT2":PayableT2,
          "DateT3":DateT3,
          "ReceivableT3":ReceivableT3,
          "PayableT3":PayableT3,
          "PendingBuyValue":PendingBuyValue,
          "PendingSellValue":PendingSellValue,
          "ProfilId":ProfilId,
          "RdiBank":RdiBank,
          "Rdi":Rdi,
          "Sid":Sid,
          "RdiAccountBank":RdiAccountBank,
          "WithdrawValue":WithdrawValue,
          "DateTMinus1":DateTMinus1,
          "ReceivableTMinus1":ReceivableTMinus1,
          "PayableTMinus1":PayableTMinus1,
          "DateTMinus2":DateTMinus2,
          "ReceivableTMinus2":ReceivableTMinus2,
          "PayableTMinus2":PayableTMinus2,
          "DepositAdjustment":DepositAdjustment,
          "NoProductArray":NoProductArray,
          "OO":OO,
          "OM":OM,
          "OT0":OT0,
          "OT1":OT1,
          "OT2":OT2,
          "OT3":OT3,
      };
      messageCenter.runCallback("view434",view434)
      messageCenter.runCallback("view434a",view434)

      tools.logSocket('ResponView434 Terima');
      tools.logSocket(view434);
    }
    requestView438(){
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 438;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
      
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  

        //Sending to websocket
        this.websocket.send(buff);

        tools.logSocket('requestView438');
    }
    responseView438(dataview,position){
        let NoProfile = dataview.getUint32(position); position += 4;
        let NoProfileArray = new Array();
        for (let i = 0; i<NoProfile; i++)
        {
            let ProfileId = tools.ab2str(dataview, position, 10); position += 10;
            let NoProduct = dataview.getUint32(position); position += 4;   
            let NoProductArray = new Array();
            for (let j = 0; j<NoProduct; j++)
            {
                let Product = tools.ab2str(dataview, position, 12); position += 12;
                let ValuationRatio = dataview.getFloat64(position); position += 8;

                let NoProductArrayItem = {
                        "Product":Product,
                        "ValuationRatio":ValuationRatio,
                        };
                    NoProductArray.push(NoProductArrayItem);
            }

            let NoProfileArrayItem = {
                "ProfileId":ProfileId,
                "NoProfileArray":NoProductArray,
                };
            NoProfileArray.push(NoProfileArrayItem);
        }
        let view438 = {
          "NoProfile":NoProfile,
          "NoProfileArray":NoProfileArray,
        };
        
        tools.logSocket('View438');
        tools.logSocket(view438);
        
        messageCenter.runCallback("view438",view438);
        messageCenter.runCallback("loginProgress","Profile Data");
    }
    requestView442(_AccountCode,_StartDate,_endDate){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 442;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let accountCode = _AccountCode;                             ghLength += 15;   viewDataLength += 15;
        let startDate = _StartDate.replace(/-/g , "");              ghLength += 12;   viewDataLength += 12;
        let endDate = _endDate.replace(/-/g , "");                  ghLength += 1;    viewDataLength += 1;
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 12);          position += 12; 
        bops.writeUInt32BE(buff, startDate, position);                              position += 4;
        bops.writeUInt32BE(buff, endDate, position);                                position += 4;

        //Sending to websocket 
        this.websocket.send(buff);
        tools.logSocket("requestview442["+_AccountCode+"]["+_StartDate+"]["+_endDate+"]");   
    }
    responseView442(dataview,position){
        let Account = tools.ab2str(dataview, position, 12); position += 12;
        let StartDate = dataview.getUint32(position); position += 4;
        let EndDate = dataview.getUint32(position); position += 4; 
        let FeeBuy = dataview.getFloat64(position); position += 8;
        let FeeSell = dataview.getFloat64(position); position += 8;
        let NoRecord = dataview.getUint32(position); position += 4;
        let NoRecordArray = new Array();
        for (let i = 0; i<NoRecord; i++)
        {
          let _Date = dataview.getUint32(position); position += 4;  
          let Product = tools.ab2str(dataview, position, 12); position += 12;
                  
          let AvgBuyPrice = dataview.getFloat64(position); position += 8;
          let BuyVolume = tools.getInt64(dataview,position); position += 8;

          let AvgSellPrice = dataview.getFloat64(position); position += 8;
          let SellVolume = tools.getInt64(dataview,position); position += 8;

          
          let item = {
            "Date":_Date,
            "Product":Product,
            "AvgBuyPrice":AvgBuyPrice,  
            "BuyVolume":BuyVolume,  
            "AvgSellPrice":AvgSellPrice,  
            "SellVolume":SellVolume, 
            };
            NoRecordArray.push(item);
        }
        let view442 = {
            "Account":Account,
            "StartDate":StartDate,
            "EndDate":EndDate,
            "FeeBuy":FeeBuy,
            "FeeSell":FeeSell,
            "NoRecord":NoRecord,
            "NoRecordArray":NoRecordArray,
        };
        messageCenter.runCallback("view442",view442); 
        tools.logSocket("view442");   
        tools.logSocket(view442);   
    }

    requestView443(_OrderId){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 443;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data

      let orderId = _OrderId;                             ghLength += 20;   viewDataLength += 20;
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      bops.copy( bops.from(orderId, 'utf8'), buff, position, 0, 20);          position += 20;  

      //Sending to websocket 
      this.websocket.send(buff);
      tools.logSocket("requestview443["+orderId+"]");   
  }
  responseView443(dataview,position){
      let OrderId = tools.ab2str(dataview, position, 20); position += 20;
      let NoRecord = dataview.getUint32(position); position += 4;
      let NoRecordArray = new Array();
      for (let i = 0; i<NoRecord; i++)
      {
        
        let _Date = dataview.getUint32(position); position += 4;  
        let _Time = dataview.getUint32(position); position += 4;  
        let InputUser = tools.ab2str(dataview, position, 20); position += 20;
        let Status = tools.ab2str(dataview, position, 1); position += 1;
        let IdxOrderId = tools.ab2str(dataview, position, 15); position += 15;
        let Notes = tools.ab2str(dataview, position, 192); position += 192;
                   
        let item = {
          "No":i+1,
          "Date":_Date,
          "Time":_Time,
          "InputUser":InputUser,  
          "Status":Status,  
          "IdxOrderId":IdxOrderId,  
          "Notes":Notes, 
          };
          NoRecordArray.push(item);
      }
      let view443 = {
          "OrderId":OrderId, 
          "NoRecord":NoRecord,
          "NoRecordArray":NoRecordArray,
      };
      messageCenter.runCallback("view443",view443); 
      tools.logSocket("view443");   
      tools.logSocket(view443);   
  }
  requestView444(_OrderId){
    //header
    let ghLength = 0;
    let ghMessageId = 0x06;     ghLength += 1;
    let ghMessageFlag = 0x20;   ghLength += 1;
    
    //view
    let viewId = 444;                       ghLength += 2;
    let viewMessageCode = 0x00;             ghLength += 1;
    let requestId = 0x00;                   ghLength += 2;
    let windowsId = 0;                      ghLength += 4;
    let viewDataLength = 0;                 ghLength += 4;
    //data

    let orderId = _OrderId;                             ghLength += 20;   viewDataLength += 20;
    //Init buff
    let buff = bops.create(ghLength+4);
    for(let i =0; i< buff.length;i++)
        buff[i] = 0x00;
    
    //Create packet
    let position = 0;
    bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
    bops.writeInt8(buff, ghMessageId, position);                                position += 1;
    bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
    
    bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
    bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
    bops.writeUInt16BE(buff, requestId, position);                              position += 2;
    bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
    bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
    
    bops.copy( bops.from(orderId, 'utf8'), buff, position, 0, 20);          position += 20;  

    //Sending to websocket 
    this.websocket.send(buff);
    tools.logSocket("requestview444["+orderId+"]");   
}
responseView444(dataview,position){
    let OrderId = tools.ab2str(dataview, position, 20); position += 20;
    let NoRecord = dataview.getUint32(position); position += 4;
    let NoRecordArray = new Array();
    for (let i = 0; i<NoRecord; i++)
    {
      let Price = dataview.getFloat64(position); position += 8; 
      let Volume = dataview.getUint32(position); position += 4;   
                 
      let item = {
        "No":i+1,
        "Price":Price,
        "Volume":Volume, 
        };
        NoRecordArray.push(item);
    }
    let view444 = {
      
        "OrderId":OrderId, 
        "NoRecord":NoRecord,
        "NoRecordArray":NoRecordArray,
    };
    messageCenter.runCallback("view444",view444); 
    tools.logSocket("view444");   
    tools.logSocket(view444);   
  }
    requestView446(_AccountCode,_StartDate,_endDate){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 446;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let accountCode = _AccountCode;                             ghLength += 15;   viewDataLength += 15;
        let startDate = _StartDate.replace(/-/g , "");              ghLength += 12;   viewDataLength += 12;
        let endDate = _endDate.replace(/-/g , "");                  ghLength += 1;    viewDataLength += 1;
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 12);          position += 12; 
        bops.writeUInt32BE(buff, startDate, position);                              position += 4;
        bops.writeUInt32BE(buff, endDate, position);                                position += 4;

        //Sending to websocket 
        this.websocket.send(buff);
        tools.logSocket("requestview446["+_AccountCode+"]["+_StartDate+"]["+_endDate+"]");   
    }
    responseView446(dataview,position){
        let Account = tools.ab2str(dataview, position, 12); position += 12;
        let StartDate = dataview.getUint32(position); position += 4;
        let EndDate = dataview.getUint32(position); position += 4; 
        let BeginBalance = dataview.getFloat64(position); position += 8; 
        let NoRecord = dataview.getUint32(position); position += 4;
        let NoRecordArray = new Array();
        for (let i = 0; i<NoRecord; i++)
        {
          let _Date = dataview.getUint32(position); position += 4;  
          let Notes = tools.ab2str(dataview, position, 128); position += 128;
                  
          let Db = dataview.getFloat64(position); position += 8; 
          let Cr = dataview.getFloat64(position); position += 8; 

          
          let item = {
            "Date":_Date,
            "Notes":Notes,
            "Db":Db,  
            "Cr":Cr,   
            };
            NoRecordArray.push(item);
        }
        let view446 = {
            "Account":Account,
            "StartDate":StartDate,
            "EndDate":EndDate,
            "BeginBalance":BeginBalance, 
            "NoRecord":NoRecord,
            "NoRecordArray":NoRecordArray,
        };
        messageCenter.runCallback("view446",view446); 
        tools.logSocket("view446");   
        tools.logSocket(view446);   
    }
    requestView491(_AccountCode,_StockCode,_Status){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 491;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let accountCode = _AccountCode;                 ghLength += 15;  viewDataLength += 15;
        let stockCode = _StockCode;             ghLength += 12;  viewDataLength += 12;
        let status = _Status;                   ghLength += 1;  viewDataLength += 1;
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 15);      position += 15;
        bops.copy( bops.from(stockCode, 'utf8'), buff, position, 0, 12);        position += 12;
        //bops.writeInt8(buff, status, position);              /*char */              position += 1;
        bops.copy( bops.from(status, 'utf8'), buff, position, 0, 1);       position += 1;

        //Sending to websocket 
        this.websocket.send(buff);
    }
    responseView491(dataview,position){
        let Account = tools.ab2str(dataview, position, 15); position += 15;
        let StockCode = tools.ab2str(dataview, position, 12); position += 12;
        let Status = String.fromCharCode(dataview.getUint8(position)); position += 1; //char
        let NoOrders = dataview.getUint32(position); position += 4;
        let NoOrdersArray = new Array();
        for (let i = 0; i<NoOrders; i++)
        {
            let OrderId = tools.getInt64(dataview,position); position += 8;
            let StockCode = tools.ab2str(dataview, position, 12); position += 12;
            let Board = String.fromCharCode(dataview.getUint8(position)); position += 1;
            let BuyIndicatorFlag = String.fromCharCode(dataview.getUint8(position)); position += 1;       
            let BuyIndicatorPrice = dataview.getFloat64(position); position += 8;
            let BuyOrderPrice = dataview.getFloat64(position); position += 8;
            let OrderVolume = tools.getInt64(dataview,position); position += 8;
            let RemainVolume = tools.getInt64(dataview,position); position += 8;
            let TradedVolume = tools.getInt64(dataview,position); position += 8;
            let Status = String.fromCharCode(dataview.getUint8(position)); position += 1;
            let ExpireDate = dataview.getUint32(position); position += 4;
            let StopLossIndicatorLoss = dataview.getFloat64(position); position += 8;
            let StopLossOrderPrice = dataview.getFloat64(position); position += 8;
            let TakeProfitIndicatorPrice = dataview.getFloat64(position); position += 8;
            let TakeProfitOrderPrice = dataview.getFloat64(position); position += 8;
            let BuySystemOrderId = tools.ab2str(dataview, position, 20); position += 20;
            let SlSystemOrderId = tools.ab2str(dataview, position, 20); position += 20;
            let BuySentTimeStamp = tools.ab2str(dataview, position, 20); position += 20;
            let SlTimeStamp = tools.ab2str(dataview, position, 20); position += 20;
            let BuyRejectNote = tools.ab2str(dataview, position, 100); position += 100;
            let SlRejectNote = tools.ab2str(dataview, position, 100); position += 100;
            let InputTimeStamp = tools.ab2str(dataview, position, 20); position += 20;
            let InputUserId = tools.ab2str(dataview, position, 20); position += 20;
            let CancelTimeStamp = tools.ab2str(dataview, position, 20); position += 20;
            let CancelUserId = tools.ab2str(dataview, position, 20); position += 20;
            let IndicatorType = String.fromCharCode(dataview.getUint8(position)); position += 1;

            //var BrokerCode = ab2str(dataview, position, 4); position += 4; //String
            //var StartDate = dataview.getUint32(position); position += 4; //uint 32
            //var BuyLot = getUint64(dataview,position); position += 8; //int 64
            //var BuyAveragePrice = dataview.getFloat64(position); position += 8; //double
            
            let NoOrdersArrayItem = {
                "OrderId":OrderId,
                "StockCode":StockCode,
                "Board":Board,  
                "BuyIndicatorFlag":BuyIndicatorFlag,  
                "BuyIndicatorPrice":BuyIndicatorPrice,  
                "BuyOrderPrice":BuyOrderPrice,
                "OrderVolume":OrderVolume, 
                "RemainVolume":RemainVolume,
                "TradedVolume":TradedVolume,
                "Status":Status,
                "ExpireDate":ExpireDate,
                "StopLossIndicatorLoss":StopLossIndicatorLoss,
                "StopLossOrderPrice":StopLossOrderPrice,
                "TakeProfitIndicatorPrice":TakeProfitIndicatorPrice,
                "TakeProfitOrderPrice":TakeProfitOrderPrice,
                "BuySystemOrderId":BuySystemOrderId,
                "SlSystemOrderId":SlSystemOrderId,
                "BuySentTimeStamp":BuySentTimeStamp,
                "SlTimeStamp":SlTimeStamp,
                "BuyRejectNote":BuyRejectNote,
                "SlRejectNote":SlRejectNote,
                "InputTimeStamp":InputTimeStamp,
                "InputUserId":InputUserId,
                "CancelTimeStamp":CancelTimeStamp,
                "CancelUserId":CancelUserId,
                "IndicatorType":IndicatorType,
                };
            NoOrdersArray.push(NoOrdersArrayItem);
        }
        let view491 = {
            "Account":Account,
            "StockCode":StockCode,
            "Status":Status,
            "NoOrdersArray":NoOrdersArray,
        };
        messageCenter.runCallback("view491",view491);    
    }
    requestView494(_Account,_Product){
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 494;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
      
        
        let account = _Account;                 ghLength += 15;  viewDataLength += 15;
        let product = _Product;                 ghLength += 24;  viewDataLength += 24;
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  

        bops.copy( bops.from(account, 'utf8'), buff, position, 0, 15);     position += 15;
        bops.copy( bops.from(product, 'utf8'), buff, position, 0, 24);     position += 24;

        //Sending to websocket
        this.websocket.send(buff);
    }
    responseView494(dataview,position){
      let Account = tools.ab2str(dataview, position, 15); position += 15;
      let ProductCodeToBuy = tools.ab2str(dataview, position, 24); position += 24;        
      let LimitAvailable = dataview.getFloat64(position); position += 8;
      let LimitByRatio = dataview.getFloat64(position); position += 8;
      let FeeBuy = dataview.getFloat64(position); position += 8;
      let StockValuationRatio = dataview.getFloat64(position); position += 8;
      let CashAndPendingBuyIncFee = dataview.getFloat64(position); position += 8;
      let PortoValuatedAndPendingBuyValuated = dataview.getFloat64(position); position += 8;

      let view494 = {
          "Account":Account,
          "ProductCodeToBuy":ProductCodeToBuy,
          "LimitAvailable":LimitAvailable,
          "LimitByRatio":LimitByRatio ,
          "FeeBuy":FeeBuy ,
          "StockValuationRatio":StockValuationRatio ,
          "CashAndPendingBuyIncFee":CashAndPendingBuyIncFee ,
          "PortoValuatedAndPendingBuyValuated":PortoValuatedAndPendingBuyValuated ,
      };
      
      messageCenter.runCallback("view494",view494);
      messageCenter.runCallback("view494a",view494);
      tools.logSocket("View494");
      tools.logSocket(view494);
    }

    requestView505(_UserId,_Title){
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 505;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
    
      
      let userId = _UserId;                   ghLength += 20;  viewDataLength += 20;
      let title = _Title;                     ghLength += 20;  viewDataLength += 20;
      let device = "7";                       ghLength += 1;  viewDataLength += 1;
      if(this.deviceType=="ANDROID") device = "4";
      else if(this.deviceType=="IOS") device = "5";
      else if(this.deviceType=="WEB") device = "7";
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  

      bops.copy( bops.from(userId, 'utf8'), buff, position, 0, 20);     position += 20;
      bops.copy( bops.from(title, 'utf8'), buff, position, 0, 20);     position += 20;
      bops.copy( bops.from(device, 'utf8'), buff, position, 0, 1);     position += 1;

      //Sending to websocket
      this.websocket.send(buff);
    }
    responseView505(dataview,position){
      let UserId = tools.ab2str(dataview, position, 20); position += 20;
      let AgreementTitle = tools.ab2str(dataview, position, 20); position += 20; 
      let AgreementDevice = tools.ab2str(dataview, position, 1); position += 1;   
      let ResultFlag = tools.ab2str(dataview, position, 1); position += 1;         
      let view505 = {
          "UserId":UserId,
          "AgreementTitle":AgreementTitle,
          "AgreementDevice":AgreementDevice,
          "ResultFlag":ResultFlag , 
      }; 
      messageCenter.runCallback("view505",view505);
    }

    requestView506(_UserId,_Title,_Device,_StartDate,_EndDate){ 
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 506;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
    
      
      let userId = _UserId;                   ghLength += 20;  viewDataLength += 20;
      let title = _Title;                     ghLength += 20;  viewDataLength += 20;
      let device = "7";                       ghLength += 1;  viewDataLength += 1;
      let startDate = _StartDate;             ghLength += 4;  viewDataLength += 4;
      let endDate = _EndDate;                 ghLength += 4;  viewDataLength += 4;
      if(this.deviceType=="ANDROID") device = "4";
      else if(this.deviceType=="IOS") device = "5";
      else if(this.deviceType=="WEB") device = "7";

      if(_Device=="0") device = "";

      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  

      bops.copy( bops.from(userId, 'utf8'), buff, position, 0, 20);               position += 20;
      bops.copy( bops.from(title, 'utf8'), buff, position, 0, 20);                position += 20;
      bops.copy( bops.from(device, 'utf8'), buff, position, 0, 1);                position += 1;
      bops.writeUInt32BE(buff, startDate, position);                              position += 4;  
      bops.writeUInt32BE(buff, endDate, position);                                position += 4;  

      //Sending to websocket
      this.websocket.send(buff);
    }
    responseView506(dataview,position){
      let UserId = tools.ab2str(dataview, position, 20); position += 20;
      let AgreementTitle = tools.ab2str(dataview, position, 20); position += 20; 
      let AgreementDevice = tools.ab2str(dataview, position, 1); position += 1;   
      let DateStart = dataview.getUint32(position); position += 4;
      let DateEnd = dataview.getUint32(position); position += 4;

      let NoData = dataview.getUint32(position); position += 4;
      let NoDataArray = new Array(); 
      for (var i = 0; i<NoData; i++)
      {
        let ItemUserId = tools.ab2str(dataview, position, 20); position += 20;
        let ItemAgreementTitle = tools.ab2str(dataview, position, 20); position += 20; 
        let ItemAgreementDevice = tools.ab2str(dataview, position, 1); position += 1;   
        let ItemDateStart = dataview.getUint32(position); position += 4;
        let ItemDateEnd = dataview.getUint32(position); position += 4;
        let AgreementPublicIp = tools.ab2str(dataview, position, 16); position += 16;
        let AgreementLocalIp = tools.ab2str(dataview, position, 16); position += 16;  
        let NoDataArrayItem = {
              "UserId":ItemUserId,
              "AgreementTitle":ItemAgreementTitle,
              "AgreementDevice":ItemAgreementDevice,  
              "DateStart":ItemDateStart,  
              "DateEnd":ItemDateEnd,
              "AgreementPublicIp":AgreementPublicIp,
              "AgreementLocalIp":AgreementLocalIp
              };
              NoDataArray.push(NoDataArrayItem);
      }
      let view506 = {
          "UserId":UserId,
          "AgreementTitle":AgreementTitle,
          "AgreementDevice":AgreementDevice,
          "DateStart":DateStart , 
          "DateEnd":DateEnd , 
          "NoData":NoData , 
          "NoDataArray":NoDataArray , 
      }; 
      messageCenter.runCallback("view506",view506);
    }
    requestView701(){ 
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 701;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
     
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  
 
      //Sending to websocket
      this.websocket.send(buff);
    }
    responseView701(dataview,position){
 
      let NoData = dataview.getUint32(position); position += 4;
      let NoDataArray = new Array(); 
      for (var i = 0; i<NoData; i++)
      {
        let AccountCode = tools.ab2str(dataview, position, 15); position += 15;
        let AccountName = tools.ab2str(dataview, position, 64); position += 64; 
        let ProfileId = tools.ab2str(dataview, position, 10); position += 10; 
        let Type = tools.ab2str(dataview, position, 1); position += 1; 
        let FutureUse = tools.ab2str(dataview, position, 50); position += 50; 
        let NoDataArrayItem = {
          "AccountCode":AccountCode,
          "AccountName":AccountName,
          "ProfileId":ProfileId,  
          "Type":Type,  
          "FutureUse":FutureUse, 
        };
        NoDataArray.push(NoDataArrayItem);
      }
      let view701 = { 
          "NoData":NoData , 
          "ArrayNoAccount":NoDataArray , 
      }; 

      messageCenter.runCallback("view701",view701);
    }
    requestView908(_Symbol,_Side,_Price,_OrderQty,_BoardCode,_AccountCode,_TimeInForce) {
      if(this.isOpen) {

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 908;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let symbol = _Symbol;                       ghLength += 20;  viewDataLength += 20;
          let side = _Side;                           ghLength += 1;  viewDataLength += 1;
          let price = _Price;                         ghLength += 8;  viewDataLength += 8;
          let orderQty = _OrderQty;                   ghLength += 8;  viewDataLength += 8;
          let boardCode = _BoardCode;                 ghLength += 4;  viewDataLength += 4;
          let accountCode = _AccountCode;             ghLength += 12;  viewDataLength += 12;
          let timeInForce = _TimeInForce;             ghLength += 1;  viewDataLength += 1;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(symbol, 'utf8'), buff, position, 0, 20);               position += 20;
          bops.copy( bops.from(side, 'utf8'), buff, position, 0, 1);                  position += 1;
          bops.writeDoubleBE(buff, price, position);                                  position += 8;
          bops.writeUInt32BE(buff, orderQty, position+4);                             position += 8; //int64
          bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);             position += 4;
          bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 12);          position += 12;
          bops.copy( bops.from(timeInForce, 'utf8'), buff, position, 0, 1);           position += 1;
          
          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView908_ENC');
        
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView908(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view908 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view908",view908);
    }
    requestView909(_OrderId,_Symbol,_Side,_Price,_BoardCode,_SASOrderId) {
      if(this.isOpen) {

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 909;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let OrderId = _OrderId;                     ghLength += 8;  viewDataLength += 8;
          let Symbol = _Symbol;                       ghLength += 20; viewDataLength += 20;
          let Side = _Side;                           ghLength += 1;  viewDataLength += 1;
          let Price = _Price;                         ghLength += 8;  viewDataLength += 8;
          let BoardCode = _BoardCode;                 ghLength += 4;  viewDataLength += 4;
          let SASOrderId = _SASOrderId;               ghLength += 32; viewDataLength += 32;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeUInt32BE(buff, OrderId, position+4);                              position += 8;
          bops.copy( bops.from(Symbol, 'utf8'), buff, position, 0, 20);               position += 20;
          bops.copy( bops.from(Side, 'utf8'), buff, position, 0, 1);                  position += 1;
          bops.writeDoubleBE(buff, Price, position);                                  position += 8;
          bops.copy( bops.from(BoardCode, 'utf8'), buff, position, 0, 4);             position += 4;
          bops.copy( bops.from(SASOrderId, 'utf8'), buff, position, 0, 32);           position += 32;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView909_ENC');
        
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView909(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view909 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view909",view909);
    }
    requestView922(_Board,_Command,_Expiry,_Price,_Volume,_StockCode,_AccountId,_SplitOrder,_RandomSplit,_PriceStep,_AutoPriceFraction) {
      if(this.isOpen) {
        if(this.isEncOrder){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 922;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let Board = _Board=="2"?0x02:0x01;          ghLength += 1;  viewDataLength += 1;
          let Command = _Command=="1"?0x01:0x00;      ghLength += 1;  viewDataLength += 1;
          let Expiry = _Expiry=="1"?0x01:0x00;        ghLength += 1;  viewDataLength += 1;
          let Price = _Price;                         ghLength += 4;  viewDataLength += 4;
          let Volume = _Volume;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                 ghLength += 30; viewDataLength += 30;
          let AccountId = _AccountId;                 ghLength += 8;  viewDataLength += 8;
          let SplitOrder = _SplitOrder;               ghLength += 4;  viewDataLength += 4;
          let RandomSplit = _RandomSplit=="Y"?"Y":"N";ghLength += 1;  viewDataLength += 1;
          let PriceStep = _PriceStep;                 ghLength += 4;  viewDataLength += 4;
          let AutoPriceFraction = _AutoPriceFraction; ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.writeInt8(buff, Command, position);                                    position += 1;
          bops.writeInt8(buff, Expiry, position);                                     position += 1;
          bops.writeUInt32BE(buff, Price, position);                                  position += 4;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.writeUInt32BE(buff, SplitOrder, position);                             position += 4;
          bops.writeInt8(buff, RandomSplit, position);                                position += 1;
          bops.writeUInt32BE(buff, PriceStep, position);                              position += 4;
          bops.writeUInt32BE(buff, AutoPriceFraction, position);                      position += 4;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView922_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 922;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let Board = _Board=="2"?0x02:0x01;          ghLength += 1;  viewDataLength += 1;
          let Command = _Command=="1"?0x01:0x00;      ghLength += 1;  viewDataLength += 1;
          let Expiry = _Expiry=="1"?0x01:0x00;        ghLength += 1;  viewDataLength += 1;
          let Price = _Price;                         ghLength += 4;  viewDataLength += 4;
          let Volume = _Volume;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                 ghLength += 30; viewDataLength += 30;
          let AccountId = _AccountId;                 ghLength += 8;  viewDataLength += 8;
          let SplitOrder = _SplitOrder;               ghLength += 4;  viewDataLength += 4;
          let RandomSplit = _RandomSplit=="Y"?"Y":"N";ghLength += 1;  viewDataLength += 1;
          let PriceStep = _PriceStep;                 ghLength += 4;  viewDataLength += 4;
          let AutoPriceFraction = _AutoPriceFraction; ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.writeInt8(buff, Command, position);                                    position += 1;
          bops.writeInt8(buff, Expiry, position);                                     position += 1;
          bops.writeUInt32BE(buff, Price, position);                                  position += 4;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.writeUInt32BE(buff, SplitOrder, position);                             position += 4;
          bops.writeInt8(buff, RandomSplit, position);                                position += 1;
          bops.writeUInt32BE(buff, PriceStep, position);                              position += 4;
          bops.writeUInt32BE(buff, AutoPriceFraction, position);                      position += 4;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView922');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView922(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view922 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view922",view922);
    }
    requestView923(_Board,_Command,_Price,_OrderId,_JsxId,_StockCode,_AccountId) {
      if(this.isOpen) {
        if(this.isEncOrder){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 923;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let Board = _Board=="2"?0x02:0x01;          ghLength += 1;  viewDataLength += 1;
          let Command = _Command=="1"?0x01:0x00;      ghLength += 1;  viewDataLength += 1;
          let Price = _Price;                         ghLength += 4;  viewDataLength += 4;
          let OrderId = _OrderId;                     ghLength += 12; viewDataLength += 12;
          let JsxId = _JsxId;                         ghLength += 20; viewDataLength += 20;
          let StockCode = _StockCode;                 ghLength += 30; viewDataLength += 30;
          let AccountId = _AccountId;                 ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.writeInt8(buff, Command, position);                                    position += 1;
          bops.writeUInt32BE(buff, Price, position);                                  position += 4;
          bops.copy( bops.from(OrderId, 'utf8'), buff, position, 0, 12);              position += 12;
          bops.copy( bops.from(JsxId, 'utf8'), buff, position, 0, 20);                position += 20;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView923_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 923;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let Board = _Board=="2"?0x02:0x01;          ghLength += 1;  viewDataLength += 1;
          let Command = _Command=="1"?0x01:0x00;      ghLength += 1;  viewDataLength += 1;
          let Price = _Price;                         ghLength += 4;  viewDataLength += 4;
          let OrderId = _OrderId;                     ghLength += 12; viewDataLength += 12;
          let JsxId = _JsxId;                         ghLength += 20; viewDataLength += 20;
          let StockCode = _StockCode;                 ghLength += 30; viewDataLength += 30;
          let AccountId = _AccountId;                 ghLength += 8;  viewDataLength += 8;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.writeInt8(buff, Command, position);                                    position += 1;
          bops.writeUInt32BE(buff, Price, position);                                  position += 4;
          bops.copy( bops.from(OrderId, 'utf8'), buff, position, 0, 12);              position += 12;
          bops.copy( bops.from(JsxId, 'utf8'), buff, position, 0, 20);                position += 20;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView923');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView923(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view923 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view923",view923);
    }
    requestView924(_Board,_Command,_Expiry,_Price,_Volume,_OrderId,_JsxId,_StockCode,_AccountId) {
      if(this.isOpen) {
        if(this.isEncOrder){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 924;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let Board = _Board=="2"?0x02:0x01;          ghLength += 1;  viewDataLength += 1;
          let Command = _Command=="1"?0x01:0x00;      ghLength += 1;  viewDataLength += 1;
          let Expiry = _Expiry=="1"?0x01:0x00;        ghLength += 1;  viewDataLength += 1;
          let Price = _Price;                         ghLength += 4;  viewDataLength += 4;
          let Volume = _Volume;                       ghLength += 8;  viewDataLength += 8;
          let OrderId = _OrderId;                     ghLength += 12; viewDataLength += 12;
          let JsxId = _JsxId;                         ghLength += 20; viewDataLength += 20;
          let StockCode = _StockCode;                 ghLength += 30; viewDataLength += 30;
          let AccountId = _AccountId;                 ghLength += 8;  viewDataLength += 8;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.writeInt8(buff, Command, position);                                    position += 1;
          bops.writeInt8(buff, Expiry, position);                                     position += 1;
          bops.writeUInt32BE(buff, Price, position);                                  position += 4;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.copy( bops.from(OrderId, 'utf8'), buff, position, 0, 12);              position += 12;
          bops.copy( bops.from(JsxId, 'utf8'), buff, position, 0, 20);                position += 20;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView924_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 924;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let Board = _Board=="2"?0x02:0x01;          ghLength += 1;  viewDataLength += 1;
          let Command = _Command=="1"?0x01:0x00;      ghLength += 1;  viewDataLength += 1;
          let Expiry = _Expiry=="1"?0x01:0x00;        ghLength += 1;  viewDataLength += 1;
          let Price = _Price;                         ghLength += 4;  viewDataLength += 4;
          let Volume = _Volume;                       ghLength += 8;  viewDataLength += 8;
          let OrderId = _OrderId;                     ghLength += 12; viewDataLength += 12;
          let JsxId = _JsxId;                         ghLength += 20; viewDataLength += 20;
          let StockCode = _StockCode;                 ghLength += 30; viewDataLength += 30;
          let AccountId = _AccountId;                 ghLength += 8;  viewDataLength += 8;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.writeInt8(buff, Command, position);                                    position += 1;
          bops.writeInt8(buff, Expiry, position);                                     position += 1;
          bops.writeUInt32BE(buff, Price, position);                                  position += 4;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.copy( bops.from(OrderId, 'utf8'), buff, position, 0, 12);              position += 12;
          bops.copy( bops.from(JsxId, 'utf8'), buff, position, 0, 20);                position += 20;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView924');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView924(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view924 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view924",view924);
    }
    requestView925(_AccountId,_StockCode,_Board,_Command,_IndicatorFlag,_IndicatorPrice,_OrderPrice,_Volume,_ExpireDate) {
      if(this.isOpen) {
        if(this.isEncOrder){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 925;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let AccountId = _AccountId;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                       ghLength += 30; viewDataLength += 30;
          let Board = _Board=="2"?0x02:0x01;                ghLength += 1;  viewDataLength += 1;
          let Command = _Command;                           ghLength += 1;  viewDataLength += 1;
          let IndicatorFlag = _IndicatorFlag;               ghLength += 1;  viewDataLength += 1;
          let IndicatorPrice = _IndicatorPrice;             ghLength += 8;  viewDataLength += 8;
          let OrderPrice = _OrderPrice;                     ghLength += 8;  viewDataLength += 8;
          let Volume = _Volume;                             ghLength += 8;  viewDataLength += 8;
          let ExpireDate = _ExpireDate.replace(/-/g , "");  ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;


          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.copy( bops.from(Command, 'utf8'), buff, position, 0, 1);               position += 1;
          bops.copy( bops.from(IndicatorFlag, 'utf8'), buff, position, 0, 1);         position += 1;
          bops.writeDoubleBE(buff, IndicatorPrice, position);                         position += 8;
          bops.writeDoubleBE(buff, OrderPrice, position);                             position += 8;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.writeUInt32BE(buff, ExpireDate, position);                             position += 4;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView925_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 925;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data

          let AccountId = _AccountId;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                       ghLength += 30; viewDataLength += 30;
          let Board = _Board=="2"?0x02:0x01;                ghLength += 1;  viewDataLength += 1;
          let Command = _Command;                           ghLength += 1;  viewDataLength += 1;
          let IndicatorFlag = _IndicatorFlag;               ghLength += 1;  viewDataLength += 1;
          let IndicatorPrice = _IndicatorPrice;             ghLength += 8;  viewDataLength += 8;
          let OrderPrice = _OrderPrice;                     ghLength += 8;  viewDataLength += 8;
          let Volume = _Volume;                             ghLength += 8;  viewDataLength += 8;
          let ExpireDate = _ExpireDate.replace(/-/g , "");  ghLength += 4;  viewDataLength += 4;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.copy( bops.from(Command, 'utf8'), buff, position, 0, 1);               position += 1;
          bops.copy( bops.from(IndicatorFlag, 'utf8'), buff, position, 0, 1);         position += 1;
          bops.writeDoubleBE(buff, IndicatorPrice, position);                         position += 8;
          bops.writeDoubleBE(buff, OrderPrice, position);                             position += 8;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.writeUInt32BE(buff, ExpireDate, position);                             position += 4;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView925');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView925(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view925 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view925",view925);
    }
    requestView926(_OrderId,_AccountId,_StockCode,_Board,_Command,_IndicatorFlag,_IndicatorPrice,_OrderPrice,_Volume,_ExpireDate) {
      if(this.isOpen) {
        if(this.isEncOrder){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 926;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let OrderId = _OrderId;                           ghLength += 8;  viewDataLength += 8;
          let AccountId = _AccountId;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                       ghLength += 30; viewDataLength += 30;
          let Board = _Board=="2"?0x02:0x01;                ghLength += 1;  viewDataLength += 1;
          let Command = _Command;                           ghLength += 1;  viewDataLength += 1;
          let IndicatorFlag = _IndicatorFlag;               ghLength += 1;  viewDataLength += 1;
          let IndicatorPrice = _IndicatorPrice;             ghLength += 8;  viewDataLength += 8;
          let OrderPrice = _OrderPrice;                     ghLength += 8;  viewDataLength += 8;
          let Volume = _Volume;                             ghLength += 8;  viewDataLength += 8;
          let ExpireDate = _ExpireDate.replace(/-/g , "");  ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;


          bops.writeUInt32BE(buff, OrderId, position+4);                              position += 8;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.copy( bops.from(Command, 'utf8'), buff, position, 0, 1);               position += 1;
          bops.copy( bops.from(IndicatorFlag, 'utf8'), buff, position, 0, 1);         position += 1;
          bops.writeDoubleBE(buff, IndicatorPrice, position);                         position += 8;
          bops.writeDoubleBE(buff, OrderPrice, position);                             position += 8;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.writeUInt32BE(buff, ExpireDate, position);                             position += 4;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView926_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 926;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data

          let OrderId = _OrderId;                           ghLength += 8;  viewDataLength += 8;
          let AccountId = _AccountId;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                       ghLength += 30; viewDataLength += 30;
          let Board = _Board=="2"?0x02:0x01;                ghLength += 1;  viewDataLength += 1;
          let Command = _Command;                           ghLength += 1;  viewDataLength += 1;
          let IndicatorFlag = _IndicatorFlag;               ghLength += 1;  viewDataLength += 1;
          let IndicatorPrice = _IndicatorPrice;             ghLength += 8;  viewDataLength += 8;
          let OrderPrice = _OrderPrice;                     ghLength += 8;  viewDataLength += 8;
          let Volume = _Volume;                             ghLength += 8;  viewDataLength += 8;
          let ExpireDate = _ExpireDate.replace(/-/g , "");  ghLength += 4;  viewDataLength += 4;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeUInt32BE(buff, OrderId, position+4);                              position += 8;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.copy( bops.from(Command, 'utf8'), buff, position, 0, 1);               position += 1;
          bops.copy( bops.from(IndicatorFlag, 'utf8'), buff, position, 0, 1);         position += 1;
          bops.writeDoubleBE(buff, IndicatorPrice, position);                         position += 8;
          bops.writeDoubleBE(buff, OrderPrice, position);                             position += 8;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.writeUInt32BE(buff, ExpireDate, position);                             position += 4;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView926');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView926(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view926 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view926",view926);
    }
    requestView927(_OrderId,_AccountId,_StockCode,_Board,_Command,_IndicatorFlag,_IndicatorPrice,_OrderPrice,_Volume,_ExpireDate) {
      if(this.isOpen) {
        if(this.isEncOrder){

          //header
          let ghLength = 0;
          let ghMessageId = 0x06;                 ghLength += 1;
          let ghMessageFlag = 0x20|0x10;          ghLength += 1;

          //view
          let viewId = 927;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data
          let OrderId = _OrderId;                           ghLength += 8;  viewDataLength += 8;
          let AccountId = _AccountId;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                       ghLength += 30; viewDataLength += 30;
          let Board = _Board=="2"?0x02:0x01;                ghLength += 1;  viewDataLength += 1;
          let Command = _Command;                           ghLength += 1;  viewDataLength += 1;
          let IndicatorFlag = _IndicatorFlag;               ghLength += 1;  viewDataLength += 1;
          let IndicatorPrice = _IndicatorPrice;             ghLength += 8;  viewDataLength += 8;
          let OrderPrice = _OrderPrice;                     ghLength += 8;  viewDataLength += 8;
          let Volume = _Volume;                             ghLength += 8;  viewDataLength += 8;
          let ExpireDate = _ExpireDate.replace(/-/g , "");  ghLength += 4;  viewDataLength += 4;

          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;


          bops.writeUInt32BE(buff, OrderId, position+4);                              position += 8;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.copy( bops.from(Command, 'utf8'), buff, position, 0, 1);               position += 1;
          bops.copy( bops.from(IndicatorFlag, 'utf8'), buff, position, 0, 1);         position += 1;
          bops.writeDoubleBE(buff, IndicatorPrice, position);                         position += 8;
          bops.writeDoubleBE(buff, OrderPrice, position);                             position += 8;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.writeUInt32BE(buff, ExpireDate, position);                             position += 4;

          position = 0;
          let encryptedBuff = Blowfish.blowfish.encryptPacket(buff);
          let bufftosend = bops.create(6+encryptedBuff.length);

          bops.writeUInt32BE(bufftosend, encryptedBuff.length + 2, position); position +=4;
          bops.writeInt8(bufftosend, ghMessageId, position); position +=1;
          bops.writeInt8(bufftosend, ghMessageFlag, position); position +=1;
          bops.copy(encryptedBuff,bufftosend,position,0,encryptedBuff.length);

          //Sending to websocket
          this.websocket.send(bufftosend);

          tools.logSocket('requestView927_ENC');
        }
        else {
          //header
          let ghLength = 0;
          let ghMessageId = 0x06;     ghLength += 1;
          let ghMessageFlag = 0x20;   ghLength += 1;

          //view
          let viewId = 927;                       ghLength += 2;
          let viewMessageCode = 0x00;             ghLength += 1;
          let requestId = 0x00;                   ghLength += 2;
          let windowsId = 0;                      ghLength += 4;
          let viewDataLength = 0;                 ghLength += 4;
          //data

          let OrderId = _OrderId;                           ghLength += 8;  viewDataLength += 8;
          let AccountId = _AccountId;                       ghLength += 8;  viewDataLength += 8;
          let StockCode = _StockCode;                       ghLength += 30; viewDataLength += 30;
          let Board = _Board=="2"?0x02:0x01;                ghLength += 1;  viewDataLength += 1;
          let Command = _Command;                           ghLength += 1;  viewDataLength += 1;
          let IndicatorFlag = _IndicatorFlag;               ghLength += 1;  viewDataLength += 1;
          let IndicatorPrice = _IndicatorPrice;             ghLength += 8;  viewDataLength += 8;
          let OrderPrice = _OrderPrice;                     ghLength += 8;  viewDataLength += 8;
          let Volume = _Volume;                             ghLength += 8;  viewDataLength += 8;
          let ExpireDate = _ExpireDate.replace(/-/g , "");  ghLength += 4;  viewDataLength += 4;
          //Init buff
          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          //Create packet
          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
          bops.writeInt8(buff, ghMessageId, position);                                position += 1;
          bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;

          bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
          bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
          bops.writeUInt16BE(buff, requestId, position);                              position += 2;
          bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
          bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;

          bops.writeUInt32BE(buff, OrderId, position+4);                              position += 8;
          bops.copy( bops.from(AccountId, 'utf8'), buff, position, 0, 8);             position += 8;
          bops.copy( bops.from(StockCode, 'utf8'), buff, position, 0, 30);            position += 30;
          bops.writeInt8(buff, Board, position);                                      position += 1;
          bops.copy( bops.from(Command, 'utf8'), buff, position, 0, 1);               position += 1;
          bops.copy( bops.from(IndicatorFlag, 'utf8'), buff, position, 0, 1);         position += 1;
          bops.writeDoubleBE(buff, IndicatorPrice, position);                         position += 8;
          bops.writeDoubleBE(buff, OrderPrice, position);                             position += 8;
          bops.writeUInt32BE(buff, Volume, position+4);                               position += 8;
          bops.writeUInt32BE(buff, ExpireDate, position);                             position += 4;

          //Sending to websocket
          this.websocket.send(buff);

          tools.logSocket('requestView927');
        }
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseView927(dataview:any,position:number) {
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1;
      let Reason = tools.ab2str(dataview, position, 96); position += 96;

      let view927 = {
          SuccessFlag:SuccessFlag,
          Reason:Reason,
      };
      messageCenter.runCallback("view927",view927);
    }
    requestView933(_OrderId,_Account,_Product,_Board,_Side,_Price,_IdxOrderId,_Tif,_Pin){
      //header
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 933;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;
      //data

      let orderId = _OrderId;                 ghLength += 20;  viewDataLength += 20;
      let account = _Account;                 ghLength += 12;  viewDataLength += 12;
      let product = _Product;                 ghLength += 12;  viewDataLength += 12;
      let board = _Board;                     ghLength += 3;  viewDataLength += 3;
      let side = _Side;                       ghLength += 1;  viewDataLength += 1;
      let price = _Price;                     ghLength += 4;  viewDataLength += 4;
      let idxOrderId = _IdxOrderId;           ghLength += 15;  viewDataLength += 15;
      let tif = _Tif;                         ghLength += 1;  viewDataLength += 1;
      let pin = _Pin;                         ghLength += 20;  viewDataLength += 20;

      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
      
      bops.copy( bops.from(orderId, 'utf8'), buff, position, 0, 20);     position += 20;
      bops.copy( bops.from(account, 'utf8'), buff, position, 0, 12);     position += 12;
      bops.copy( bops.from(product, 'utf8'), buff, position, 0, 12);     position += 12;
      bops.copy( bops.from(board, 'utf8'), buff, position, 0, 3);        position += 3;
      bops.copy( bops.from(side, 'utf8'), buff, position, 0, 1);         position += 1;
      bops.writeUInt32BE(buff, price, position);                               position += 4;
      bops.copy( bops.from(idxOrderId, 'utf8'), buff, position, 0, 15);     position += 15;
      bops.copy( bops.from(tif, 'utf8'), buff, position, 0, 1);          position += 1;
      bops.copy( bops.from(pin, 'utf8'), buff, position, 0, 20);         position += 20;
      
      //Sending to websocket 
      this.websocket.send(buff);
      tools.logSocket('RequestView933['+_OrderId+']['+_Account+']['+_Product+']['+_Board+']['+_Side+']['+_Price+']['+_IdxOrderId+']['+_Tif+']['+_Pin+']['); 
  }
  responseView933(dataview,position){
      let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1; //char
      let Text = tools.ab2str(dataview, position, 100); position += 100; //string
      let view933 = {
          "SuccessFlag":SuccessFlag,
          "Text":Text,
      };
      tools.logSocket('ResponView953');
      tools.logSocket(view933);
      messageCenter.runCallback("view953",view933);
  }
    requestView951(_Account,_Product,_Board,_Side,_OrderVolume,_Price,_Tif,_SplitCount,_SplitRandom,_SplitSpread,_Pin){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 951;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let account = _Account;                 ghLength += 12;  viewDataLength += 12;
        let product = _Product;                 ghLength += 12;  viewDataLength += 12;
        let board = _Board;                     ghLength += 3;  viewDataLength += 3;
        let side = _Side;                       ghLength += 1;  viewDataLength += 1;
        let orderVolume = _OrderVolume;         ghLength += 4;  viewDataLength += 4;
        let price = _Price;                     ghLength += 4;  viewDataLength += 4;
        let tif = _Tif;                         ghLength += 1;  viewDataLength += 1;
        let pin = _Pin;                         ghLength += 20;  viewDataLength += 20;
        let splitCount = _SplitCount;           ghLength += 4;  viewDataLength += 4;
        let splitRandom = _SplitRandom;         ghLength += 1;  viewDataLength += 1;
        let splitSpread = _SplitSpread;         ghLength += 4;  viewDataLength += 4;
        
        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(account,'utf8'), buff, position, 0, 12);     position += 12;
        bops.copy( bops.from(product,'utf8'), buff, position, 0, 12);     position += 12;
        bops.copy( bops.from(board,'utf8'), buff, position, 0, 3);        position += 3;
        bops.copy( bops.from(side,'utf8'), buff, position, 0, 1);         position += 1;
        bops.writeUInt32BE(buff, orderVolume, position);                            position += 4;
        bops.writeUInt32BE(buff, price, position);                                  position += 4;
        bops.copy( bops.from(tif,'utf8'), buff, position, 0, 1);         position += 1;
        bops.writeUInt32BE(buff, splitCount, position);                            position += 4;
        bops.copy( bops.from(splitRandom,'utf8'), buff, position, 0, 1);         position += 1;
        bops.writeUInt32BE(buff, splitSpread, position);                            position += 4;
        bops.copy( bops.from(pin,'utf8'), buff, position, 0, 20);         position += 20;
        
        //Sending to websocket
        this.websocket.send(buff);
        tools.logSocket('requestview951');
        tools.logSocket("["+_Account+"]["+_Product+"]["+_Board+"]["+_Side+"]["+_OrderVolume+"]["+_Price+"]["+_Tif+"]["+_Pin+"]");
    }
    responseView951(dataview,position){
        let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1; //char
        let Text = tools.ab2str(dataview, position, 100); position += 100; //string
        let view951 = {
            "SuccessFlag":SuccessFlag,
            "Text":Text,
        };
        messageCenter.runCallback("view951",view951);
        messageCenter.runCallback("view951a",view951);
        tools.logSocket('view951a');
        tools.logSocket(view951);
    }
    requestView952( _OrderId,_Account,_Product,_Board,_Side,_NewOrderVolume,_NewPrice,_IdxOrderId,_Tif,_CounterParty,_Pin){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 952;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let orderId = _OrderId;                 ghLength += 20;  viewDataLength += 20;
        let account = _Account;                 ghLength += 12;  viewDataLength += 12;
        let product = _Product;                 ghLength += 12;  viewDataLength += 12;
        let board = _Board;                     ghLength += 3;  viewDataLength += 3;
        let side = _Side;                       ghLength += 1;  viewDataLength += 1;
        let newOrderVolume = _NewOrderVolume;   ghLength += 4;  viewDataLength += 4;
        let newPrice = _NewPrice;               ghLength += 4;  viewDataLength += 4;
        let idxOrderId = _IdxOrderId;           ghLength += 15;  viewDataLength += 15;
        let tif = _Tif;                         ghLength += 1;  viewDataLength += 1;
        let counterParty = _CounterParty;       ghLength += 12;  viewDataLength += 12;
        let pin = _Pin;                         ghLength += 20;  viewDataLength += 20;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(orderId, 'utf8'), buff, position, 0, 20);     position += 20;
        bops.copy( bops.from(account, 'utf8'), buff, position, 0, 12);     position += 12;
        bops.copy( bops.from(product, 'utf8'), buff, position, 0, 12);     position += 12;
        bops.copy( bops.from(board, 'utf8'), buff, position, 0, 3);        position += 3;
        bops.copy( bops.from(side, 'utf8'), buff, position, 0, 1);         position += 1;
        bops.writeUInt32BE(buff, newOrderVolume, position);                         position += 4;
        bops.writeUInt32BE(buff, newPrice, position);                               position += 4;
        bops.copy( bops.from(idxOrderId, 'utf8'), buff, position, 0, 15);     position += 15;
        bops.copy( bops.from(tif, 'utf8'), buff, position, 0, 1);          position += 1;
        bops.copy( bops.from(counterParty, 'utf8'), buff, position, 0, 12);     position += 12;
        bops.copy( bops.from(pin, 'utf8'), buff, position, 0, 20);         position += 20;
        
        //Sending to websocket 
        this.websocket.send(buff);
    }
    responseView952(dataview,position){
        let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1; //char
        let Text = tools.ab2str(dataview, position, 100); position += 100; //string
        let view952 = {
            "SuccessFlag":SuccessFlag,
            "Text":Text,
        };
        messageCenter.runCallback("view952",view952);
    }
    requestView953(_OrderId,_Account,_Product,_Board,_Side,_Price,_IdxOrderId,_Tif,_Pin){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 953;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let orderId = _OrderId;                 ghLength += 20;  viewDataLength += 20;
        let account = _Account;                 ghLength += 12;  viewDataLength += 12;
        let product = _Product;                 ghLength += 12;  viewDataLength += 12;
        let board = _Board;                     ghLength += 3;  viewDataLength += 3;
        let side = _Side;                       ghLength += 1;  viewDataLength += 1;
        let price = _Price;                     ghLength += 4;  viewDataLength += 4;
        let idxOrderId = _IdxOrderId;           ghLength += 15;  viewDataLength += 15;
        let tif = _Tif;                         ghLength += 1;  viewDataLength += 1;
        let pin = _Pin;                         ghLength += 20;  viewDataLength += 20;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(orderId, 'utf8'), buff, position, 0, 20);     position += 20;
        bops.copy( bops.from(account, 'utf8'), buff, position, 0, 12);     position += 12;
        bops.copy( bops.from(product, 'utf8'), buff, position, 0, 12);     position += 12;
        bops.copy( bops.from(board, 'utf8'), buff, position, 0, 3);        position += 3;
        bops.copy( bops.from(side, 'utf8'), buff, position, 0, 1);         position += 1;
        bops.writeUInt32BE(buff, price, position);                               position += 4;
        bops.copy( bops.from(idxOrderId, 'utf8'), buff, position, 0, 15);     position += 15;
        bops.copy( bops.from(tif, 'utf8'), buff, position, 0, 1);          position += 1;
        bops.copy( bops.from(pin, 'utf8'), buff, position, 0, 20);         position += 20;
        
        //Sending to websocket 
        this.websocket.send(buff);
        tools.logSocket('RequestView953['+_OrderId+']['+_Account+']['+_Product+']['+_Board+']['+_Side+']['+_Price+']['+_IdxOrderId+']['+_Tif+']['+_Pin+']['); 
    }
    responseView953(dataview,position){
        let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1; //char
        let Text = tools.ab2str(dataview, position, 100); position += 100; //string
        let view953 = {
            "SuccessFlag":SuccessFlag,
            "Text":Text,
        };
        tools.logSocket('ResponView953');
        tools.logSocket(view953);
        messageCenter.runCallback("view953",view953);
    }
    requestView982(_Account,_StockCode,_Board,_BuyInFlag,_BuyInPrice,_BuyOrderPrice,_Volume,_Expiry,_StopLossInPrice,_StopLossOrderPrice,_TakeProfitInPrice,_TakeProfitOrderPrice,_InType){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 982;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let account = _Account;                                 ghLength += 15;  viewDataLength += 15;
        let stockCode = _StockCode;                             ghLength += 12;  viewDataLength += 12;
        let board = _Board;                                     ghLength += 1;  viewDataLength += 1;
        let buyInFlag = _BuyInFlag;                             ghLength += 1;  viewDataLength += 1;
        let buyInPrice = _BuyInPrice;                           ghLength += 8;  viewDataLength += 8;
        let buyOrderPrice = _BuyOrderPrice;                     ghLength += 8;  viewDataLength += 8;
        let volume = _Volume;                                   ghLength += 8;  viewDataLength += 8;
        let expiry = _Expiry.replace(/-/g , "");                ghLength += 4;  viewDataLength += 4;
        let stopLossInPrice = _StopLossInPrice;                 ghLength += 8;  viewDataLength += 8;
        let stopLossOrderPrice = _StopLossOrderPrice;           ghLength += 8;  viewDataLength += 8;
        let takeProfitInPrice = _TakeProfitInPrice;             ghLength += 8;  viewDataLength += 8;
        let takeProfitOrderPrice = _TakeProfitOrderPrice;       ghLength += 8;  viewDataLength += 8;
        let inType = _InType;                                   ghLength += 1;  viewDataLength += 1;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.copy( bops.from(account, 'utf8'), buff, position, 0, 15);     position += 15;
        bops.copy( bops.from(stockCode, 'utf8'), buff, position, 0, 12);   position += 12;
        bops.writeInt8(buff, board, position);              /*char */               position += 1;
        bops.copy( bops.from(buyInFlag, 'utf8'), buff, position, 0, 1);    position += 1;
        bops.writeDoubleBE(buff, buyInPrice, position);                             position += 8;
        bops.writeDoubleBE(buff, buyOrderPrice, position);                          position += 8;
        bops.writeUInt32BE(buff, volume, position+4);                               position += 8;
        bops.writeUInt32BE(buff, expiry, position);                                 position += 4;
        bops.writeDoubleBE(buff, stopLossInPrice, position);                        position += 8;
        bops.writeDoubleBE(buff, stopLossOrderPrice, position);                     position += 8;
        bops.writeDoubleBE(buff, takeProfitInPrice, position);                      position += 8;
        bops.writeDoubleBE(buff, takeProfitOrderPrice, position);                   position += 8;
        bops.copy( bops.from(inType, 'utf8'), buff, position, 0, 1);       position += 1;
        
        //Sending to websocket 
        this.websocket.send(buff);;
    }
    responseView982(dataview,position){
        let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1; //char
        let Text = tools.ab2str(dataview, position, 96); position += 96; //string
        let view982 = {
            "SuccessFlag":SuccessFlag,
            "Text":Text,
        };
        messageCenter.runCallback("view982",view982);
    }
    requestView983(_OrderId,_AccountId,_StockCode,_Board){
        //header
        let ghLength = 0;
        let ghMessageId = 0x06;     ghLength += 1;
        let ghMessageFlag = 0x20;   ghLength += 1;
        
        //view
        let viewId = 983;                       ghLength += 2;
        let viewMessageCode = 0x00;             ghLength += 1;
        let requestId = 0x00;                   ghLength += 2;
        let windowsId = 0;                      ghLength += 4;
        let viewDataLength = 0;                 ghLength += 4;
        //data

        let orderId = _OrderId;                 ghLength += 8;  viewDataLength += 8;
        let accountId = _AccountId;             ghLength += 15;  viewDataLength += 15;
        let stockCode = _StockCode;             ghLength += 12;  viewDataLength += 12;
        let board = _Board;                     ghLength += 1;  viewDataLength += 1;

        //Init buff
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        //Create packet
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
        bops.writeInt8(buff, ghMessageId, position);                                position += 1;
        bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
        
        bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
        bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
        bops.writeUInt16BE(buff, requestId, position);                              position += 2;
        bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
        bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
        
        bops.writeUInt32BE(buff, orderId, position+4);                               position += 8;
        bops.copy( bops.from(accountId, 'utf8'), buff, position, 0, 15);      position += 15;
        bops.copy( bops.from(stockCode, 'utf8'), buff, position, 0, 12);        position += 12;
        bops.writeInt8(buff, board, position);              /*char */              position += 1;
        //bops.copy( bops.from(status, encoding='utf8'), buff, position, 0, 1);       position += 1;

        //Sending to websocket 
        this.websocket.send(buff);
    }
    responseView983(dataview,position){
        let SuccessFlag = tools.ab2str(dataview, position, 1); position += 1; //char
        let Text = tools.ab2str(dataview, position, 96); position += 96; //string
        let view983 = {
            "SuccessFlag":SuccessFlag,
            "Text":Text,
        };
        messageCenter.runCallback("view983",view983);
    }
    requestView1434(_AccountCode){
      let ghLength = 0;
      let ghMessageId = 0x06;     ghLength += 1;
      let ghMessageFlag = 0x20;   ghLength += 1;
      
      //view
      let viewId = 1434;                       ghLength += 2;
      let viewMessageCode = 0x00;             ghLength += 1;
      let requestId = 0x00;                   ghLength += 2;
      let windowsId = 0;                      ghLength += 4;
      let viewDataLength = 0;                 ghLength += 4;

      //data
      let accountCode = _AccountCode;         ghLength += 12;  viewDataLength += 12;
     
      //Init buff
      let buff = bops.create(ghLength+4);
      for(let i =0; i< buff.length;i++)
          buff[i] = 0x00;
      
      //Create packet
      let position = 0;
      bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
      bops.writeInt8(buff, ghMessageId, position);                                position += 1;
      bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
      
      bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
      bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
      bops.writeUInt16BE(buff, requestId, position);                              position += 2;
      bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
      bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;  
      bops.copy( bops.from(accountCode, 'utf8'), buff, position, 0, 12);    position += 12;
      //Sending to websocket
      this.websocket.send(buff);
  }
  responseView1434(dataview,position){
    let AccountCode = tools.ab2str(dataview, position, 12); position += 12;
    let Name = tools.ab2str(dataview, position, 64); position += 64;
    let ParameterArap = dataview.getFloat64(position); position += 8;
    let ParameterPortofolio = dataview.getFloat64(position); position += 8;
    let AccountType = tools.ab2str(dataview, position, 1); position += 1;
    let AllowShort = tools.ab2str(dataview, position, 1); position += 1;
    let AllowMargin = tools.ab2str(dataview, position, 1); position += 1;
    let FeeBuy = dataview.getFloat64(position); position += 8;
    let FeeSell = dataview.getFloat64(position); position += 8;
    let CreditLimit = dataview.getFloat64(position); position += 8;
    let TradingRatio = dataview.getFloat64(position); position += 8;
    let PrevCash = dataview.getFloat64(position); position += 8;
    let CurrentBalance = dataview.getFloat64(position); position += 8;
    let DateT0 = tools.ab2str(dataview, position, 12); position += 12;
    let ReceivableT0 = dataview.getFloat64(position); position += 8;
    let PayableT0 = dataview.getFloat64(position); position += 8;
    let DateT1 = tools.ab2str(dataview, position, 12); position += 12;
    let ReceivableT1 = dataview.getFloat64(position); position += 8;
    let PayableT1 = dataview.getFloat64(position); position += 8;
    let DateT2 = tools.ab2str(dataview, position, 12); position += 12;
    let ReceivableT2 = dataview.getFloat64(position); position += 8;
    let PayableT2 = dataview.getFloat64(position); position += 8;
    let DateT3 = tools.ab2str(dataview, position, 12); position += 12;
    let ReceivableT3 = dataview.getFloat64(position); position += 8;
    let PayableT3 = dataview.getFloat64(position); position += 8;
    let PendingBuyValue = dataview.getFloat64(position); position += 8;
    let PendingSellValue = dataview.getFloat64(position); position += 8;
    let ProfilId = tools.ab2str(dataview, position, 10); position += 10;
    let RdiBank = tools.ab2str(dataview, position, 32); position += 32;
    let Rdi = dataview.getFloat64(position); position += 8;
    let Sid = tools.ab2str(dataview, position, 18); position += 18;
    let RdiAccountBank = tools.ab2str(dataview, position, 32); position += 32;
    let WithdrawValue = dataview.getFloat64(position); position += 8;
    let DateTMinus1 = tools.ab2str(dataview, position, 12); position += 12;
    let ReceivableTMinus1 = dataview.getFloat64(position); position += 8;
    let PayableTMinus1 = dataview.getFloat64(position); position += 8;
    let DateTMinus2 = tools.ab2str(dataview, position, 12); position += 12;
    let ReceivableTMinus2 = dataview.getFloat64(position); position += 8;
    let PayableTMinus2 = dataview.getFloat64(position); position += 8;
    let DepositAdjustment = dataview.getFloat64(position); position += 8;
    let OpeningBalance = dataview.getFloat64(position); position += 8;
    let CurrentBalanceCalced = dataview.getFloat64(position); position += 8;
    let NoProduct = dataview.getUint32(position); position += 4;
    let NoProductArray = new Array();
    
    /*TAMBAHAN SUMIN BUAT ARAP*/
    /* TABLE ini kalo di ZP kebalik, istilahnya T3 -> T0, bukan T0 -> T3, tapi aku cocokin dari protokol remote aja biar liatnya gampang
    *                      Margin        OverDue          T0          T1          T2          T3
    *    Receive                                          ReceivableT0ReceivableT1ReceivableT2ReceivableT3 
    *    Pay                                              PayableT0    PayableT1    PayableT2    PayableT3
    *    Outstanding        OM            OO              OT0          OT1          OT2          OT3
    */
    
    /*  utk ditampilkan jangan pake _OT0, _OT1, _OT2, _OT3.
    *    pake yang OT0, OT1, OT2, OT3;
    */
    let OT0 =0, OT1 = 0, OT2 = 0, OT3 = 0;
    
     let _OT2 = PrevCash + ReceivableT0 +ReceivableT1 + ReceivableT2 - PayableT0 -PayableT1 - PayableT2;
     let _OT3 = _OT2 + ReceivableT3 - PayableT3 - WithdrawValue + DepositAdjustment;
    let _OT1 = _OT2 - ReceivableT2 + PayableT2;
    let _OT0 = _OT1 - ReceivableT1 + PayableT1;
    let OO = 0;
    let OM = 0;
    if(_OT0 < 0)
    {
      OO = _OT0 - ReceivableT0 + PayableT0;
      OM = OO - ReceivableTMinus1 + PayableTMinus1;
    }
   
    if(_OT3 < 0)  OT3 = _OT3;
    if(_OT2 < 0)  OT2 = _OT2;
    if(_OT1 < 0)   OT1 = _OT1;
     if(_OT0 < 0)   OT0 = _OT0;
      
    /*END OF TAMBAHAN SUMIN BUAT ARAP*/
    
    for (var i = 0; i<NoProduct; i++)
    {
        let Product = tools.ab2str(dataview, position, 12); position += 12;
        let OpenVolume = tools.getInt64(dataview,position); position += 8;
        let BalanceVolume = tools.getInt64(dataview,position); position += 8;
        let AvgPrice = dataview.getFloat64(position); position += 8;
        let LastPrice = dataview.getUint32(position); position += 4;
        let ValuationRatio = dataview.getFloat64(position); position += 8;
        
        //var BrokerCode = ab2str(dataview, position, 4); position += 4; //String
        //var StartDate = dataview.getUint32(position); position += 4; //uint 32
        //var BuyLot = getUint64(dataview,position); position += 8; //int 64
        //var BuyAveragePrice = dataview.getFloat64(position); position += 8; //double
        
        let NoProductArrayItem = {
            "Product":Product,
            "OpenVolume":OpenVolume,
            "BalanceVolume":BalanceVolume,  
            "AvgPrice":AvgPrice,  
            "LastPrice":LastPrice,  
            "ValuationRatio":ValuationRatio,  
            };
        NoProductArray.push(NoProductArrayItem);
    }
    let view434 = {
        "AccountCode":AccountCode,
        "Name":Name,
        "ParameterArap":ParameterArap,
        "ParameterPortofolio":ParameterPortofolio,
        "AccountType":AccountType,
        "AllowShort":AllowShort,
        "AllowMargin":AllowMargin,
        "FeeBuy":FeeBuy,
        "FeeSell":FeeSell,
        "CreditLimit":CreditLimit,
        "TradingRatio":TradingRatio,
        "PrevCash":PrevCash,
        "CurrentBalance":CurrentBalance,
        "DateT0":DateT0,
        "ReceivableT0":ReceivableT0,
        "PayableT0":PayableT0,
        "DateT1":DateT1,
        "ReceivableT1":ReceivableT1,
        "PayableT1":PayableT1,
        "DateT2":DateT2,
        "ReceivableT2":ReceivableT2,
        "PayableT2":PayableT2,
        "DateT3":DateT3,
        "ReceivableT3":ReceivableT3,
        "PayableT3":PayableT3,
        "PendingBuyValue":PendingBuyValue,
        "PendingSellValue":PendingSellValue,
        "ProfilId":ProfilId,
        "RdiBank":RdiBank,
        "Rdi":Rdi,
        "Sid":Sid,
        "RdiAccountBank":RdiAccountBank,
        "WithdrawValue":WithdrawValue,
        "DateTMinus1":DateTMinus1,
        "ReceivableTMinus1":ReceivableTMinus1,
        "PayableTMinus1":PayableTMinus1,
        "DateTMinus2":DateTMinus2,
        "ReceivableTMinus2":ReceivableTMinus2,
        "PayableTMinus2":PayableTMinus2,
        "DepositAdjustment":DepositAdjustment,
        "OpeningBalance":OpeningBalance,
        "CurrentBalanceCalced":CurrentBalanceCalced,
        "NoProductArray":NoProductArray,
        "OO":OO,
        "OM":OM,
        "OT0":OT0,
        "OT1":OT1,
        "OT2":OT2,
        "OT3":OT3,
    };
    messageCenter.runCallback("view434",view434);
    messageCenter.runCallback("view434a",view434);

    tools.logSocket('ResponView434 Kasih');
    tools.logSocket(view434);
  }
  requestView244(_ProductCode,_BoardCode,_LastDate,_StartDate){
    //header
    let ghLength = 0;
    let ghMessageId = 0x06;     ghLength += 1;
    let ghMessageFlag = 0x20;   ghLength += 1;
    
    //view
    let viewId = 244;                                    ghLength += 2;
    let viewMessageCode = 0x00;                         ghLength += 1;
    let requestId = 0x00;                               ghLength += 2;
    let windowsId = 0;                                  ghLength += 4;
    let viewDataLength = 0;                             ghLength += 4;
    let productCode = _ProductCode;                     ghLength += 24; viewDataLength += 24;
    let boardCode = _BoardCode;                         ghLength += 4;  viewDataLength += 4;
    let lastDate = _LastDate.replace(/-/g , "");        ghLength += 4;  viewDataLength += 4;
    let startDate = _StartDate.replace(/-/g , "");      ghLength += 4;  viewDataLength += 4;
    
    //Init buff
    let buff = bops.create(ghLength+4);
    for(let i =0; i< buff.length;i++)
        buff[i] = 0x00;
    
    //Create packet
    let position = 0;
    bops.writeUInt32BE(buff, ghLength, position);                               position += 4;
    bops.writeInt8(buff, ghMessageId, position);                                position += 1;
    bops.writeInt8(buff, ghMessageFlag, position);                              position += 1;
    
    bops.writeUInt16BE(buff, viewId, position);                                 position += 2;
    bops.writeInt8(buff, viewMessageCode, position);                            position += 1;
    bops.writeUInt16BE(buff, requestId, position);                              position += 2;
    bops.writeUInt32BE(buff, windowsId, position);                              position += 4;
    bops.writeUInt32BE(buff, viewDataLength, position);                         position += 4;
    bops.copy( bops.from(productCode, 'utf8'), buff, position, 0, 24); position += 24;
    bops.copy( bops.from(boardCode, 'utf8'), buff, position, 0, 4);    position += 4;
    bops.writeUInt32BE(buff, lastDate, position);                               position += 4;
    bops.writeUInt32BE(buff, startDate, position);                           position += 4;
    
    //Sending to websocket
    this.websocket.send(buff);   
  }
  responseView244(dataview,position){
    let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
    let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
    let LastDate = dataview.getUint32(position); position += 4;
    let StartDate = dataview.getUint32(position); position += 4;
    let NoDate = dataview.getUint32(position); position += 4;
    
    let NoDateArray = new Array();
    for (let i = 0; i<NoDate; i++){
        let nDate = dataview.getUint32(position); position += 4;
        let PreviousPrice = dataview.getFloat64(position); position += 8;
        let LastPrice = dataview.getFloat64(position); position += 8;
        let OpenPrice = dataview.getFloat64(position); position += 8;
        let HighPrice = dataview.getFloat64(position); position += 8;
        let LowPrice = dataview.getFloat64(position); position += 8;
        let AveragePrice = dataview.getFloat64(position); position += 8;
        let TotalFreq = dataview.getUint32(position); position += 4;
        let TotalLot = tools.getInt64(dataview,position); position += 8;
        let TotalValue = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyFreq = dataview.getUint32(position); position += 4;
        let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
        let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
        let ForeignSellFreq = dataview.getUint32(position); position += 4;
        let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
        let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
        
        let NoDateArrayItem = {
            "Date":nDate,
            "PreviousPrice":PreviousPrice,
            "LastPrice":LastPrice,
            "OpenPrice":OpenPrice,
            "HighPrice":HighPrice,
            "LowPrice":LowPrice,
            "AveragePrice":AveragePrice,
            "TotalFreq":TotalFreq,
            "TotalLot":TotalLot,
            "TotalValue":TotalValue,
            "ForeignBuyFreq":ForeignBuyFreq,
            "ForeignBuyLot":ForeignBuyLot,
            "ForeignBuyValue":ForeignBuyValue,
            "ForeignSellFreq":ForeignSellFreq,
            "ForeignSellLot":ForeignSellLot,
            "ForeignSellValue":ForeignSellValue,
        };
        NoDateArray.push(NoDateArrayItem);
    }
    
    let view244 = {
        "ProductCode":ProductCode,
        "BoardCode":BoardCode,
        "LastDate":LastDate,
        "StartDate":StartDate,
        "NoDate":NoDate,
        "NoDateArray":NoDateArray,
    };
    messageCenter.runCallback("view244",view244);
  }
    requestAutoUpdate1( subscribe, _productCode, _boardCode) {
      if(this.isOpen && _productCode!=null) {
        let ghLength = 0;
        let ghMessageId = 0x07; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 1; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;
        let NoAutoUpdateKeys = 1; ghLength += 4;    //jumlah parameter
        let ProductCode = _productCode; ghLength += 24; AutoUpdateKeyLength += 24;
        let BoardCode = _boardCode; ghLength += 4; AutoUpdateKeyLength += 4;

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);     position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4;
        bops.copy( bops.from(ProductCode, 'utf8'), buff, position, 0, 24);     position += 24;
        bops.copy( bops.from(BoardCode, 'utf8'), buff, position, 0, 4);        position += 4;

        this.websocket.send(buff);
        tools.logSocket('requestAutoUpdate1 : '+setUnsetFlag+'['+ProductCode+']['+BoardCode+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseAutoUpdate1(dataview:any ,position:number) {
      let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let AutoUpdateDataLength = dataview.getUint32(position); position += 4;
      let PreviousPrice = dataview.getFloat64(position); position += 8;
      let LastPrice = dataview.getFloat64(position); position += 8;
      let OpenPrice = dataview.getFloat64(position); position += 8;
      let HighPrice = dataview.getFloat64(position); position += 8;
      let LowPrice = dataview.getFloat64(position); position += 8;
      let AveragePrice = dataview.getFloat64(position); position += 8;
      let TotalFreq = dataview.getUint32(position); position += 4;
      let TotalLot = tools.getInt64(dataview,position); position += 8;
      let LastTradedLot = tools.getInt64(dataview,position); position += 8;
      let TotalValue = tools.getInt64(dataview,position); position += 8;
      let BestBidPrice = dataview.getFloat64(position); position += 8;
      let BestOfferPrice = dataview.getFloat64(position); position += 8;
      let BestBidLot = tools.getInt64(dataview,position); position += 8;
      let BestOfferLot = tools.getInt64(dataview,position); position += 8;
      let ForeignBuyFreq = dataview.getUint32(position); position += 4;
      let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
      let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
      let ForeignSellFreq = dataview.getUint32(position); position += 4;
      let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
      let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
     // let BPercent = dataview.getFloat64(position); position += 8;


      let autoUpdate1 = {
          "AutoUpdateKeyLength":AutoUpdateKeyLength,
          "AutoUpdateDataLength":AutoUpdateDataLength,
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "PreviousPrice":PreviousPrice,
          "LastPrice":LastPrice,
          "OpenPrice":OpenPrice,
          "HighPrice":HighPrice,
          "LowPrice":LowPrice,
          "AveragePrice":AveragePrice,
          "TotalFreq":TotalFreq,
          "TotalLot":TotalLot,
          "LastTradedLot":LastTradedLot,
          "TotalValue":TotalValue,
          "BestBidPrice":BestBidPrice,
          "BestOfferPrice":BestOfferPrice,
          "BestBidLot":BestBidLot,
          "BestOfferLot":BestOfferLot,
          "ForeignBuyFreq":ForeignBuyFreq,
          "ForeignBuyLot":ForeignBuyLot,
          "ForeignBuyValue":ForeignBuyValue,
          "ForeignSellFreq":ForeignSellFreq,
          "ForeignSellLot":ForeignSellLot,
          "ForeignSellValue":ForeignSellValue,
          "BPercent":0,
      };
      messageCenter.runCallback("autoUpdate1",autoUpdate1);
    }
    requestAutoUpdate3( subscribe, _productCode, _boardCode) {
      if(this.isOpen && _productCode!=null) {
        let ghLength = 0;
        let ghMessageId = 0x07; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 3; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;
        let NoAutoUpdateKeys = 1; ghLength += 4;    //jumlah parameter
        let ProductCode = _productCode; ghLength += 24; AutoUpdateKeyLength += 24;
        let BoardCode = _boardCode; ghLength += 4; AutoUpdateKeyLength += 4;

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);     position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4;
        bops.copy( bops.from(ProductCode, 'utf8'), buff, position, 0, 24);     position += 24;
        bops.copy( bops.from(BoardCode, 'utf8'), buff, position, 0, 4);        position += 4;

        this.websocket.send(buff);
        tools.logSocket('requestAutoUpdate3 : '+setUnsetFlag+'['+ProductCode+']['+BoardCode+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseAutoUpdate3(dataview:any ,position:number) {
      let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let AutoUpdateDataLength = dataview.getUint32(position); position += 4;
      let PreviousPrice = dataview.getFloat64(position); position += 8;
      let NoBid = dataview.getUint32(position); position += 4;
      let NoBidArray = new Array();
      for (let i = 0; i<NoBid; i++)
      {
          let BidPrice = dataview.getFloat64(position); position += 8;
          let BidLot = tools.getInt64(dataview,position); position += 8;
          let BidVol = dataview.getUint32(position); position += 4;
          //let BidLotChange = tools.getInt64(dataview,position); position += 8;
          let BidArray = {
              "BidPrice":BidPrice,
              "BidLot":BidLot,
              "BidVol":BidVol,
              "BidLotChange":0,
          };
          NoBidArray.push(BidArray);
      }
      let NoOffer = dataview.getUint32(position); position += 4;
      let NoOfferArray = new Array();
      for (let i = 0; i<NoOffer; i++)
      {
          let OfferPrice = dataview.getFloat64(position); position += 8;
          let OfferLot = tools.getInt64(dataview,position); position += 8;
          let OfferVol = dataview.getUint32(position); position += 4;
          //let OfferLotChange = tools.getInt64(dataview,position); position += 8;
          let OfferArray = {
              "OfferPrice":OfferPrice,
              "OfferLot":OfferLot,
              "OfferVol":OfferVol,
              "OfferLotChange":0,
          };
          NoOfferArray.push(OfferArray);
      }



      let autoUpdate3 = {
          "AutoUpdateKeyLength":AutoUpdateKeyLength,
          "AutoUpdateDataLength":AutoUpdateDataLength,
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "PreviousPrice":PreviousPrice,
          "NoBid":NoBid,
          "NoBidArray":NoBidArray,
          "NoOffer":NoOffer,
          "NoOfferArray":NoOfferArray,
      };

      messageCenter.runCallback("autoUpdate3",autoUpdate3);
      messageCenter.runCallback("autoUpdate3a",autoUpdate3);
    }
    requestAutoUpdate4( subscribe, _productCode, _boardCode) {
      if(this.isOpen && _productCode!=null) {
        let ghLength = 0;
        let ghMessageId = 0x07; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 4; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;
        let NoAutoUpdateKeys = 1; ghLength += 4;    //jumlah parameter
        let ProductCode = _productCode; ghLength += 24; AutoUpdateKeyLength += 24;
        let BoardCode = _boardCode; ghLength += 4; AutoUpdateKeyLength += 4;

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);     position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4;
        bops.copy( bops.from(ProductCode, 'utf8'), buff, position, 0, 24);     position += 24;
        bops.copy( bops.from(BoardCode, 'utf8'), buff, position, 0, 4);        position += 4;

        this.websocket.send(buff);
        tools.logSocket('requestAutoUpdate4 : '+setUnsetFlag+'['+ProductCode+']['+BoardCode+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseAutoUpdate4(dataview:any ,position:number) {
      let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let AutoUpdateDataLength = dataview.getUint32(position); position += 4;
      let PreviousPrice = dataview.getFloat64(position); position += 8;
      let NoTradeBook = dataview.getUint32(position); position += 4; //uint 32
      let NoTradeBookArray = new Array();
      for (let i = 0; i<NoTradeBook; i++)
      {
          let Price = dataview.getFloat64(position); position += 8; //double
          let Freq = dataview.getUint32(position); position += 4; //uint 32
          let Lot = tools.getInt64(dataview,position); position += 8; //int 64
          let Value = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignBuyFreq = dataview.getUint32(position); position += 4; //uint 32
          let ForeignBuyLot = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignBuyValue = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignSellFreq = dataview.getUint32(position); position += 4; //uint 32
          let ForeignSellLot = tools.getInt64(dataview,position); position += 8; //int 64
          let ForeignSellValue = tools.getInt64(dataview,position); position += 8; //int 64
          let BLot = tools.getInt64(dataview,position); position += 8; //int 64
          let SLot = tools.getInt64(dataview,position); position += 8; //int 64
          let BFreq = dataview.getUint32(position); position += 4; //uint 32
          let SFreq = dataview.getUint32(position); position += 4; //uint 32

          let ArrayItem = {
              "Price":Price,
              "Freq":Freq,
              "Lot":Lot,
              "Value":Value,
              "ForeignBuyFreq":ForeignBuyFreq,
              "ForeignBuyLot":ForeignBuyLot,
              "ForeignBuyValue":ForeignBuyValue,
              "ForeignSellFreq":ForeignSellFreq,
              "ForeignSellLot":ForeignSellLot,
              "ForeignSellValue":ForeignSellValue,
              "BLot":BLot,
              "SLot":SLot,
              "BFreq":BFreq,
              "SFreq":SFreq,
          };
          NoTradeBookArray.push(ArrayItem);
      }

      let autoUpdate4 = {
          "AutoUpdateKeyLength":AutoUpdateKeyLength,
          "AutoUpdateDataLength":AutoUpdateDataLength,
          "ProductCode":ProductCode,
          "BoardCode":BoardCode,
          "PreviousPrice":PreviousPrice,
          "NoTradeBook":NoTradeBook,
          "NoTradeBookArray":NoTradeBookArray,
      };
      messageCenter.runCallback("autoUpdate4",autoUpdate4);
    }
    requestAutoUpdate5( subscribe, _productCode, _boardCode) {
      if(this.isOpen && _productCode!=null) {
        let ghLength = 0;
        let ghMessageId = 0x07; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 5; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;
        let NoAutoUpdateKeys = 1; ghLength += 4;    //jumlah parameter
        let ProductCode = _productCode; ghLength += 24; AutoUpdateKeyLength += 24;
        let BoardCode = _boardCode; ghLength += 4; AutoUpdateKeyLength += 4;

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);     position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4;
        bops.copy( bops.from(ProductCode, 'utf8'), buff, position, 0, 24);     position += 24;
        bops.copy( bops.from(BoardCode, 'utf8'), buff, position, 0, 4);        position += 4;

        this.websocket.send(buff);
        tools.logSocket('requestAutoUpdate5 : '+setUnsetFlag+'['+ProductCode+']['+BoardCode+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseAutoUpdate5(dataview:any ,position:number) {
      let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let AutoUpdateDataLength = dataview.getUint32(position); position += 4;
      let NoBrokerBuy = dataview.getUint32(position); position += 4;
      let NoBrokerBuyArray = new Array();
      for (let i = 0; i<NoBrokerBuy; i++)
      {
        let BrokerBuyCode = tools.ab2str(dataview, position,4); position += 4;
        let BrokerBuyFreq = dataview.getUint32(position); position += 4;
        let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
        let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
        let BrokerAvgPrice = dataview.getFloat64(position); position += 8;
        let BrokerBuyFgnFreq = dataview.getUint32(position); position += 4;
        let BrokerBuyFgnLot = tools.getInt64(dataview,position); position += 8;
        let BrokerBuyFgnValue = tools.getInt64(dataview,position); position += 8;
          let BrokerBuyArray = {
              "BrokerBuyCode":BrokerBuyCode,
              "BrokerBuyFreq":BrokerBuyFreq,
              "BrokerBuyLot":BrokerBuyLot,
              "BrokerBuyValue":BrokerBuyValue,
              "BrokerAvgPrice":BrokerAvgPrice,
              "BrokerBuyFgnFreq":BrokerBuyFgnFreq,
              "BrokerBuyFgnLot":BrokerBuyFgnLot,
              "BrokerBuyFgnValue":BrokerBuyFgnValue,
          };
          NoBrokerBuyArray.push(BrokerBuyArray);
      }
      let NoBrokerSell = dataview.getUint32(position); position += 4;
      let NoBrokerSellArray = new Array();
      for (let i = 0; i<NoBrokerSell; i++)
      {
        let BrokerSellCode = tools.ab2str(dataview, position,4); position += 4;
        let BrokerSellFreq = dataview.getUint32(position); position += 4;
        let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
        let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
        let BrokerAvgPrice = dataview.getFloat64(position); position += 8;
        let BrokerSellFgnFreq = dataview.getUint32(position); position += 4;
        let BrokerSellFgnLot = tools.getInt64(dataview,position); position += 8;
        let BrokerSellFgnValue = tools.getInt64(dataview,position); position += 8;
          let BrokerSellArray = {
              "BrokerSellCode":BrokerSellCode,
              "BrokerSellFreq":BrokerSellFreq,
              "BrokerSellLot":BrokerSellLot,
              "BrokerSellValue":BrokerSellValue,
              "BrokerAvgPrice":BrokerAvgPrice,
              "BrokerSellFgnFreq":BrokerSellFgnFreq,
              "BrokerSellFgnLot":BrokerSellFgnLot,
              "BrokerSellFgnValue":BrokerSellFgnValue,
          };
          NoBrokerSellArray.push(BrokerSellArray);
      }

      let autoUpdate5 = {
        "AutoUpdateKeyLength":AutoUpdateKeyLength,
        "AutoUpdateDataLength":AutoUpdateDataLength,
        "ProductCode":ProductCode,
        "BoardCode":BoardCode,
        "NoBrokerBuy":NoBrokerBuy,
        "NoBrokerBuyArray":NoBrokerBuyArray,
        "NoBrokerSell":NoBrokerSell,
        "NoBrokerSellArray":NoBrokerSellArray,
      };
      // tools.logSocket('autoUpdate5');
      // tools.logSocket(autoUpdate5);
      messageCenter.runCallback("autoUpdate5",autoUpdate5);
    }
    
    requestAutoUpdate6(subscribe:any, _brokerCode:any) {
      if(this.isOpen) {
        let ghLength = 0;
        let ghMessageId = 0x06; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 7; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;
        let NoAutoUpdateKeys = 1; ghLength += 4;
        let BrokerCode = _brokerCode; ghLength += 4; AutoUpdateKeyLength += 4;

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);              position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4; 
        bops.copy( bops.from(BrokerCode, 'utf8'), buff, position, 0, 4);                 position += 4; 
        this.websocket.send(buff);
        tools.logSocket('requestAutoUpdate6 : '+setUnsetFlag+'['+BrokerCode+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseAutoUpdate6(dataview:any,position:number) {
      let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
      let BrokerCode = tools.ab2str(dataview, position, 4); position += 4;
      let AutoUpdateDataLength = dataview.getUint32(position); position += 4;
 
      let BrokerBuyFreq = dataview.getUint32(position); position += 4;
      let BrokerBuyVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerBuyLot = tools.getInt64(dataview,position); position += 8;
      let BrokerBuyValue = tools.getInt64(dataview,position); position += 8;
      let BrokerSellFreq = dataview.getUint32(position); position += 4;
      let BrokerSellVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerSellLot = tools.getInt64(dataview,position); position += 8;
      let BrokerSellValue = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignBuyFreq = dataview.getUint32(position); position += 4;
      let BrokerForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignBuyLot = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignBuyValue = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignSellFreq = dataview.getUint32(position); position += 4;
      let BrokerForeignSellVolume = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignSellLot = tools.getInt64(dataview,position); position += 8;
      let BrokerForeignSellValue = tools.getInt64(dataview,position); position += 8;
   
      let autoUpdate6 = {
          "AutoUpdateKeyLength":AutoUpdateKeyLength,
          "AutoUpdateDataLength":AutoUpdateDataLength,
          "BrokerCode":BrokerCode,
          "BrokerBuyFreq":BrokerBuyFreq,
          "BrokerBuyVolume":BrokerBuyVolume,
          "BrokerBuyLot":BrokerBuyLot,
          "BrokerBuyValue":BrokerBuyValue,
          "BrokerSellFreq":BrokerSellFreq,
          "BrokerSellVolume":BrokerSellVolume,
          "BrokerSellLot":BrokerSellLot,
          "BrokerSellValue":BrokerSellValue,
          "BrokerForeignBuyFreq":BrokerForeignBuyFreq,
          "BrokerForeignBuyVolume":BrokerForeignBuyVolume,
          "BrokerForeignBuyLot":BrokerForeignBuyLot,
          "BrokerForeignBuyValue":BrokerForeignBuyValue, 
          "BrokerForeignSellFreq":BrokerForeignSellFreq, 
          "BrokerForeignSellVolume":BrokerForeignSellVolume, 
          "BrokerForeignSellLot":BrokerForeignSellLot, 
          "BrokerForeignSellValue":BrokerForeignSellValue, 
        };
        messageCenter.runCallback("autoUpdate6",autoUpdate6);
    }
    requestAutoUpdate7(subscribe:any, _indicesCode:any) {
      if(this.isOpen) {
        let ghLength = 0;
        let ghMessageId = 0x07; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 7; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;
        let NoAutoUpdateKeys = _indicesCode.length; ghLength += 4;
        for (let i =0; i<NoAutoUpdateKeys; i++)
        {
            ghLength += 12; AutoUpdateKeyLength += 12;
        }

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);              position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4;
        for (let i =0; i<NoAutoUpdateKeys; i++)
        {
            bops.copy( bops.from(_indicesCode[i], 'utf8'), buff, position, 0, 12); position += 12;
        }
        this.websocket.send(buff);
        tools.logSocket('requestAutoUpdate7 : '+setUnsetFlag+'['+_indicesCode+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseAutoUpdate7(dataview:any,position:number) {
      let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
      let IndicesCode = tools.ab2str(dataview, position, 12); position += 12;
      let AutoUpdateDataLength = dataview.getUint32(position); position += 4;
      let PreviousIndices = dataview.getFloat64(position); position += 8;
      let LastIndices = dataview.getFloat64(position); position += 8;
      let OpenIndices = dataview.getFloat64(position); position += 8;
      let HighIndices = dataview.getFloat64(position); position += 8;
      let LowIndices = dataview.getFloat64(position); position += 8;
      let TotalFreq = dataview.getUint32(position); position += 4;
      let TotalVolume = tools.getInt64(dataview,position); position += 8;
      let TotalLot = tools.getInt64(dataview,position); position += 8;
      let TotalValue = tools.getInt64(dataview,position); position += 8;
      let ForeignBuyFreq = dataview.getUint32(position); position += 4;
      let ForeignBuyVolume = tools.getInt64(dataview,position); position += 8;
      let ForeignBuyLot = tools.getInt64(dataview,position); position += 8;
      let ForeignBuyValue = tools.getInt64(dataview,position); position += 8;
      let ForeignSellFreq = dataview.getUint32(position); position += 4;
      let ForeignSellVolume = tools.getInt64(dataview,position); position += 8;
      let ForeignSellLot = tools.getInt64(dataview,position); position += 8;
      let ForeignSellValue = tools.getInt64(dataview,position); position += 8;
      let TotalUpProduct = dataview.getUint32(position); position += 4;
      let TotalDownProduct = dataview.getUint32(position); position += 4;
      let TotalUnchangeProduct = dataview.getUint32(position); position += 4;
      let TotalNoTransactionProduct = dataview.getUint32(position); position += 4;
      let NonRGTotalFreq = dataview.getUint32(position); position += 4;
      let NonRGTotalVolume = tools.getInt64(dataview,position); position += 8;
      let NonRGTotalLot = tools.getInt64(dataview,position); position += 8;
      let NonRGTotalValue = tools.getInt64(dataview,position); position += 8;


      let autoUpdate7 = {
          "AutoUpdateKeyLength":AutoUpdateKeyLength,
          "AutoUpdateDataLength":AutoUpdateDataLength,
          "IndicesCode":IndicesCode,
          "PreviousIndices":PreviousIndices,
          "LastIndices":LastIndices,
          "OpenIndices":OpenIndices,
          "HighIndices":HighIndices,
          "LowIndices":LowIndices,
          "TotalFreq":TotalFreq,
          "TotalVolume":TotalVolume,
          "TotalLot":TotalLot,
          "TotalValue":TotalValue,
          "ForeignBuyFreq":ForeignBuyFreq,
          "ForeignBuyVolume":ForeignBuyVolume,
          "ForeignBuyLot":ForeignBuyLot,
          "ForeignBuyValue":ForeignBuyValue,
          "ForeignSellFreq":ForeignSellFreq,
          "ForeignSellVolume":ForeignSellVolume,
          "ForeignSellLot":ForeignSellLot,
          "ForeignSellValue":ForeignSellValue,
          "TotalUpProduct":TotalUpProduct,
          "TotalDownProduct":TotalDownProduct,
          "TotalUnchangeProduct":TotalUnchangeProduct,
          "TotalNoTransactionProduct":TotalNoTransactionProduct,
          "NonRGTotalFreq":NonRGTotalFreq,
          "NonRGTotalVolume":NonRGTotalVolume,
          "NonRGTotalLot":NonRGTotalLot,
          "NonRGTotalValue":NonRGTotalValue,
        };
        messageCenter.runCallback("autoUpdate7H",autoUpdate7);
        messageCenter.runCallback("autoUpdate7",autoUpdate7);
    }
    requestAutoUpdate51( subscribe, _productCode, _boardCode) {
      if(this.isOpen) {
        let ghLength = 0;
        let ghMessageId = 0x07; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 51; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;
        let NoAutoUpdateKeys = 1; ghLength += 4;    //jumlah parameter
        let ProductCode = _productCode; ghLength += 24; AutoUpdateKeyLength += 24;
        let BoardCode = _boardCode; ghLength += 4; AutoUpdateKeyLength += 4;

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);     position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4;
        bops.copy( bops.from(ProductCode, 'utf8'), buff, position, 0, 24);     position += 24;
        bops.copy( bops.from(BoardCode, 'utf8'), buff, position, 0, 4);        position += 4;

        this.websocket.send(buff);
        tools.logSocket('requestAutoUpdate51 : '+setUnsetFlag+'['+ProductCode+']['+BoardCode+']');

      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseAutoUpdate51(dataview:any ,position:number) {
      let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
      let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
      let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
      let AutoUpdateDataLength = dataview.getUint32(position); position += 4;

      let TradeTime = dataview.getUint32(position); position += 4; //uint 32
      let TradeNo = tools.getInt64(dataview,position); position += 8; //int 64
      let BrokerBuy = tools.ab2str(dataview, position, 4); position += 4; //string
      let BrokerSell = tools.ab2str(dataview, position, 4); position += 4; //string
      let BuyerType = tools.ab2str(dataview, position, 1); position += 1; //string
      let SellerType = tools.ab2str(dataview, position, 1); position += 1; //string
      let Lot = tools.getInt64(dataview,position); position += 8; //int 64
      let Price = dataview.getFloat64(position); position += 8; //double
      let Change = dataview.getFloat64(position); position += 8; //double
      let BuyerOrderNo = tools.getInt64(dataview,position); position += 8; //int 64
      let SellerOrderNo = tools.getInt64(dataview,position); position += 8; //int 64

      let ArrayItem = {
            "TradeTime":TradeTime,
            "TradeNo":TradeNo,
            "BrokerBuy":BrokerBuy,
            "BrokerSell":BrokerSell,
            "BuyerType":BuyerType,
            "SellerType":SellerType,
            "Lot":Lot,
            "Price":Price,
            "Change":Change,
            "BuyerOrderNo":BuyerOrderNo,
            "SellerOrderNo":SellerOrderNo,
        };

      let autoUpdate51 = {
        "AutoUpdateKeyLength":AutoUpdateKeyLength,
        "AutoUpdateDataLength":AutoUpdateDataLength,
        "ProductCode":ProductCode,
        "BoardCode":BoardCode,
        "ArrayItem":ArrayItem,
      };
      // tools.logSocket('autoUpdate51');
      // tools.logSocket(autoUpdate51);
      messageCenter.runCallback("autoUpdate51",autoUpdate51);
    }
    requestAutoUpdate211(subscribe, _account){
        
        let ghLength = 0;
        let ghMessageId = 0x07; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;
        
        //AutoUpdate Header
        let setUnsetFlag = subscribe == 1 ? "S" : "U"; ghLength +=1;
        let AutoUpdateId = 211; ghLength += 2;
        let AutoUpdateKeyLength = 0; ghLength += 2;

        let NoAutoUpdateKeys = 1; ghLength += 4;
        let Account = _account; ghLength += 12; AutoUpdateKeyLength += 12;
        //var OrderId = _orderId; ghLength += 20; AutoUpdateKeyLength += 20;

        //var NoAutoUpdateKeys = _account.length; ghLength += 4;
        //for (var i =0; i<NoAutoUpdateKeys; i++)
        //{
        //    ghLength += 8; AutoUpdateKeyLength += 8;
        // }
        
        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;
        
        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;
        
        bops.copy( bops.from(setUnsetFlag, 'utf8'), buff, position, 0, 1);     position += 1;
        bops.writeUInt16BE(buff, AutoUpdateId, position);                               position += 2;
        bops.writeUInt16BE(buff, AutoUpdateKeyLength, position);                        position += 2;
        bops.writeUInt32BE(buff, NoAutoUpdateKeys, position);                           position += 4;

        bops.copy( bops.from(_account, 'utf8'), buff, position, 0, 12); position += 12;
        //bops.copy( bops.from(_orderId, encoding='utf8'), buff, position, 0, 20); position += 20;
        
        this.websocket.send(buff);
    }
    responseAutoUpdate211(dataview,position){
        //var AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
        //var IndicesCode = ab2str(dataview, position, 12); position += 12;
        //var AutoUpdateDataLength = dataview.getUint32(position); position += 4;

        //var BrokerCode = ab2str(dataview, position, 4); position += 4; //String
        //var StartDate = dataview.getUint32(position); position += 4; //uint 32
        //var TotalValue = getUint64(dataview,position); position += 8; //int64
        //var BuyLot = getUint64(dataview,position); position += 8; //int 64
        //var BuyAveragePrice = dataview.getFloat64(position); position += 8; //double
        //var AdjustedData = ab2str(dataview, position, 1); position += 1; //char

        let AutoUpdateKeyLength = dataview.getUint16(position); position += 2;
        let Account = tools.ab2str(dataview, position, 12); position += 12;
        let OrderId = tools.ab2str(dataview, position, 20); position += 20;
        let AutoUpdateDataLength = dataview.getUint32(position); position += 4;


        let IdxOrderId = tools.ab2str(dataview, position, 15); position += 15;
        let Side = tools.ab2str(dataview, position, 1); position += 1;
        let Product = tools.ab2str(dataview, position, 12); position += 12;
        let Board = tools.ab2str(dataview, position, 3); position += 3;
        let Price = dataview.getUint32(position); position += 4;
        let O = dataview.getUint32(position); position += 4;
        let R = dataview.getUint32(position); position += 4;
        let T = dataview.getUint32(position); position += 4;
        let OrderStatus = tools.ab2str(dataview, position, 1); position += 1;
        let Tif = tools.ab2str(dataview, position, 3); position += 3;
        let OrderDate = dataview.getUint32(position); position += 4;
        let OrderTime = dataview.getUint32(position); position += 4;
        let SentDate = dataview.getUint32(position); position += 4;
        let SentTime = dataview.getUint32(position); position += 4;
        let RejectNote = tools.ab2str(dataview, position, 100); position += 100;

        let UserId = tools.ab2str(dataview, position, 20); position += 20;
        let LastTradeTime = dataview.getUint32(position); position += 4;
        let AvgTradePrice = dataview.getUint32(position); position += 4;
        let CounterPart = tools.ab2str(dataview, position, 12); position += 12;

        let autoUpdate211 = {
            "OrderId":OrderId,
            "IdxOrderId":IdxOrderId,
            "Side":Side,
            "Product":Product,
            "Board":Board,
            "Price":Price,
            "O":O,
            "R":R,
            "T":T,
            "OrderStatus":OrderStatus,
            "Tif":Tif,
            "OrderDate":OrderDate,
            "OrderTime":OrderTime,
            "SentDate":SentDate,
            "SentTime":SentTime,
            "RejectNote":RejectNote,
            "UserId":UserId,
            "LastTradeTime":LastTradeTime,
            "AvgTradePrice":AvgTradePrice,
            "CounterPart":CounterPart,
        };
        messageCenter.runCallback("autoUpdate211",autoUpdate211);
    }

    sendHeartBeat() {
      if(this.websocket)
      {
        if(this.isOpen) {
          tools.logSocket('sendHeartBeat');
          let ghLength = 0;
          let ghMessageId = 0x04;   ghLength += 1;
          let ghMessageFlag = 0x20; ghLength += 1;

          let buff = bops.create(ghLength+4);
          for(let i =0; i< buff.length;i++)
              buff[i] = 0x00;

          let position = 0;
          bops.writeUInt32BE(buff, ghLength, position);   position +=4;
          bops.writeInt8(buff, ghMessageId, position);    position +=1;
          bops.writeInt8(buff, ghMessageFlag, position);  position +=1;
          this.websocket.send(buff);

        }
        else{
          if(this.threadHeartBeat) {
            messageCenter.runCallback('socketStatus', 'disconnect');
            clearInterval(this.threadHeartBeat);
          }
        }
      }
      else{
        if(this.threadHeartBeat) {
          messageCenter.runCallback('socketStatus', 'disconnect');
          clearInterval(this.threadHeartBeat);
        }
      }
    }
    requestRunningTrade(subscribe) {
      if(this.isOpen) {
        let ghLength = 0;
        let ghMessageId = 0x0B; ghLength += 1;
        let ghMessageFlag = 0x20; ghLength += 1;

        let setUnsetRT = subscribe == 1 ? "S" : "U"; ghLength +=1;

        let buff = bops.create(ghLength+4);
        for(let i =0; i< buff.length;i++)
            buff[i] = 0x00;

        let position = 0;
        bops.writeUInt32BE(buff, ghLength, position); position +=4;
        bops.writeInt8(buff, ghMessageId, position); position +=1;
        bops.writeInt8(buff, ghMessageFlag, position); position +=1;

        bops.copy( bops.from(setUnsetRT, 'utf8'), buff, position, 0, 1); position +=1;
        this.websocket.send(buff);
        tools.logSocket('requestRunningTrade['+subscribe+']');
      }
      else{
        messageCenter.runCallback('socketStatus', 'disconnect');
      }
    }
    responseRunningTrade(dataview:any,position:number) {
        let ArrayNo = dataview.getUint32(position); position += 4;
        let ArrayNoArray = new Array();
        for(let i=0; i< ArrayNo;i++){
            let TradeTime = dataview.getUint32(position); position += 4;
            let ProductCode = tools.ab2str(dataview, position, 24); position += 24;
            let BoardCode = tools.ab2str(dataview, position, 4); position += 4;
            let BrokerBuy = tools.ab2str(dataview, position, 4); position += 4;
            let BrokerSell = tools.ab2str(dataview, position, 4); position += 4;
            let BuyerType = String.fromCharCode(dataview.getUint8(position)); position += 1;
            let SellerType = String.fromCharCode(dataview.getUint8(position)); position += 1;
            let Lot = tools.getInt64(dataview,position); position += 8;
            let Price = dataview.getFloat64(position); position += 8;
            let Change = dataview.getFloat64(position); position += 8;
            let Average = dataview.getFloat64(position); position += 8;
            let execute = String.fromCharCode(dataview.getUint8(position)); position += 1;
            let PreviousPrice = Price-Change;
            let ChangePercent = (Change/PreviousPrice) *100;

            let arrayNoItem = {
                "TradeTime":TradeTime,
                "ProductCode":ProductCode,
                "BoardCode":BoardCode,
                "BrokerBuy":BrokerBuy,
                "BrokerSell":BrokerSell,
                "BuyerType":BuyerType,
                "SellerType":SellerType,
                "Lot":Lot,
                "Price":Price,
                "Change":Change,
                "ChangePercent":ChangePercent,
                "Average":Average,
                "Execute":execute,
            }
            ArrayNoArray.push(arrayNoItem);
        }
        let viewRT = {
            "ArrayNo":ArrayNo,
            "ArrayNoArray":ArrayNoArray,
        }
        messageCenter.runCallback("runningTrade",viewRT);
    }
    responseForceKill(dataview:any,position:number) {
      let killMessage = tools.ab2str(dataview, position, 128); position += 128;

      let response = {
          "KillMessage":killMessage,
      }      
      messageCenter.runCallback("forceKill",response);
    }
}
