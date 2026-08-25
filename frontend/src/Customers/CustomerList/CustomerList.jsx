import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./CustomerList.css";

const initialCustomers = [
  {
    id: 1,
    code: "CR-0001",
    name: "Örnek Müşteri A.Ş.",
    type: "Müşteri",
    phone: "0532 000 00 01",
    taxOffice: "Susurluk",
    taxNumber: "1234567890",
    due: "30 Gün",
    debit: 12500,
    credit: 3500,
    balance: 9000,
    status: "Vadeli",
  },
  {
    id: 2,
    code: "CR-0002",
    name: "Örnek İşletme",
    type: "Müşteri",
    phone: "0532 000 00 02",
    taxOffice: "Susurluk",
    taxNumber: "2345678901",
    due: "Peşin",
    debit: 7800,
    credit: 7800,
    balance: 0,
    status: "Kapalı",
  },
  {
    id: 3,
    code: "CR-0003",
    name: "Örnek Tedarikçi Ltd.",
    type: "Tedarikçi",
    phone: "0532 000 00 03",
    taxOffice: "Balıkesir",
    taxNumber: "3456789012",
    due: "30 Gün",
    debit: 4200,
    credit: 11500,
    balance: -7300,
    status: "Alacaklı",
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((item) => item.charAt(0))
    .join("")
    .toUpperCase();
}

export default function CustomerList() {
  const [customers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tümü");
  const [balanceFilter, setBalanceFilter] = useState("Tümü");

  const filteredCustomers = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase("tr-TR");

    return customers.filter((customer) => {
      const matchesSearch =
        !searchText ||
        customer.name.toLocaleLowerCase("tr-TR").includes(searchText) ||
        customer.code.toLocaleLowerCase("tr-TR").includes(searchText) ||
        customer.phone.includes(searchText) ||
        customer.taxNumber.includes(searchText);

      const matchesType =
        typeFilter === "Tümü" || customer.type === typeFilter;

      const matchesBalance =
        balanceFilter === "Tümü" ||
        (balanceFilter === "Borçlu" && customer.balance > 0) ||
        (balanceFilter === "Alacaklı" && customer.balance < 0) ||
        (balanceFilter === "Kapalı" && customer.balance === 0);

      return matchesSearch && matchesType && matchesBalance;
    });
  }, [customers, search, typeFilter, balanceFilter]);

  const totalDebit = filteredCustomers.reduce(
    (total, customer) => total + customer.debit,
    0
  );

  const totalCredit = filteredCustomers.reduce(
    (total, customer) => total + customer.credit,
    0
  );

  const totalBalance = filteredCustomers.reduce(
    (total, customer) => total + customer.balance,
    0
  );

  return (
    <div className="customer-page">
      <div className="customer-container">

        {/* HEADER */}

        <div className="customer-header">
          <div>
            <div className="customer-breadcrumb">
              Cari Yönetimi
              <span>/</span>
              Cariler
            </div>

            <h1>Cariler</h1>

            <p>
              Müşteri ve tedarikçilerinizi tek ekrandan yönetin.
            </p>
          </div>

          <Link
            to="/customers/new"
            className="customer-primary-button"
          >
            <span>+</span>
            Yeni Cari
          </Link>
        </div>

        {/* SUMMARY */}

        <div className="customer-summary">

          <div className="summary-card">
            <div className="summary-label">
              Toplam Cari
            </div>

            <div className="summary-value">
              {filteredCustomers.length}
            </div>

            <div className="summary-description">
              Listelenen cari
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Toplam Borç
            </div>

            <div className="summary-value">
              {formatCurrency(totalDebit)}
            </div>

            <div className="summary-description">
              Cari borç bakiyesi
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">
              Toplam Alacak
            </div>

            <div className="summary-value">
              {formatCurrency(totalCredit)}
            </div>

            <div className="summary-description">
              Cari alacak bakiyesi
            </div>
          </div>

          <div className="summary-card summary-balance">
            <div className="summary-label">
              Net Bakiye
            </div>

            <div className="summary-value">
              {formatCurrency(Math.abs(totalBalance))}
            </div>

            <div className="summary-description">
              {totalBalance > 0
                ? "Toplam borç"
                : totalBalance < 0
                ? "Toplam alacak"
                : "Bakiye yok"}
            </div>
          </div>

        </div>

        {/* TOOLBAR */}

        <div className="customer-toolbar">

          <div className="customer-search">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Cari adı, kodu, telefon veya vergi no ara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="customer-filters">

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="Tümü">Tüm Cariler</option>
              <option value="Müşteri">Müşteriler</option>
              <option value="Tedarikçi">Tedarikçiler</option>
            </select>

            <select
              value={balanceFilter}
              onChange={(event) =>
                setBalanceFilter(event.target.value)
              }
            >
              <option value="Tümü">Tüm Bakiyeler</option>
              <option value="Borçlu">Borçlular</option>
              <option value="Alacaklı">Alacaklılar</option>
              <option value="Kapalı">Bakiyesi Olmayanlar</option>
            </select>

            <button
              type="button"
              className="filter-button"
              onClick={() => {
                setSearch("");
                setTypeFilter("Tümü");
                setBalanceFilter("Tümü");
              }}
            >
              Temizle
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div className="customer-table-card">

          <div className="table-header">

            <div>
              <strong>Cari Listesi</strong>

              <span>
                {filteredCustomers.length} kayıt
              </span>
            </div>

            <button
              type="button"
              className="table-action"
            >
              ⋮
            </button>

          </div>

          {filteredCustomers.length > 0 ? (

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Cari</th>
                    <th>Cari Kodu</th>
                    <th>Telefon</th>
                    <th>Vade</th>
                    <th className="number-column">
                      Borç
                    </th>
                    <th className="number-column">
                      Alacak
                    </th>
                    <th className="number-column">
                      Bakiye
                    </th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>

                  {filteredCustomers.map((customer) => (

                    <tr key={customer.id}>

                      <td>
                        <Link
                          to={`/customers/${customer.id}`}
                          className="customer-name"
                        >
                          <span className="customer-avatar">
                            {getInitials(customer.name)}
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
                        <span
                          className={
                            customer.due === "Peşin"
                              ? "due-badge cash"
                              : "due-badge"
                          }
                        >
                          {customer.due}
                        </span>
                      </td>

                      <td className="number-column">
                        {formatCurrency(customer.debit)}
                      </td>

                      <td className="number-column">
                        {formatCurrency(customer.credit)}
                      </td>

                      <td className="number-column">

                        <span
                          className={
                            customer.balance > 0
                              ? "balance positive"
                              : customer.balance < 0
                              ? "balance negative"
                              : "balance zero"
                          }
                        >
                          {formatCurrency(
                            Math.abs(customer.balance)
                          )}

                          {customer.balance > 0 && (
                            <small>Borç</small>
                          )}

                          {customer.balance < 0 && (
                            <small>Alacak</small>
                          )}

                          {customer.balance === 0 && (
                            <small>Kapalı</small>
                          )}
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

          ) : (

            <div className="customer-empty">

              <div className="empty-icon">
                🔎
              </div>

              <h3>
                Cari bulunamadı
              </h3>

              <p>
                Arama veya filtre kriterlerinize uygun cari
                bulunamadı.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("Tümü");
                  setBalanceFilter("Tümü");
                }}
              >
                Filtreleri Temizle
              </button>

            </div>

          )}

        </div>

      </div>
    </div>
  );
}