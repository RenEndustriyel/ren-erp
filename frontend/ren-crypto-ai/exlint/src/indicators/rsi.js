export function calculateRSI(data,period=14){

if(data.length<period+1)return 50;

let gains=0;
let losses=0;

for(let i=data.length-period;i<data.length;i++){

const diff=data[i].close-data[i-1].close;

if(diff>0)gains+=diff;
else losses-=diff;

}

const rs=gains/(losses||1);

return 100-100/(1+rs);

}