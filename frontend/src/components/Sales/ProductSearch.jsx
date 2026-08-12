import { useState, useRef, useEffect } from "react";
import products from "../../data/products";
import "./ProductSearch.css";


function ProductSearch({onAdd}){


const [search,setSearch]=useState("");

const [quantity,setQuantity]=useState(1);

const [open,setOpen]=useState(false);

const boxRef=useRef();




useEffect(()=>{


function close(e){


if(
boxRef.current &&
!boxRef.current.contains(e.target)

){

setOpen(false);

}


}



document.addEventListener(
"mousedown",
close
);



return()=>{

document.removeEventListener(
"mousedown",
close
);

};


},[]);






const filtered =

products.filter(item=>{


const text =
search.toLowerCase();



return(

item.name
.toLowerCase()
.includes(text)

||

String(item.barcode || "")
.includes(search)

);


}).slice(0,10);







function addProduct(product){


onAdd({

id:Date.now(),

productId:product.id,

barcode:product.barcode,

name:product.name,

quantity:Number(quantity),

purchasePrice:Number(product.purchasePrice),

salePrice:Number(product.salePrice),

total:
Number(quantity) *
Number(product.salePrice)


});



setSearch("");

setQuantity(1);

setOpen(false);


}






function barcodeEnter(e){


if(e.key==="Enter"){


const product=

products.find(item=>

String(item.barcode)
===String(search)

);



if(product){

addProduct(product);

}


}


}






return(


<div
className="product-search"
ref={boxRef}
>



<div className="search-row">


<input


placeholder="Ürün ara veya barkod okut..."


value={search}


onFocus={()=>setOpen(true)}


onChange={(e)=>{


setSearch(e.target.value);

setOpen(true);


}}


onKeyDown={barcodeEnter}


/>




<input


type="number"


min="1"


value={quantity}


onChange={
e=>setQuantity(e.target.value)
}


/>


</div>






{

open && (


<div className="product-results">


{

filtered.map(product=>(


<div

key={product.id}

className="product-result"

onClick={()=>
addProduct(product)
}

>


<div>

<strong>
{product.name}
</strong>


<span>

Stok:
{product.stock}

</span>


</div>



<b>

{Number(product.salePrice)
.toLocaleString("tr-TR")} TL

</b>



</div>


))


}



{

filtered.length===0 &&

<div className="no-result">

Ürün bulunamadı

</div>

}



</div>


)


}



</div>


);


}


export default ProductSearch;