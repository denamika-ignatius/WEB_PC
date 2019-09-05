import * as bops from 'bops';
//import * as global from '../service/global';

var setting_CharacterForDecimalSeparator = ".";
var setting_CharacterForThousandSeparator = ",";

export class tools{
  constructor(){

  }
}
export function ab2str(buf, position, length) {
//   let dataview = new jDataView(buf.buffer, position, length);
//   return dataview.getString(length, 0).replace(/\0/g, '');
    let text="";
    let end=position+length;
    while (position < end){

        let val = buf.getUint8(position++); 
        if (val == 0) break;
        text += String.fromCharCode(val);
    } 
    return text;
}
export function logSocket(_mesg){
}
export function logDebug(_mesg){
}

export function getInt64(dataview,position)
{
    let isMinus = dataview.getInt32(position);
    if(isMinus<0)
    {
        let totalLot2 = dataview.getInt32(position); position += 4;
        let totalLot1 = dataview.getUint32(position); position += 4;

        let totalLot = 0;
        if(totalLot2 <= -1) {

            totalLot = Number((totalLot2 * 4294967295)) + Number(totalLot1);
        }
        else
        {
            totalLot = totalLot1;
        }
        return totalLot;
    }
    else
    {
        let totalLot2 = dataview.getUint32(position); position += 4;
        let totalLot1 = dataview.getUint32(position); position += 4;
        let totalLot = 0;
        if(totalLot2 > 0) {

            totalLot = Number((totalLot2 * 4294967295)) + Number(totalLot1);
        }
        else
        {
            totalLot = totalLot1;
        }
        return totalLot;
    }
}
export function numberFormat(value, fixed)
{ 
  if(value=="Infinity") return "0"; 
    let result = "";
    if(fixed > -1)
        value = parseFloat(value).toFixed(fixed);
    let tmp = value.toString().split(".");
    let count =0;
    for(let i= tmp[0].length-1; i >=0;i--)
    {
        if(count>=3 && tmp[0].charAt(i).toString()!="-")
        {
            result = setting_CharacterForThousandSeparator + result;
            count=0;
        }
        result = tmp[0].charAt(i).toString() + result;
        count++;
    }
    if(tmp.length> 1)
        result += setting_CharacterForDecimalSeparator + tmp[1].toString();

    return result;
}
export function numberFormatRemoveEmpty(value, fixed)
{ 
  if(value=="Infinity") return "0";
  if(value==" ") return "";
    let result = "";
    if(fixed > -1)
        value = parseFloat(value).toFixed(fixed);
    let tmp = value.toString().split(".");
    let count =0;
    for(let i= tmp[0].length-1; i >=0;i--)
    {
        if(count>=3 && tmp[0].charAt(i).toString()!="-")
        {
            result = setting_CharacterForThousandSeparator + result;
            count=0;
        }
        result = tmp[0].charAt(i).toString() + result;
        count++;
    }
    if(tmp.length> 1)
        result += setting_CharacterForDecimalSeparator + tmp[1].toString();

    return result;
}
export function numberSignFormat(value, fixed)
{
  if(value=="x") return"";
  if(value=="Infinity") return "0";
    var result = "";
    if(fixed > -1)
        value = parseFloat(value).toFixed(fixed);
    else if(fixed==2)
        value = value.toFixed(2);
    var tmp = value.toString().split(".");
    var count =0;
    for(var i = tmp[0].length-1; i >=0;i--)
    {
        if(count>=3 && tmp[0].charAt(i).toString()!="-")
        {
            result = setting_CharacterForThousandSeparator + result;
            count=0;
        }
        result = tmp[0].charAt(i).toString() + result;
        count++;
    }
    if(tmp.length> 1)
        result += setting_CharacterForDecimalSeparator + tmp[1].toString();

    if(value==0) {}
    else if(value>0){ result = '+'+result}
    else if(value<0){}
    

    return result;
}
export function kmbtFormat(value, fixed)
{
    let result;
    let unit = "";
    let isMinus = false;
    if(value < 0) isMinus = true;
    value = Math.abs(value);
    if(value > 1000000000000){
        result = (value / 1000000000000);
        unit = " T";
    }
    else if(value > 1000000000){
        result = (value / 1000000000);
        unit = " B";
        }
    else if(value > 1000000){
        result = (value / 1000000);
        unit = " M";
        }
    else if(value > 1000){
        result = (value / 1000);
        unit = " K";
        }
    else {
        result = value;
        unit = "";
        if(isMinus) result=result*-1;

        let tmp = numberFormat(result, 0);
        return  tmp + unit;
    }
    if(isMinus) result=result*-1;

    let tmp = numberFormat(result, fixed);
    return  tmp + unit;
}
export function dateFormat(value,style)
{
  if (style=="YYYY-mm-DD")  {
    let result = "";
    let temp = value;
    result = temp.toString().charAt(0)+
    temp.toString().charAt(1)+
    temp.toString().charAt(2)+
    temp.toString().charAt(3)+
    "-"+
    temp.toString().charAt(4)+
    temp.toString().charAt(5)+
    "-"+
    temp.toString().charAt(6)+
    temp.toString().charAt(7);
    return result;
  }
  else if (style=="DD-mm-YYYY-") {
    let result = "";
    let temp = value;
    result = temp.toString().charAt(8)+
    temp.toString().charAt(9)+
    "-"+
    temp.toString().charAt(5)+
    temp.toString().charAt(6)+
    "-"+
    temp.toString().charAt(0)+
    temp.toString().charAt(1)+
    temp.toString().charAt(2)+
    temp.toString().charAt(3);
    return result;
  }else if (style=="DD-mm-YYYY") {
    let result = "";
    let temp = value;
    result = temp.toString().charAt(6)+
    temp.toString().charAt(7)+
    "-"+
    temp.toString().charAt(4)+
    temp.toString().charAt(5)+
    "-"+
    temp.toString().charAt(0)+
    temp.toString().charAt(1)+
    temp.toString().charAt(2)+
    temp.toString().charAt(3);
    return result;
  }else if (style=="DD/mm/YYYY") {
    let result = "";
    let temp = value;
    result = temp.toString().charAt(6)+
    temp.toString().charAt(7)+
    "/"+
    temp.toString().charAt(4)+
    temp.toString().charAt(5)+
    "/"+
    temp.toString().charAt(0)+
    temp.toString().charAt(1)+
    temp.toString().charAt(2)+
    temp.toString().charAt(3);
    return result;
  }
  else if (style=="YYYYmmDD") {
		let result = "";
		let temp = value;
		result = temp.toString().charAt(0)+
			temp.toString().charAt(1)+
			temp.toString().charAt(2)+
			temp.toString().charAt(3)+
			temp.toString().charAt(5)+
			temp.toString().charAt(6)+
			temp.toString().charAt(8)+
			temp.toString().charAt(9);
		return result;
	}
	else if (style=="YYmD") {
		let result = "";
		let temp = value;
		result = temp.toString().charAt(0)+
			temp.toString().charAt(1)+
			temp.toString().charAt(2)+
			temp.toString().charAt(3)+
			temp.toString().charAt(4)+
			temp.toString().charAt(5)+
			temp.toString().charAt(6)+
			temp.toString().charAt(7);
	}
  return value;
}
export function timeFormat(value)
{
    if(value==0) return "00:00:00";
    let result = "";
    let temp = value+1000000;
    result = temp.toString().charAt(1)+temp.toString().charAt(2)+":"+
    temp.toString().charAt(3)+temp.toString().charAt(4)+":"+
    temp.toString().charAt(5)+temp.toString().charAt(6);
    return result;
}
export function currentDate() {

    let d = new Date();
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
export function minDate() {
    
        let d = new Date();
        d.setMonth(d.getMonth()-1);
        let month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
    
        return [year, month, day].join('-');
    }
export function currentDateModify(value) {
    let date = new Date();
    let d = new Date();
    if(value!=""){
      d = new Date(date.getTime() + value * 24 * 60 * 60 * 1000);
    }

    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
export function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
export function pretifyVersion(_input) {
    let temp = _input.split(".");
    let a = parseInt(temp[0], 10);
    let b = parseInt(temp[1], 10);
    let c = parseInt(temp[2], 10);
    return a+"."+b+"."+c;
}
export function befoterMonths(date, months) {
    date.setMonth(date.getMonth() + months);
    
    let ddDatemonth = date.getDate()+1;
    let mmDatemonth = date.getMonth()+1;        
    let yyyyDatemonth = date.getFullYear();

    if(ddDatemonth<10){
        ddDatemonth='0'+ddDatemonth
    } 
    if(mmDatemonth<10){
        mmDatemonth='0'+mmDatemonth
    } 
    let Datemonth = yyyyDatemonth+''+mmDatemonth+''+ddDatemonth; 
    

    return Datemonth;
}
export function getBeforeDate(value) {
    let date = new Date();
    date.setDate(date.getDate()-value);

    let mmDateNow:any = date.getMonth()+1;        
    let fdate:any = date.getDate();

    if(fdate<10){
        fdate='0'+fdate;
    } 

    if(mmDateNow<10){
        mmDateNow='0'+mmDateNow;
    } 

    return date.getFullYear() + '' + mmDateNow + '' + fdate;
}
export function dateStyle(date,style){
    date = date+'';
    let y = date.substr(0, 4);
    let m = date.substr(4, 2);
    let d = date.substr(6, 2);

    let mm = "";
    mm = mountName(m).substr(0,3);
    let mmm = "";
    mmm = mountShortName(m).substr(0,3);
    
    if(style==1){
        return d+" "+mm+" "+y;
    }
    else if(style==2){
        return d+"/"+m+"/"+y;
    }
    else if(style==3){
        y = y.substr(2,2);
        return d+"/"+m+"/"+y;
    }
    else if(style==4){ 
        return d+"-"+mmm+"-"+y;
    }
    else if(style==5){ 
        return d+" "+mmm+" "+y;
    }
}

export function mountName(value){
    let m = value;
    let mm = '';
    if(m=="01"){
        mm="January";
        }
    else if(m=="02"){
        mm="February";
    }
    else if(m=="03"){
        mm="March";
    }
    else if(m=="04"){
        mm="April";
    }
    else if(m=="05"){
        mm="May";
    }
    else if(m=="06"){
        mm="June";
    }
    else if(m=="07"){
        mm="July";
    }
    else if(m=="08"){
        mm="August";
    }
    else if(m=="09"){
        mm="September";
    }
    else if(m=="10"){
        mm="October";
    }
    else if(m=="11"){
        mm="November";
    }
    else if(m=="12"){
        mm="Desember";
    }
    return mm;
}
export function mountShortName(value){
    let m = value;
    let mm = '';
    if(m=="01"){
        mm="January";
        }
    else if(m=="02"){
        mm="Febuary";
    }
    else if(m=="03"){
        mm="March";
    }
    else if(m=="04"){
        mm="April";
    }
    else if(m=="05"){
        mm="May";
    }
    else if(m=="06"){
        mm="June";
    }
    else if(m=="07"){
        mm="July";
    }
    else if(m=="08"){
        mm="August";
    }
    else if(m=="09"){
        mm="September";
    }
    else if(m=="10"){
        mm="October";
    }
    else if(m=="11"){
        mm="November";
    }
    else if(m=="12"){
        mm="Desember";
    }
    return mm;
}

export function getDetik(value){
    if(value==0) return 0;
    let result = "";
    let temp = value+1000000;
    result = temp.toString().charAt(5)+temp.toString().charAt(6);
    return parseInt(result);
}
export function getMenit(value){
    if(value==0) return 0;
    let result = "";
    let temp = value+1000000;
    result = temp.toString().charAt(3)+temp.toString().charAt(4);
    return parseInt(result);
}
export function getJam(value){
    if(value==0) return 0;
    let result = "";
    let temp = value+1000000;
    result = temp.toString().charAt(1)+temp.toString().charAt(2);
    return parseInt(result);
}
export function combineWaktu(_detik,_menit,_jam){
    let result = "1000000";
    let jam = 100+_jam;
    let menit = 100+_menit;
    let detik = 100+_detik;
    
    result = setCharAt(result.toString(),1,jam.toString().charAt(1));
    result = setCharAt(result.toString(),2,jam.toString().charAt(2));
    result = setCharAt(result.toString(),3,menit.toString().charAt(1));
    result = setCharAt(result.toString(),4,menit.toString().charAt(2));
    result = setCharAt(result.toString(),5,detik.toString().charAt(1));
    result = setCharAt(result.toString(),6,detik.toString().charAt(2));    
    
    return parseInt(result)-1000000;
}
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}
export function trusDateFromDateTime(value) {

    let d = new Date();
    if(value!=""){
      d = new Date(value);
    }

    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
export function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};
export function setBrokerTypeColor(_input){
    if(_input=="D") return "f-green";
    else if(_input=="F") return "f-yellow" ;
    else return "f-blue";
} 

export function setExecuteBS(_input){
    if(_input=="B") return "f-red";
    else if(_input=="S") return "f-green" ;
    else return "f-blue";
} 
