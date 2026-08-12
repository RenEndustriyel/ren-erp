import "./SaleTable.css";


function SaleTable({
items,
setItems
}){


function changeQuantity(id,value){


setItems(

items.map(item=>

item.id===id

?

{

...item,

quantity:Number(value),

total:
Number(value) *
Number(item.salePrice)

}

:

item

)

);


}



function removeItem(id){


setItems(

items.filter(
item=>item.id!==id
)

);


}



return(

<div className="sale-table-box">


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
Alış
</th>

<th>
Satış
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

items.length===0

?

<tr>

<td colSpan="6" className="empty">

Ürün eklenmedi

</td>

</tr>


:

items.map(item=>(

<tr key={item.id}>


<td>

<strong>
{item.name}
</strong>

</td>


<td>


<input

type="number"

min="1"

value={item.quantity}

onChange={
e=>
changeQuantity(
item.id,
e.target.value
)
}

/>


</td>



<td>

{item.purchasePrice} TL

</td>



<td>

{item.salePrice} TL

</td>



<td>

<strong>

{item.total.toLocaleString("tr-TR")} TL

</strong>

</td>



<td>


<button

className="remove-btn"

onClick={()=>
removeItem(item.id)
}

>

Sil

</button>


</td>



</tr>

))


}



</tbody>


</table>


</div>


);


}


export default SaleTable;