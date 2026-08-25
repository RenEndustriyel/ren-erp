import { Link } from "react-router-dom";
import "./CustomerList.css";

const customers = [
  {
    id: 1,
    code: "CR-0001",
    name: "Örnek Müşteri A.Ş.",
    type: "Müşteri",
    phone: "0532 000 00 01",
    balance: 12500,
  },
  {
    id: 2,
    code: "CR-0002",
    name: "Örnek İşletme",
    type: "Müşteri",
    phone: "0532 000 00 02",
    balance: 7800,
  },
];

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

export default function CustomerList() {
  return (
    <div className="customer-page">
      <div className="customer-container">

        <div className="customer-header">
          <div>
            <div className="customer-breadcrumb">
              Müşteri - Tedarikçi
              <span>/</span>
              Hesap Listesi
            </div>

            <h1>Hesap Listesi</h1>

            <p>
              Müşteri ve tedarikçi hesaplarınızı yönetin.
            </p>
          </div>

          <Link
            to="/customers/new"
            className="customer-primary-button"
          >
            <span>+</span>
            Yeni Hesap
          </Link>
        </div>

        <div className="customer-summary">

          <div className="summary-card">
            <div className="summary-label">
              Toplam Hesap
            </div>

            <div className="summary-value">
              {customers.length}
            </div>

            <div className="summary-description">
              Kayıtlı cari hesap
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Müşteriler
            </div>

            <div className="summary-value">
              {customers.filter(
                (item) => item.type === "Müşteri"
              ).length}
            </div>

            <div className="summary-description">
              Müşteri hesapları
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Toplam Bakiye
            </div>

            <div className="summary-value">
              {money(
                customers.reduce(
                  (total, item) => total + item.balance,
                  0
                )
              )}
            </div>

            <div className="summary-description">
              Cari bakiye
            </div>
          </div>

        </div>

        <div className="customer-toolbar">

          <div className="customer-search">
            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Hesap adı veya cari kodu ara..."
            />
          </div>

        </div>

        <div className="customer-table-card">

          <div className="table-header">
            <div>
              <strong>Hesaplar</strong>

              <span>
                {customers.length} kayıt
              </span>
            </div>
          </div>

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Hesap</th>
                  <th>Cari Kodu</th>
                  <th>Telefon</th>
                  <th>Tip</th>
                  <th className="number-column">
                    Bakiye
                  </th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {customers.map((customer) => (
                  <tr key={customer.id}>

                    <td>
                      <Link
                        to={`/customers/${customer.id}`}
                        className="customer-name"
                      >
                        <span className="customer-avatar">
                          {customer.name
                            .substring(0, 2)
                            .toUpperCase()}
                        </span>

                        <span>
                          <strong>
                            {customer.name}
                          </strong>

                          <small>
                            {customer.type}
                          </small>
                        </span>
                      </Link>
                    </td>

                    <td>
                      <span className="customer-code">
                        {customer.code}
                      </span>
                    </td>

                    <td>
                      <span className="muted-value">
                        {customer.phone}
                      </span>
                    </td>

                    <td>
                      <span className="due-badge">
                        {customer.type}
                      </span>
                    </td>

                    <td className="number-column">
                      <span className="balance positive">
                        {money(customer.balance)}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/customers/${customer.id}`}
                        className="row-action"
                      >
                        Görüntüle
                      </Link>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </div>
  );
}