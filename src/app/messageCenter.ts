export let listMessages: Array<{id:string, callback:any}> = new Array();


export function addRespone(id:string, callback:(ev: Event)=> any){
    var exist:boolean = false;
    // for(let item of listMessages){
    //     if(item.id == id){
    //         exist = true;
    //         break;
    //     }
    // }
    if(!exist){
        listMessages.push({id:id, callback: callback});
    }
}

export function delRespone(id:string){
    for(let item of listMessages){
        if(item.id == id){
            var index = listMessages.indexOf(item);   //get index of item
            listMessages.splice(index, 1);
            break;
        }
    }
}
export function delAllRespone(){
    
    while(listMessages.length > 0){
        listMessages.pop();
    }
    //this.messageCenter = [];
}

export function runCallback(id:string, obj:any){
    rCb(id,obj);
}
async function rCb(id:string, obj:any){
    for(let item of listMessages){
        if(item.id == id){
            item.callback(obj);
            // break;
        }
    }
}
