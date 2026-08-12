import "./InvoiceTable.css";


function InvoiceTable({
items,
setItems,
removeProduct,
type="sale"
}){


function updateItem(id,field,value){


setItems(

items.map(item=>{


if(item.id===id){


const updated={

...item,

[field]:Number(value)

};


updated.total =

(
type==="purchase"
?
updated.purchasePrice
:
updated.salePrice
)

*

updated.quantity;


return updated;


}


return item;


})

);


}



return(

<table>


<thead>

<tr>

<th>
Ürün
</th>

<th>
Adet
</th>

<th>
Fiyat
</th>

<th>
Toplam
</th>

<th>
Sil
</th>

</tr>

</thead>


<tbody>


{

items.map(item=>(


<tr key={item.id}>


<td>

{item.name}

</td>


<td>

<input

type="number"

value={item.quantity}

onChange={
e=>
updateItem(
item.id,
"quantity",
e.target.value
)

}

/>

</td>


<td>

<input

type="number"

value={
type==="purchase"
?
item.purchasePrice
:
item.salePrice
}

onChange={
e=>
updateItem(

item.id,

type==="purchase"
?
"purchasePrice"
:
"salePrice",

e.target.value

)

}

/>

</td>


<td>

{item.total.toLocaleString("tr-TR")} TL

</td>


<td>

<button

onClick={()=>removeProduct(item.id)}

>

X

</button>

</td>


</tr>


))

}


</tbody>


</table>

);


}


export default InvoiceTable;