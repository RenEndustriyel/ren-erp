import "./SaleSummary.css";


function SaleSummary({
items,
discount,
setDiscount
}){


const subTotal =

items.reduce(

(sum,item)=>

sum +

(Number(item.salePrice) *
Number(item.quantity)),

0

);



const totalProfit =

items.reduce(

(sum,item)=>

sum +

(
(Number(item.salePrice) -
Number(item.purchasePrice))
*
Number(item.quantity)
),

0

);



const discountAmount =
Number(discount || 0);



const grandTotal =
subTotal - discountAmount;



return(

<div className="sale-summary">


<div className="summary-row">

<span>
Ara Toplam
</span>

<strong>

{subTotal.toLocaleString("tr-TR")} TL

</strong>

</div>



<div className="summary-row profit">

<span>
Tahmini Kâr
</span>

<strong>

{totalProfit.toLocaleString("tr-TR")} TL

</strong>

</div>



<div className="discount-box">


<label>

İskonto

</label>


<input

type="number"

min="0"

value={discount}

onChange={
e=>setDiscount(e.target.value)
}

/>


</div>



<div className="grand-total">


<span>
Genel Toplam
</span>


<h2>

{grandTotal.toLocaleString("tr-TR")} TL

</h2>


</div>


</div>

);


}


export default SaleSummary;