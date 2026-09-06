export function calculateEMA(data,period){

if(data.length===0)return[];

const k=2/(period+1);

let ema=data[0].close;

return data.map(c=>{

ema=c.close*k+ema*(1-k);

return{
time:c.time,
value:ema
};

});

}