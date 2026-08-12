import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdCheck,
  MdInventory2,
  MdPrint,
  MdRefresh,
  MdSearch,
} from "react-icons/md";
import { supabase } from "../../lib/supabase";
import "./BarcodeLabel.css";

const PAGE_SIZE = 30;

const money = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function ean13(value) {
  const digits = onlyDigits(value);

  if (digits.length === 13) {
    const body = digits.slice(0, 12);

    let sum = 0;

    body.split("").forEach((digit, index) => {
      const n = Number(digit);
      sum += index % 2 === 0 ? n : n * 3;
    });

    const check =
      (10 - (sum % 10)) % 10;

    return body + check;
  }

  if (digits.length === 12) {
    let sum = 0;

    digits.split("").forEach((digit, index) => {
      const n = Number(digit);
      sum += index % 2 === 0 ? n : n * 3;
    });

    const check =
      (10 - (sum % 10)) % 10;

    return digits + check;
  }

  return null;
}

const L = {
  A: [
    "0001101",
    "0011001",
    "0010011",
    "0111101",
    "0100011",
    "0110001",
    "0101111",
    "0111011",
    "0110111",
    "0001011",
  ],
  B: [
    "0100111",
    "0110011",
    "0011011",
    "0100001",
    "0011101",
    "0111001",
    "0000101",
    "0010001",
    "0001001",
    "0010111",
  ],
  C: [
    "1110010",
    "1100110",
    "1101100",
    "1000010",
    "1011100",
    "1001110",
    "1010000",
    "1000100",
    "1001000",
    "1110100",
  ],
};

const PARITY = [
  ["A", "A", "A", "A", "A", "A"],
  ["A", "A", "B", "A", "B", "B"],
  ["A", "A", "B", "B", "A", "B"],
  ["A", "A", "B", "B", "B", "A"],
  ["A", "B", "A", "A", "B", "B"],
  ["A", "B", "B", "A", "A", "B"],
  ["A", "B", "B", "B", "A", "A"],
  ["A", "B", "A", "B", "A", "B"],
  ["A", "B", "A", "B", "B", "A"],
  ["A", "B", "B", "A", "B", "A"],
];

function eanPattern(code) {
  if (!/^\d{13}$/.test(code)) return null;

  const first = Number(code[0]);
  const left = code.slice(1, 7);
  const right = code.slice(7);

  let result = "101";

  left.split("").forEach((digit, index) => {
    result += L[PARITY[first][index]][Number(digit)];
  });

  result += "01010";

  right.split("").forEach((digit) => {
    result += L.C[Number(digit)];
  });

  result += "101";

  return result;
}

function BarcodeSvg({ value }) {
  const pattern = eanPattern(value);

  if (!pattern) {
    return (
      <div className="barcode-fallback">
        {value || "BARKOD YOK"}
      </div>
    );
  }

  return (
    <div className="barcode-svg-wrap">
      <svg
        className="barcode-svg"
        viewBox={`0 0 ${pattern.length} 100`}
        preserveAspectRatio="none"
        aria-label={`Barkod ${value}`}
      >
        {pattern.split("").map(
          (bit, index) =>
            bit === "1" && (
              <rect
                key={index}
                x={index}
                y="0"
                width="1"
                height="82"
                fill="currentColor"
              />
            )
        )}
      </svg>

      <div className="barcode-number">
        {value}
      </div>
    </div>
  );
}

