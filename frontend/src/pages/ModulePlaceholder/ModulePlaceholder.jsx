import { useLocation } from "react-router-dom";

import "./ModulePlaceholder.css";

export default function ModulePlaceholder() {
  const location = useLocation();

  const moduleNames = {
    "/stok": "Stok",
    "/musteri-tedarikci": "Müşteri-Tedarikçi",
    "/siparis-teklif": "Sipariş-Teklif",
    "/fatura": "Fatura",
    "/kasa-banka": "Kasa-Banka",
  };

  const title =
    moduleNames[location.pathname] ||
    "Modül";

  return (
    <section className="ren-module-placeholder">

      <span>
        REN ERP
      </span>

      <h1>
        {title}
      </h1>

      <p>
        Bu modül hazırlanıyor.
      </p>

    </section>
  );
}