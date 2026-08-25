import { Link } from "react-router-dom";

export default function CustomerTransfer() {
  return (
    <div className="customer-page">
      <div className="customer-container">

        <div className="customer-header">
          <div>
            <div className="customer-breadcrumb">
              Müşteri - Tedarikçi
              <span>/</span>
              Cari Virman
            </div>

            <h1>Cari Virman</h1>

            <p>
              Bir cari hesaptan diğerine bakiye aktarın.
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
              <strong>Cari Virman</strong>
            </div>
          </div>

          <div className="customer-empty">
            <div className="empty-icon">
              ⇄
            </div>

            <h3>
              Cari virman
            </h3>

            <p>
              Virman ekranında kaynak cari,
              hedef cari ve aktarılacak tutar
              belirlenecek.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}