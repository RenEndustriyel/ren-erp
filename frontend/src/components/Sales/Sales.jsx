import { useEffect, useMemo, useRef, useState } from "react";

import {
  MdAccessTime,
  MdAdd,
  MdDelete,
  MdPayments,
  MdPerson,
  MdPointOfSale,
  MdQrCodeScanner,
  MdRemove,
  MdShoppingCart,
} from "react-icons/md";

import "./Sales.css";

export default function Sales() {

  const inputRef = useRef(null);

  /* --------------------------
     STATE
  -------------------------- */

  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [cart, setCart] = useState([]);

  const [selectedRow, setSelectedRow] =
    useState(0);

  const [paymentType, setPaymentType] =
    useState("Nakit");

  const customer = {
    id: 0,
    code: "PRK0001",
    name: "PERAKENDE MÜŞTERİ",
  };

  /* --------------------------
     ÜRÜNLER
  -------------------------- */

  useEffect(() => {

    const data =
  JSON.parse(
    localStorage.getItem("ren_products")
  ) || [];

setProducts(data);

    setProducts(data);

  }, []);

  /* --------------------------
     ODAK
  -------------------------- */

  useEffect(() => {

    inputRef.current?.focus();

  }, []);

 
  /* --------------------------
     FİLTRE
  -------------------------- */

  const filteredProducts = useMemo(() => {

    if (!search.trim()) return products;

    return products.filter((product) => {

      const name =
        (product.name || "")
          .toLowerCase();

      const barcode =
        product.barcode || "";

      return (
        name.includes(
          search.toLowerCase()
        ) ||
        barcode.includes(search)
      );

    });

  }, [products, search]);

  /* --------------------------
     SEPETE EKLE
  -------------------------- */

  const addToCart = (product) => {

    if (!product) return;

    setCart((prev) => {

      const exist =
        prev.find(
          (item) =>
            item.id === product.id
        );

      if (exist) {

        return prev.map((item) =>

          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item

        );

      }

      return [

        ...prev,

        {
          ...product,
          quantity: 1,
        },

      ];

    });

    setSearch("");

    setSelectedRow(0);

    inputRef.current?.focus();

  };
    /* --------------------------
     ADET ARTIR
  -------------------------- */

  const increaseQuantity = (id) => {

    setCart((prev) =>

      prev.map((item) =>

        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item

      )

    );

  };



  /* --------------------------
     ADET AZALT
  -------------------------- */

  const decreaseQuantity = (id) => {

    setCart((prev) =>

      prev
        .map((item) =>

          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item

        )
        .filter(
          (item) => item.quantity > 0
        )

    );

  };



  /* --------------------------
     SATIR SİL
  -------------------------- */

  const removeItem = (id) => {

    setCart((prev) =>

      prev.filter(
        (item) => item.id !== id
      )

    );

  };



  /* --------------------------
     TOPLAM
  -------------------------- */

  const total = useMemo(() => {

    return cart.reduce(

      (sum, item) =>

        sum +
        Number(item.sale) *
        Number(item.quantity),

      0

    );

  }, [cart]);



  /* --------------------------
     TOPLAM ÜRÜN
  -------------------------- */

  const totalQuantity = useMemo(() => {

    return cart.reduce(

      (sum, item) =>

        sum + Number(item.quantity),

      0

    );

  }, [cart]);



  /* --------------------------
     TARİH
  -------------------------- */

  const date = new Date().toLocaleString(
    "tr-TR"
  );

    /* --------------------------
     KLAVYE KISAYOLLARI
  -------------------------- */

  useEffect(() => {

    const handleKeyDown = (e) => {

      // ENTER
      if (e.key === "Enter") {

        e.preventDefault();

        if (filteredProducts.length > 0) {

          addToCart(
            filteredProducts[selectedRow]
          );

        }

      }

      // AŞAĞI OK
      if (e.key === "ArrowDown") {

        e.preventDefault();

        setSelectedRow((prev) =>

          prev < filteredProducts.length - 1
            ? prev + 1
            : prev

        );

      }

      // YUKARI OK
      if (e.key === "ArrowUp") {

        e.preventDefault();

        setSelectedRow((prev) =>

          prev > 0
            ? prev - 1
            : 0

        );

      }

      // ESC
      if (e.key === "Escape") {

        e.preventDefault();

        setSearch("");

        setSelectedRow(0);

        inputRef.current?.focus();

      }

      // DELETE
      if (e.key === "Delete") {

        if (cart.length > 0) {

          removeItem(
            cart[cart.length - 1].id
          );

        }

      }

      // F9
      if (e.key === "F9") {

        e.preventDefault();

        if (cart.length === 0) {

          alert("Sepet boş.");

          return;

        }

        const sale = {

          id: Date.now(),

          customer,

          paymentType,

          items: cart,

          total,

          totalQuantity,

          date: new Date().toISOString(),

        };

        console.log("SATIŞ", sale);

        // Burada ileride API veya localStorage kullanılacak

        setCart([]);

        setSearch("");

        setSelectedRow(0);

        inputRef.current?.focus();

        alert("Satış tamamlandı.");

      }

    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [
    filteredProducts,
    selectedRow,
    cart,
    paymentType,
    total,
    totalQuantity
  ]);

    return (
    <div className="sales-page">

      <div className="sales-header">

        <div className="header-left">

          <h2>
            <MdPointOfSale />
            REN ERP Hızlı Satış
          </h2>

          <p>
            Barkod okutun veya ürün arayın
          </p>

        </div>

        <div className="header-right">

          <div className="info-card">

            <MdPerson />

            <div>

              <small>Müşteri</small>

              <strong>
                {customer.name}
              </strong>

            </div>

          </div>

          <div className="info-card">

            <MdAccessTime />

            <div>

              <small>Tarih</small>

              <strong>
                {date}
              </strong>

            </div>

          </div>

          <div className="info-card">

            <MdShoppingCart />

            <div>

              <small>Ürün</small>

              <strong>
                {totalQuantity}
              </strong>

            </div>

          </div>

          <div className="info-card">

            <MdPayments />

            <div>

              <small>Toplam</small>

              <strong>

                {total.toLocaleString("tr-TR")} ₺

              </strong>

            </div>

          </div>

        </div>

      </div>

      <div className="sales-container">

        <div className="product-panel">

          <div className="search-box">

            <MdQrCodeScanner />

            <input
              ref={inputRef}
              type="text"
              value={search}
              placeholder="Barkod okutun..."
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <div className="product-list">

            {filteredProducts.map((product, index) => (

              <div
                key={product.id}
                className={
                  selectedRow === index
                    ? "product-card active"
                    : "product-card"
                }
                onDoubleClick={() =>
                  addToCart(product)
                }
              >

                <div>

                  <strong>
                    {product.name}
                  </strong>

                  <small>
                    {product.barcode}
                  </small>

                </div>

                <div>

                  <strong>

                    {Number(product.sale).toLocaleString("tr-TR")} ₺

                  </strong>

                  <small>

                    Stok : {product.stock}

                  </small>

                </div>

              </div>

            ))}

          </div>

        </div>
                <div className="cart-panel">

          <div className="cart-header">

            <h3>

              <MdShoppingCart />

              Satış Sepeti

            </h3>

          </div>

          <div className="cart-list">

            {

              cart.length === 0 ? (

                <div className="empty-cart">

                  <p>

                    Henüz ürün eklenmedi.

                  </p>

                </div>

              ) : (

                cart.map((item) => (

                  <div
                    key={item.id}
                    className="cart-item"
                  >

                    <div className="cart-info">

                      <strong>

                        {item.name}

                      </strong>

                      <small>

                        {item.quantity} x{" "}
                        {Number(item.sale).toLocaleString("tr-TR")} ₺

                      </small>

                    </div>

                    <div className="cart-actions">

                      <button
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                      >

                        <MdRemove />

                      </button>

                      <span>

                        {item.quantity}

                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                      >

                        <MdAdd />

                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          removeItem(item.id)
                        }
                      >

                        <MdDelete />

                      </button>

                    </div>

                  </div>

                ))

              )

            }

          </div>
                    <div className="cart-footer">

            <div className="total-row">

              <span>

                Toplam Ürün

              </span>

              <strong>

                {totalQuantity}

              </strong>

            </div>

            <div className="total-row">

              <span>

                Ödeme Türü

              </span>

              <select
                value={paymentType}
                onChange={(e) =>
                  setPaymentType(
                    e.target.value
                  )
                }
              >

                <option>

                  Nakit

                </option>

                <option>

                  Kredi Kartı

                </option>

                <option>

                  Havale / EFT

                </option>

                <option>

                  Veresiye

                </option>

              </select>

            </div>

            <div className="grand-total">

              <span>

                GENEL TOPLAM

              </span>

              <h2>

                {total.toLocaleString("tr-TR")} ₺

              </h2>

            </div>

            <button
              className="complete-sale-btn"
              onClick={() => {

                if (cart.length === 0) {

                  alert("Sepet boş.");

                  return;

                }

                alert("Satış tamamlandı.");

                setCart([]);

                setSearch("");

                setSelectedRow(0);

                inputRef.current?.focus();

              }}
            >

              <MdPointOfSale />

              Satışı Tamamla (F9)

            </button>

          </div>

        </div>

              </div>

    </div>

  );

}

