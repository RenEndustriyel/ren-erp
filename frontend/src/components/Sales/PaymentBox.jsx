import "./PaymentBox.css";

function PaymentBox({
paymentType,
setPaymentType,
onSave
}){


return(

<div className="payment-box">


<h3>
Ödeme
</h3>



<div className="payment-options">


<label>

<input

type="radio"

value="Nakit"

checked={paymentType==="Nakit"}

onChange={
e=>setPaymentType(e.target.value)
}

/>

💵 Nakit

</label>



<label>

<input

type="radio"

value="Kart"

checked={paymentType==="Kart"}

onChange={
e=>setPaymentType(e.target.value)
}

/>

💳 Kart

</label>




<label>

<input

type="radio"

value="Havale"

checked={paymentType==="Havale"}

onChange={
e=>setPaymentType(e.target.value)
}

/>

🏦 Havale

</label>


</div>



<button

className="save-sale-btn"

onClick={onSave}

>

🧾 Satışı Kaydet

</button>


</div>

);


}


export default PaymentBox;