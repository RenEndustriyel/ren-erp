import { Link } from "react-router-dom";

export default function CustomerMovements() {
  return (
    <div className="customer-page">
      <div className="customer-container">

        <div className="customer-header">
          <div>
            <div className="customer-breadcrumb">
              Müşteri - Tedarikçi
              <span>/</span>
              Cari Hareket
            </div>

            <h1>Cari Hareket</h1>

            <p>
              Cari hesapların hareketlerini takip edin.
            </p>
          </div>

          <Link
            to="/customers"
            className="customer-primary-button"
          >
            Hesap Listesi
          </Link>
        </div>

        <div className="customer-table-card">

          <div className="table-header">
            <div>
              <strong>Cari Hareketleri</strong>
            </div>
          </div>

          <div className="customer-empty">
            <div className="empty-icon">
              ↔
            </div>

            <h3>
              Cari hareketleri
            </h3>

            <p>
              Cari seçildiğinde satış, tahsilat,
              ödeme ve diğer hareketler burada
              gösterilecek.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}