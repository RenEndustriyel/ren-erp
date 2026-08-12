import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdd,
  MdArrowBack,
  MdDelete,
  MdPerson,
  MdPointOfSale,
  MdRemove,
  MdSave,
  MdSearch,
} from "react-icons/md";
import { supabase } from "../../lib/supabase";
import "./NewSale.css";

const money = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  return (
    Number(
      String(value)
        .replace(",", ".")
        .replace(/[^\d.-]/g, "")
    ) || 0
  );
};

function saleNumber() {
  const now = new Date();
  const stamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  return `SAT-${stamp}`;
}

const RETAIL_CUSTOMER = {
  id: "",
  name: "Perakende Müşteri",
  code: "PERAKENDE",
  phone: "",
  balance: 0,
  isRetail: true,
};

export default function NewSale() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [paymentType, setPaymentType] =
    useState("Nakit");

  const [saleTerm, setSaleTerm] =
    useState("Peşin");

  const [dueDate, setDueDate] =
    useState("");

  const [note, setNote] = useState("");

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCustomer =
    customers.find(
      (customer) => customer.id === customerId
    ) || RETAIL_CUSTOMER;

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productsResponse,
        customersResponse,
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            [
              "id",
              "product_code",
              "barcode",
              "name",
              "brand",
              "unit",
              "sale_price",
              "sale_price_type",
              "vat_rate",
              "stock_quantity",
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("customers")
          .select(
            [
              "id",
              "code",
              "name",
              "phone",
              "balance",
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("name"),
      ]);

      if (productsResponse.error) {
        throw productsResponse.error;
      }

      if (customersResponse.error) {
        throw customersResponse.error;
      }

      setProducts(productsResponse.data || []);
      setCustomers(customersResponse.data || []);
    } catch (err) {
      console.error(
        "Yeni satış verileri yüklenemedi:",
        err
      );

      setError(
        err?.message ||
          "Ürün ve cari verileri yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // F9 = Satışı Tamamla
  useEffect(() => {
    const handleF9 = (event) => {
      if (
        event.key !== "F9" ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const button = document.querySelector(
        '[data-sale-complete="true"]'
      );

      if (button && !button.disabled) {
        button.click();
      }
    };

    window.addEventListener("keydown", handleF9);

    return () => {
      window.removeEventListener("keydown", handleF9);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = productSearch
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!query) {
      return products.slice(0, 20);
    }

    return products
      .filter((product) => {
        return (
          String(product.name || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(product.product_code || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(product.barcode || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(product.brand || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query)
        );
      })
      .slice(0, 20);
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!query) {
      return customers.slice(0, 20);
    }

    return customers
      .filter((customer) =>
        String(customer.name || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(customer.code || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(customer.phone || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query)
      )
      .slice(0, 20);
  }, [customers, customerSearch]);

  const addProduct = (product) => {
    setError("");
    setSuccess("");

    setItems((current) => {
      const existing = current.find(
        (item) => item.productId === product.id
      );

      const availableStock = Math.max(
        toNumber(product.stock_quantity),
        0
      );

      if (existing) {
        return current.map((item) => {
          if (item.productId !== product.id) {
            return item;
          }

          const nextQuantity = Math.min(
            toNumber(item.quantity) + 1,
            availableStock
          );

          return {
            ...item,
            quantity:
              nextQuantity > 0
                ? nextQuantity
                : item.quantity,
          };
        });
      }

      const storedSalePrice = toNumber(
        product.sale_price
      );

      const productVatRate = toNumber(
        product.vat_rate ?? 20
      );

      const productPriceType =
        product.sale_price_type ||
        product.salePriceType ||
        "exclusive";

      // Satış ekranındaki Birim Fiyat her zaman
      // müşterinin ödeyeceği KDV dahil fiyattır.
      const customerUnitPrice =
        productPriceType === "exclusive" &&
        productVatRate > 0
          ? storedSalePrice *
            (1 + productVatRate / 100)
          : storedSalePrice;

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          code:
            product.product_code ||
            product.barcode ||
            "",
          unit: product.unit || "Adet",
          stock: availableStock,
          quantity: availableStock > 0 ? 1 : 0,
          unitPrice: customerUnitPrice,
          salePriceType: productPriceType,
          storedSalePrice,
          vatRate: productVatRate,
          discountPercent: 0,
          manualNet: null,
          manualTotal: null,
        },
      ];
    });

    setProductSearch("");
  };

  const updateItem = (
    productId,
    field,
    value
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        let nextValue = value;

        if (
          field === "quantity" ||
          field === "unitPrice" ||
          field === "discountPercent" ||
          field === "vatRate"
        ) {
          nextValue = toNumber(value);
        }

        if (field === "discountPercent") {
          nextValue = Math.max(
            0,
            Math.min(nextValue, 100)
          );
        }

        if (field === "vatRate") {
          const allowedVatRates = [0, 1, 10, 20];

          if (!allowedVatRates.includes(nextValue)) {
            nextValue = 20;
          }
        }

        if (field === "quantity") {
          nextValue = Math.max(
            0,
            Math.min(nextValue, toNumber(item.stock))
          );
        }

        const updatedItem = {
          ...item,
          [field]: nextValue,
        };

        // Adet / fiyat / KDV / iskonto değişirse
        // manuel toplamları otomatik hesaplamaya döndür.
        if (
          [
            "quantity",
            "unitPrice",
            "discountPercent",
            "vatRate",
          ].includes(field)
        ) {
          updatedItem.manualNet = null;
          updatedItem.manualTotal = null;
        }

        // KDV'siz toplam manuel girildiyse
        // Satır Toplamı otomatik olarak buna göre hesaplanır.
        if (field === "manualNet") {
          updatedItem.manualTotal = null;
        }

        // Satır toplamı manuel girildiyse
        // KDV'siz toplam otomatik çıkarılır.
        if (field === "manualTotal") {
          updatedItem.manualNet = null;
        }

        return updatedItem;
      })
    );
  };

  const removeItem = (productId) => {
    setItems((current) =>
      current.filter(
        (item) => item.productId !== productId
      )
    );
  };

  const lines = useMemo(
    () =>
      items.map((item) => {
        const quantity = toNumber(
          item.quantity
        );

        // Birim fiyat her zaman KDV dahil müşteri fiyatı.
        const customerUnitPrice =
          toNumber(item.unitPrice);

        const vatRate = toNumber(
          item.vatRate ?? 20
        );

        const grossWithVat =
          quantity * customerUnitPrice;

        const grossNet =
          vatRate > 0
            ? grossWithVat /
              (1 + vatRate / 100)
            : grossWithVat;

        const baseDiscountPercent =
          Math.max(
            0,
            Math.min(
              toNumber(item.discountPercent),
              100
            )
          );

        const baseDiscount =
          grossNet *
          (baseDiscountPercent / 100);

        const baseNet = Math.max(
          grossNet - baseDiscount,
          0
        );

        const hasManualNet =
          item.manualNet !== null &&
          item.manualNet !== undefined &&
          String(item.manualNet).trim() !== "";

        const hasManualTotal =
          item.manualTotal !== null &&
          item.manualTotal !== undefined &&
          String(item.manualTotal).trim() !== "";

        const manualNet = hasManualNet
          ? Math.max(
              toNumber(item.manualNet),
              0
            )
          : null;

        const manualTotal = hasManualTotal
          ? Math.max(
              toNumber(item.manualTotal),
              0
            )
          : null;

        let net = baseNet;
        let discount = baseDiscount;
        let finalDiscountPercent =
          baseDiscountPercent;
        let vat =
          net * (vatRate / 100);
        let total = net + vat;

        if (manualNet !== null) {
          net = Math.min(
            manualNet,
            grossNet
          );

          discount = Math.max(
            grossNet - net,
            0
          );

          finalDiscountPercent =
            grossNet > 0
              ? Math.min(
                  (discount / grossNet) *
                    100,
                  100
                )
              : 0;

          vat =
            net * (vatRate / 100);

          total = net + vat;
        } else if (manualTotal !== null) {
          // Manuel Satır Toplamı KDV dahil toplamdır.
          total = manualTotal;

          net =
            vatRate > 0
              ? total /
                (1 + vatRate / 100)
              : total;

          net = Math.min(
            Math.max(net, 0),
            grossNet
          );

          discount = Math.max(
            grossNet - net,
            0
          );

          finalDiscountPercent =
            grossNet > 0
              ? Math.min(
                  (discount / grossNet) *
                    100,
                  100
                )
              : 0;

          vat = Math.max(
            total - net,
            0
          );
        }

        return {
          ...item,
          quantity,
          unitPrice:
            customerUnitPrice,
          gross: grossNet,
          displayGross:
            grossWithVat,
          discountPercent:
            finalDiscountPercent,
          discount,
          net,
          vat,
          total,
          manualNet: hasManualNet
            ? item.manualNet
            : null,
          manualTotal: hasManualTotal
            ? item.manualTotal
            : null,
        };
      }),
    [items]
  );

  const grossSubtotal = lines.reduce(
    (sum, item) =>
      sum + item.gross,
    0
  );

  const totalDiscount = lines.reduce(
    (sum, item) =>
      sum + item.discount,
    0
  );

  const subtotal = lines.reduce(
    (sum, item) =>
      sum + item.net,
    0
  );

  const vatTotal = lines.reduce(
    (sum, item) =>
      sum + item.vat,
    0
  );

  const total = lines.reduce(
    (sum, item) =>
      sum + item.total,
    0
  );

  const chooseCustomer = (customer) => {
    setCustomerId(customer.id);
    setCustomerSearch("");
  };

  const clearCustomer = () => {
    setCustomerId("");
    setCustomerSearch("");
  };

  const handleTermChange = (
    value
  ) => {
    setSaleTerm(value);

    if (value === "Peşin") {
      setDueDate("");
      setPaymentType("Nakit");
    }
  };

  const createSale = async () => {
    if (items.length === 0) {
      setError(
        "Satışa en az bir ürün eklemelisiniz."
      );
      return;
    }

    if (
      saleTerm === "Vadeli" &&
      !customerId
    ) {
      setError(
        "Vadeli satış için cari seçmelisiniz."
      );
      return;
    }

    if (
      saleTerm === "Vadeli" &&
      !dueDate
    ) {
      setError(
        "Vadeli satış için vade tarihi seçmelisiniz."
      );
      return;
    }

    for (const item of lines) {
      if (
        item.quantity <= 0
      ) {
        setError(
          `${item.name} için geçerli bir adet girin.`
        );
        return;
      }

      const currentStock =
        toNumber(
          products.find(
            (product) =>
              product.id ===
              item.productId
          )?.stock_quantity
        );

      if (item.quantity > currentStock) {
        setError(
          `${item.name} için yeterli stok yok. Mevcut: ${currentStock}`
        );
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const saleId =
      crypto.randomUUID();

    const createdSaleItems = [];
    const previousStocks = [];

    try {
      const saleNo = saleNumber();
      const now =
        new Date().toISOString();

      const receivedAmount =
        saleTerm === "Peşin"
          ? total
          : 0;

      const remainingAmount =
        Math.max(
          total - receivedAmount,
          0
        );

      const salePayload = {
        id: saleId,
        sale_no: saleNo,
        customer_id:
          customerId || null,
        customer_name:
          selectedCustomer.name,
        payment_type:
          paymentType,
        sale_status:
          "Tamamlandı",
        subtotal: subtotal,
        discount_amount:
          totalDiscount,
        vat_amount: vatTotal,
        total,
        received_amount:
          receivedAmount,
        remaining_amount:
          remainingAmount,
        due_date:
          saleTerm === "Vadeli"
            ? dueDate
            : null,
        note:
          note.trim() || null,
        created_at: now,
        updated_at: now,
      };

      const {
        error: saleError,
      } = await supabase
        .from("sales")
        .insert(salePayload);

      if (saleError) {
        throw saleError;
      }

      for (const item of lines) {
        const { error: itemError } =
          await supabase
            .from("sale_items")
            .insert({
              id:
                crypto.randomUUID(),
              sale_id:
                saleId,
              product_id:
                item.productId,
              product_name:
                item.name,
              quantity:
                item.quantity,
              unit_price:
                item.unitPrice,
              vat_rate:
                item.vatRate,
              discount_amount:
                item.discount,
              line_total:
                item.total,
              created_at:
                now,
            });

        if (itemError) {
          throw itemError;
        }

        createdSaleItems.push(
          item.productId
        );
      }

      for (const item of lines) {
        const product =
          products.find(
            (current) =>
              current.id ===
              item.productId
          );

        const currentStock =
          toNumber(
            product?.stock_quantity
          );

        const nextStock =
          currentStock -
          toNumber(item.quantity);

        previousStocks.push({
          productId:
            item.productId,
          stock:
            currentStock,
        });

        const {
          error: productError,
        } = await supabase
          .from("products")
          .update({
            stock_quantity:
              nextStock,
            updated_at: now,
          })
          .eq(
            "id",
            item.productId
          );

        if (productError) {
          throw productError;
        }

        const {
          error: movementError,
        } = await supabase
          .from("stock_movements")
          .insert({
            id:
              crypto.randomUUID(),
            product_id:
              item.productId,
            movement_type:
              "sale",
            quantity:
              item.quantity,
            unit_cost:
              0,
            reference_type:
              "sale",
            reference_id:
              saleId,
            note:
              `${saleNo} satış çıkışı`,
            created_at:
              now,
          });

        if (movementError) {
          throw movementError;
        }
      }

      if (receivedAmount > 0) {
        const {
          error: collectionError,
        } = await supabase
          .from("collections")
          .insert({
            id:
              crypto.randomUUID(),
            customer_id:
              customerId || null,
            sale_id:
              saleId,
            amount:
              receivedAmount,
            payment_type:
              paymentType,
            note:
              `${saleNo} tahsilatı`,
            created_at:
              now,
          });

        if (collectionError) {
          throw collectionError;
        }
      }

      if (customerId) {
        const previousBalance =
          toNumber(
            selectedCustomer.balance
          );

        // remaining_amount zaten tahsilat sonrası
        // kalan borçtur; tekrar received_amount düşülmez.
        const nextBalance =
          Math.max(
            previousBalance +
              remainingAmount,
            0
          );

        const {
          error: customerError,
        } = await supabase
          .from("customers")
          .update({
            balance:
              nextBalance,
            updated_at:
              now,
          })
          .eq(
            "id",
            customerId
          );

        if (customerError) {
          throw customerError;
        }
      }

      setSuccess(
        `${saleNo} başarıyla oluşturuldu.`
      );

      setItems([]);
      setCustomerId("");
      setCustomerSearch("");
      setProductSearch("");
      setPaymentType("Nakit");
      setSaleTerm("Peşin");
      setDueDate("");
      setNote("");

      await loadData();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Satış kaydedilemedi:",
        err
      );

      // Mümkün olan geri alma işlemleri.
      // RLS izin veriyorsa önce stokları geri al,
      // sonra kalem ve satış kaydını sil.
      for (const previous of previousStocks) {
        await supabase
          .from("products")
          .update({
            stock_quantity:
              previous.stock,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            previous.productId
          );
      }

      if (createdSaleItems.length > 0) {
        await supabase
          .from("sale_items")
          .delete()
          .eq(
            "sale_id",
            saleId
          );
      }

      await supabase
        .from("collections")
        .delete()
        .eq(
          "sale_id",
          saleId
        );

      await supabase
        .from("stock_movements")
        .delete()
        .eq(
          "reference_id",
          saleId
        );

      await supabase
        .from("sales")
        .delete()
        .eq(
          "id",
          saleId
        );

      setError(
        err?.message ||
          "Satış kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-sale-page">
      <div className="new-sale-header">
        <div>
          <div className="new-sale-eyebrow">
            REN ERP • SATIŞ
          </div>

          <h1>
            Yeni Satış
          </h1>

          <p>
            Ürünleri ekleyin, ödeme şeklini
            belirleyin ve satışı tamamlayın.
          </p>
        </div>

        <button
          type="button"
          className="new-sale-back"
          onClick={() =>
            navigate("/sales")
          }
        >
          <MdArrowBack />
          Satışlara Dön
        </button>
      </div>

      {success && (
        <div className="new-sale-success">
          <MdSave />
          {success}
        </div>
      )}

      {error && (
        <div className="new-sale-error">
          {error}
        </div>
      )}

      <div className="new-sale-layout">
        <main className="new-sale-main">
          {/* MÜŞTERİ */}
          <section className="new-sale-card">
            <div className="new-sale-card-header">
              <div>
                <span>CARİ</span>
                <h2>Müşteri</h2>
              </div>
              <MdPerson />
            </div>

            <div className="new-sale-selected-customer">
              <div>
                <strong>
                  {selectedCustomer.name}
                </strong>
                <span>
                  {selectedCustomer.code ||
                    selectedCustomer.phone ||
                    "Perakende müşteri"}
                </span>
              </div>

              {customerId ? (
                <button
                  type="button"
                  onClick={clearCustomer}
                >
                  Perakendeye Dön
                </button>
              ) : (
                <span className="new-sale-retail-badge">
                  Varsayılan
                </span>
              )}
            </div>

            <div className="new-sale-search customer-search">
              <MdSearch />
              <input
                value={customerSearch}
                onChange={(event) =>
                  setCustomerSearch(
                    event.target.value
                  )
                }
                placeholder="Cari ara: isim, kod veya telefon..."
              />
            </div>

            {customerSearch && (
              <div className="new-sale-dropdown">
                {filteredCustomers.length === 0 ? (
                  <div className="new-sale-dropdown-empty">
                    Müşteri bulunamadı.
                  </div>
                ) : (
                  filteredCustomers.map(
                    (customer) => (
                      <button
                        type="button"
                        key={customer.id}
                        onClick={() =>
                          chooseCustomer(
                            customer
                          )
                        }
                      >
                        <div>
                          <strong>
                            {customer.name}
                          </strong>
                          <span>
                            {customer.code ||
                              customer.phone ||
                              "Cari"}
                          </span>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </section>

          {/* ÜRÜNLER */}
          <section className="new-sale-card">
            <div className="new-sale-card-header">
              <div>
                <span>ÜRÜNLER</span>
                <h2>Satış Kalemleri</h2>
              </div>
              <MdPointOfSale />
            </div>

            <div className="new-sale-search product-search">
              <MdSearch />
              <input
                value={productSearch}
                onChange={(event) =>
                  setProductSearch(
                    event.target.value
                  )
                }
                placeholder="Ürün adı, kod veya barkod ara..."
              />
            </div>

            {productSearch && (
              <div className="new-sale-dropdown product-dropdown">
                {filteredProducts.length === 0 ? (
                  <div className="new-sale-dropdown-empty">
                    Ürün bulunamadı.
                  </div>
                ) : (
                  filteredProducts.map(
                    (product) => (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() =>
                          addProduct(product)
                        }
                      >
                        <div>
                          <strong>
                            {product.name}
                          </strong>

                          <span>
                            {product.product_code ||
                              product.barcode ||
                              product.brand ||
                              "-"}
                            {" • "}
                            {(
                              product.sale_price_type ||
                              "exclusive"
                            ) === "inclusive"
                              ? "KDV Dahil"
                              : "KDV Hariç"}
                          </span>
                        </div>

                        <div className="product-result-meta">
                          <b>
                            ₺{" "}
                            {money(
                              product.sale_price
                            )}
                          </b>
                          <small>
                            Stok:{" "}
                            {product.stock_quantity ??
                              0}
                          </small>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            )}

            <div className="new-sale-table-scroll">
              <div className="new-sale-table">
                <div className="new-sale-line-head">
                  <span>Ürün</span>
                  <span>Adet</span>
                  <span>Birim Fiyat</span>
                  <span>İskonto</span>
                  <span>KDV'siz Toplam</span>
                  <span>KDV</span>
                  <span>Satır Toplamı</span>
                  <span />
                </div>

                <div className="new-sale-lines">
                  {lines.length === 0 ? (
                    <div className="new-sale-empty">
                      <MdPointOfSale />
                      <strong>
                        Henüz ürün eklenmedi.
                      </strong>
                      <span>
                        Yukarıdaki arama alanından ürün
                        seçerek satışa ekleyin.
                      </span>
                    </div>
                  ) : (
                    lines.map((item) => (
                      <div
                        className="new-sale-line"
                        key={item.productId}
                      >
                        <div className="new-sale-line-main">
                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            Stok:{" "}
                            {item.stock}{" "}
                            {item.unit}
                            {" • "}
                            {item.salePriceType ===
                            "inclusive"
                              ? "KDV Dahil"
                              : "KDV Hariç"}
                          </span>
                        </div>

                        <div className="new-sale-line-quantity">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(
                                item.productId,
                                "quantity",
                                Math.max(
                                  item.quantity - 1,
                                  0
                                )
                              )
                            }
                            aria-label="Adedi azalt"
                          >
                            <MdRemove />
                          </button>

                          <input
                            type="number"
                            min="0"
                            max={item.stock}
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                item.productId,
                                "quantity",
                                event.target.value
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateItem(
                                item.productId,
                                "quantity",
                                Math.min(
                                  item.quantity + 1,
                                  item.stock
                                )
                              )
                            }
                            aria-label="Adedi artır"
                          >
                            <MdAdd />
                          </button>
                        </div>

                        <input
                          className="new-sale-price-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.unitPrice
                          }
                          onChange={(event) =>
                            updateItem(
                              item.productId,
                              "unitPrice",
                              event.target.value
                            )
                          }
                        />

                        <div className="new-sale-line-discount">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={
                              item.discountPercent
                            }
                            onChange={(event) =>
                              updateItem(
                                item.productId,
                                "discountPercent",
                                event.target.value
                              )
                            }
                          />
                          <span>%</span>
                        </div>

                        <div className="new-sale-line-net-edit">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              item.manualNet !==
                                null &&
                              item.manualNet !==
                                undefined
                                ? item.manualNet
                                : item.net.toFixed(
                                    2
                                  )
                            }
                            onFocus={(event) =>
                              event.currentTarget.select()
                            }
                            onChange={(event) =>
                              updateItem(
                                item.productId,
                                "manualNet",
                                event.target.value
                              )
                            }
                            onBlur={(event) => {
                              const raw =
                                event.target.value
                                  .trim()
                                  .replace(",", ".");

                              if (!raw) {
                                updateItem(
                                  item.productId,
                                  "manualNet",
                                  null
                                );
                                return;
                              }

                              const numeric =
                                Number(raw);

                              updateItem(
                                item.productId,
                                "manualNet",
                                Number.isFinite(
                                  numeric
                                )
                                  ? numeric.toFixed(
                                      2
                                    )
                                  : null
                              );
                            }}
                            aria-label="KDV'siz toplam"
                          />
                          <span>₺</span>
                        </div>

                        <div className="new-sale-line-vat">
                          <select
                            value={
                              item.vatRate
                            }
                            onChange={(event) =>
                              updateItem(
                                item.productId,
                                "vatRate",
                                event.target.value
                              )
                            }
                            aria-label="KDV oranı"
                          >
                            <option value="0">
                              %0
                            </option>
                            <option value="1">
                              %1
                            </option>
                            <option value="10">
                              %10
                            </option>
                            <option value="20">
                              %20
                            </option>
                          </select>

                          <span>
                            ₺{" "}
                            {money(
                              item.vat
                            )}
                          </span>
                        </div>

                        <div className="new-sale-line-total-edit">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              item.manualTotal !==
                                null &&
                              item.manualTotal !==
                                undefined
                                ? item.manualTotal
                                : item.total.toFixed(
                                    2
                                  )
                            }
                            onFocus={(event) =>
                              event.currentTarget.select()
                            }
                            onChange={(event) =>
                              updateItem(
                                item.productId,
                                "manualTotal",
                                event.target.value
                              )
                            }
                            onBlur={(event) => {
                              const raw =
                                event.target.value
                                  .trim()
                                  .replace(",", ".");

                              if (!raw) {
                                updateItem(
                                  item.productId,
                                  "manualTotal",
                                  null
                                );
                                return;
                              }

                              const numeric =
                                Number(raw);

                              updateItem(
                                item.productId,
                                "manualTotal",
                                Number.isFinite(
                                  numeric
                                )
                                  ? numeric.toFixed(
                                      2
                                    )
                                  : null
                              );
                            }}
                            aria-label="Satır toplamı"
                          />
                          <span>₺</span>
                        </div>

                        <button
                          type="button"
                          className="new-sale-delete"
                          onClick={() =>
                            removeItem(
                              item.productId
                            )
                          }
                          aria-label="Ürünü sil"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* NOT */}
          <section className="new-sale-card">
            <div className="new-sale-card-header">
              <div>
                <span>NOT</span>
                <h2>Açıklama</h2>
              </div>
            </div>

            <textarea
              className="new-sale-note"
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              placeholder="Satış hakkında not..."
              rows="3"
            />
          </section>
        </main>

        <aside className="new-sale-side">
          {/* SATIŞ ÖZETİ */}
          <section className="new-sale-total-card">
            <div className="new-sale-total-header">
              <div>
                <span>SATIŞ ÖZETİ</span>
                <small>
                  Ürün bazlı KDV ve iskonto
                </small>
              </div>
              <MdPointOfSale />
            </div>

            <div className="new-sale-summary-row">
              <span>Brüt Toplam</span>
              <strong>
                ₺ {money(grossSubtotal)}
              </strong>
            </div>

            <div className="new-sale-summary-row discount">
              <span>Toplam İskonto</span>
              <strong>
                - ₺ {money(totalDiscount)}
              </strong>
            </div>

            <div className="new-sale-summary-row">
              <span>KDV'siz Toplam</span>
              <strong>
                ₺ {money(subtotal)}
              </strong>
            </div>

            <div className="new-sale-summary-row">
              <span>Toplam KDV</span>
              <strong>
                ₺ {money(vatTotal)}
              </strong>
            </div>

            <div className="new-sale-grand-total">
              <span>Genel Toplam</span>
              <strong>
                ₺ {money(total)}
              </strong>
            </div>
          </section>

          {/* ÖDEME */}
          <section className="new-sale-card">
            <div className="new-sale-card-header">
              <div>
                <span>ÖDEME</span>
                <h2>Vade & Ödeme</h2>
              </div>
            </div>

            <div className="new-sale-field">
              <label>Vade Durumu</label>

              <div className="new-sale-toggle">
                <button
                  type="button"
                  className={
                    saleTerm === "Peşin"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    handleTermChange(
                      "Peşin"
                    )
                  }
                >
                  Peşin
                </button>

                <button
                  type="button"
                  className={
                    saleTerm === "Vadeli"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    handleTermChange(
                      "Vadeli"
                    )
                  }
                >
                  Vadeli
                </button>
              </div>
            </div>

            {saleTerm === "Vadeli" && (
              <div className="new-sale-field">
                <label>Vade Tarihi</label>

                <input
                  type="date"
                  value={dueDate}
                  min={
                    new Date()
                      .toISOString()
                      .slice(0, 10)
                  }
                  onChange={(event) =>
                    setDueDate(
                      event.target.value
                    )
                  }
                />
              </div>
            )}

            <div className="new-sale-field">
              <label>Ödeme Yöntemi</label>

              <select
                value={paymentType}
                onChange={(event) =>
                  setPaymentType(
                    event.target.value
                  )
                }
              >
                <option value="Nakit">
                  Nakit
                </option>

                <option value="Kredi Kartı">
                  Kredi Kartı
                </option>

                <option value="Havale/EFT">
                  Havale / EFT
                </option>

                <option value="Çek">
                  Çek
                </option>

                <option value="Senet">
                  Senet
                </option>
              </select>
            </div>
          </section>

          <button
            type="button"
            className="new-sale-complete"
            data-sale-complete="true"
            onClick={createSale}
            disabled={
              saving ||
              loading ||
              lines.length === 0
            }
          >
            <MdSave />

            <span className="new-sale-complete-main">
              {saving
                ? "Satış Kaydediliyor..."
                : "Satışı Tamamla"}
            </span>

            {!saving && (
              <span className="new-sale-f9-badge">
                F9
              </span>
            )}

            {!saving && (
              <span className="new-sale-complete-total">
                ₺ {money(total)}
              </span>
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}
