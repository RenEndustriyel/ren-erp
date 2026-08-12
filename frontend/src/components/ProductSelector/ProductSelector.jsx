import { useState } from "react";
import products from "../../data/products";


function ProductSelector({onAdd}){


const [selectedProduct,setSelectedProduct]=useState("");

const [quantity,setQuantity]=useState(1);



function addProduct(){


const product = products.find(

p=>p.id===Number(selectedProduct)

);



if(!product){

alert("Ürün seçiniz");

return;

}



onAdd({

id:Date.now(),

productId:product.id,

name:product.name,

quantity:Number(quantity),

salePrice:Number(product.salePrice),

purchasePrice:Number(product.purchasePrice),

total:
Number(product.salePrice) *
Number(quantity)

});



setSelectedProduct("");

setQuantity(1);


}



return(

<div className="product-selector">


<select

value={selectedProduct}

onChange={
e=>setSelectedProduct(e.target.value)
}

>


<option value="">

📦 Ürün seçiniz

</option>



{

products.map(product=>(

<option

key={product.id}

value={product.id}

>

{product.name} | Stok:{product.stock} | {product.salePrice} TL

</option>


))

}


</select>



<input

type="number"

min="1"

value={quantity}

onChange={
e=>setQuantity(e.target.value)
}

/>



<button onClick={addProduct}>

+ Ürün Ekle

</button>


</div>

);


}


export default ProductSelector;