export default function BarcodeLabel() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: supabaseError } =
        await supabase
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
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("name");

      if (supabaseError) {
        throw supabaseError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error(
        "Barkod ürünleri yüklenemedi:",
        err
      );

      setError(
        err?.message ||
          "Ürünler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!query) return products;

    return products.filter((product) => {
      return (
        String(product.name || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(product.brand || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(product.product_code || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(product.barcode || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query)
      );
    });
  }, [products, search]);

  const selectedProducts = useMemo(
    () =>
      selected
        .map((id) =>
          products.find(
            (product) => product.id === id
          )
        )
        .filter(Boolean),
    [selected, products]
  );

  const toggleProduct = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );
  };

  const selectAll = () => {
    const ids = filteredProducts
      .map((product) => product.id)
      .slice(0, PAGE_SIZE);

    setSelected((current) => [
      ...new Set([
        ...current,
        ...ids,
      ]),
    ]);
  };

  const clearSelection = () => {
    setSelected([]);
  };

  const printLabels = () => {
    if (!selectedProducts.length) {
      return;
    }

    window.print();
  };

  return (
    <div className="barcode-label-page">

      <div className="barcode-label-header">

        <div>
          <div className="barcode-label-eyebrow">
            REN ERP • BARKOD & ETİKET
          </div>

          <h1>
            Barkod & Etiket
          </h1>

          <p>
            Ürünlerin barkodlarını seçin,
            fiyat etiketlerini hazırlayın
            ve A4 olarak yazdırın.
          </p>
        </div>

        <div className="barcode-label-actions">

          <button
            type="button"
            className="barcode-secondary"
            onClick={loadProducts}
            disabled={loading}
          >
            <MdRefresh />
            Yenile
          </button>

          <button
            type="button"
            className="barcode-secondary"
            onClick={() =>
              navigate("/products")
            }
          >
            <MdArrowBack />
            Ürünlere Dön
          </button>

          <button
            type="button"
            className="barcode-primary"
            onClick={printLabels}
            disabled={
              selectedProducts.length === 0
            }
          >
            <MdPrint />
            Yazdır (
            {selectedProducts.length})
          </button>

        </div>
      </div>

      <div className="barcode-label-panel">

        <div className="barcode-toolbar">

          <div className="barcode-search">
            <MdSearch />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Ürün, marka, kod veya barkod ara..."
            />
          </div>

          <div className="barcode-toolbar-buttons">

            <button
              type="button"
              onClick={selectAll}
            >
              <MdCheck />
              Görünenleri Seç
            </button>

            <button
              type="button"
              onClick={clearSelection}
            >
              Temizle
            </button>

          </div>

        </div>

        {error && (
          <div className="barcode-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="barcode-empty">
            <MdInventory2 />
            <strong>
              Ürünler yükleniyor...
            </strong>
          </div>
        ) : (
          <div className="barcode-product-list">

            {filteredProducts
              .slice(0, PAGE_SIZE)
              .map((product) => {
                const active =
                  selected.includes(
                    product.id
                  );

                const numericBarcode =
                  ean13(product.barcode);

                return (
                  <button
                    type="button"
                    key={product.id}
                    className={`barcode-product-row ${
                      active ? "selected" : ""
                    }`}
                    onClick={() =>
                      toggleProduct(
                        product.id
                      )
                    }
                  >

                    <div className="barcode-check">
                      {active && <MdCheck />}
                    </div>

                    <div className="barcode-product-icon">
                      <MdInventory2 />
                    </div>

                    <div className="barcode-product-info">

                      <strong>
                        {product.name}
                      </strong>

                      <span>
                        {product.brand ||
                          product.product_code ||
                          "-"}
                      </span>

                    </div>

                    <div className="barcode-product-code">
                      <span>
                        {product.barcode ||
                          product.product_code ||
                          "Barkod yok"}
                      </span>

                      {numericBarcode && (
                        <small>
                          EAN-13
                        </small>
                      )}
                    </div>

                    <div className="barcode-product-price">
                      ₺{" "}
                      {money(
                        product.sale_price
                      )}
                    </div>

                  </button>
                );
              })}

          </div>
        )}

        {!loading &&
          filteredProducts.length >
            PAGE_SIZE && (
            <div className="barcode-list-note">
              İlk {PAGE_SIZE} ürün gösteriliyor.
              Arama yaparak ürünleri daraltabilirsiniz.
            </div>
          )}

      </div>

      <div className="barcode-print-area">

        {selectedProducts.length === 0 ? (
          <div className="barcode-print-empty">
            <MdPrint />
            <strong>
              Yazdırmak için ürün seçin
            </strong>
            <span>
              Seçtiğiniz ürünlerin etiketleri burada
              A4 baskı düzeninde hazırlanacaktır.
            </span>
          </div>
        ) : (
          <>
            <div className="barcode-print-title">
              <span>
                BASKI ÖNİZLEME
              </span>

              <strong>
                {selectedProducts.length} Etiket
              </strong>
            </div>

            <div className="barcode-print-grid">

              {selectedProducts.map(
                (product) => {
                  const code =
                    ean13(product.barcode);

                  return (
                    <article
                      className="print-label"
                      key={product.id}
                    >

                      <div className="print-label-brand">
                        REN ENDÜSTRİYEL
                      </div>

                      <div className="print-label-name">
                        {product.name}
                      </div>

                      {product.brand && (
                        <div className="print-label-subtitle">
                          {product.brand}
                        </div>
                      )}

                      <div className="print-label-barcode">
                        {code ? (
                          <BarcodeSvg
                            value={code}
                          />
                        ) : (
                          <div className="barcode-fallback">
                            {product.barcode ||
                              product.product_code ||
                              "BARKOD YOK"}
                          </div>
                        )}
                      </div>

                      <div className="print-label-price">
                        ₺{" "}
                        {money(
                          product.sale_price
                        )}
                      </div>

                    </article>
                  );
                }
              )}

            </div>
          </>
        )}

      </div>

    </div>
  );
}
