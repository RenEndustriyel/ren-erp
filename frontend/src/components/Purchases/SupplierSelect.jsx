import { useState, useEffect, useRef } from "react";
import "./SupplierSelect.css";


function SupplierSelect({onChange}){


const [customers,setCustomers]=useState([]);

const [search,setSearch]=useState("");

const [open,setOpen]=useState(false);

const boxRef = useRef();





useEffect(()=>{


const data =

JSON.parse(

localStorage.getItem("customers")

)

||


[];


setCustomers(data);



},[]);







useEffect(()=>{


function handleClick(e){


if(

boxRef.current &&

!boxRef.current.contains(e.target)

){

setOpen(false);

}


}



document.addEventListener(

"mousedown",

handleClick

);



return()=>{

document.removeEventListener(

"mousedown",

handleClick

);


};


},[]);







const suppliers = customers.filter(item=>

item.type==="Tedarikçi"

||

item.type==="Her İkisi"

);






const filtered = suppliers.filter(item=>

item.name

.toLowerCase()

.includes(

search.toLowerCase()

)

);







function select(item){


setSearch(item.name);


setOpen(false);


onChange(item);


}







return(


<div

className="supplier-select"

ref={boxRef}

>



<input

placeholder="Tedarikçi ara..."

value={search}

onFocus={()=>setOpen(true)}

onChange={(e)=>{


setSearch(e.target.value);

setOpen(true);


}}


/>





{

open &&


<div className="supplier-list">


{

filtered.map(item=>(


<div

key={item.id}

className="supplier-item"

onClick={()=>select(item)}

>


{item.name}


</div>


))


}



{

filtered.length===0 &&

<div className="supplier-item">

Cari bulunamadı

</div>


}



</div>


}




</div>


);


}


export default SupplierSelect;