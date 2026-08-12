import { useState, useEffect, useRef } from "react";

import "./CustomerSelect.css";


function CustomerSelect({onSelect, onChange}){


const [customers,setCustomers] = useState([]);

const [search,setSearch] = useState("");

const [open,setOpen] = useState(false);

const boxRef = useRef();





useEffect(()=>{


const data = JSON.parse(

localStorage.getItem("customers")

)

||


[];



setCustomers(data);



},[]);







useEffect(()=>{


function handleClickOutside(e){


if(

boxRef.current &&

!boxRef.current.contains(e.target)

){


setOpen(false);


}


}



document.addEventListener(

"mousedown",

handleClickOutside

);



return()=>{


document.removeEventListener(

"mousedown",

handleClickOutside

);



};



},[]);







const customerList = customers.filter(item=>

item.type === "Müşteri"

||

item.type === "Her İkisi"

);








const filtered = customerList.filter(item=>

item.name

.toLowerCase()

.includes(

search.toLowerCase()

)

);








function selectCustomer(item){


setSearch(item.name);


setOpen(false);




if(onSelect){

onSelect(item);

}



if(onChange){

onChange(item);

}



}








return(


<div

className="customer-select"

ref={boxRef}

>



<input

type="text"

placeholder="Müşteri ara..."

value={search}

onFocus={()=>setOpen(true)}

onChange={(e)=>{


setSearch(e.target.value);

setOpen(true);


}}


/>







{

open &&


<div className="customer-list">


{


filtered.map(item=>(


<div

key={item.id}

className="customer-item"

onClick={()=>selectCustomer(item)}

>


{item.name}


</div>


))


}





{

filtered.length===0 &&

<div className="customer-item">

Müşteri bulunamadı

</div>


}





</div>


}



</div>


);


}



export default CustomerSelect;