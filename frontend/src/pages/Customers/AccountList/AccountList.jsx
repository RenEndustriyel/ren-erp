import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MdAdd,
  MdDownload,
  MdUpload,
  MdTableChart,
  MdPrint,
  MdKeyboardArrowDown,
  MdPersonAdd,
  MdLocalShipping,
  MdPayments,
  MdAccountBalanceWallet,
  MdContentCopy,
  MdArchive,
  MdDelete,
  MdSearch,
  MdFilterList,
  MdMoreHoriz,
  MdEdit,
  MdDescription,
} from "react-icons/md";

import "./AccountList.css";

const darkForceStyles = `
  .account-page {
    background: #14212b !important;
    color: #e8eef2 !important;
  }

  .account-page .summary-card,
  .account-page .table-card {
    background: #1b2a34 !important;
    border-color: #2c3c47 !important;
  }

  .account-page .table-card th,
  .account-page .table-footer,
  .account-page .tabs {
    background: #172731 !important;
    border-color: #2c3c47 !important;
  }

  .account-page .table-card td {
    border-color: #273842 !important;
    color: #b7c3c9 !important;
  }

  .account-page .page-header h1,
  .account-page .company,
  .account-page .summary-card h3 {
    color: #edf3f6 !important;
  }

  .account-page .page-header p,
  .account-page .page-breadcrumb,
  .account-page .summary-card span,
  .account-page .table-footer {
    color: #91a0aa !important;
  }

  .account-page .search-box {
    background: #172731 !important;
    border-color: #344752 !important;
  }

  .account-page .search-box input {
    background: transparent !important;
    color: #edf3f6 !important;
  }

  .account-page .btn-outline {
    background: #1b2a34 !important;
    border-color: #344752 !important;
    color: #cbd6dc !important;
  }

  .account-page .btn-green {
    background: #39a978 !important;
    border-color: #39a978 !important;
    color: #fff !important;
  }

  .account-page .tabs button {
    color: #8fa0aa !important;
  }

  .account-page .tabs button.active {
    background: #39a978 !important;
    color: #fff !important;
  }

  .account-page .row-actions button,
  .account-page .pagination button {
    background: #202f39 !important;
    border-color: #344752 !important;
    color: #9aa9b2 !important;
  }

  .account-page .actions-dropdown {
    background: #1b2a34 !important;
    border-color: #344752 !important;
  }

  .account-page .actions-dropdown button {
    color: #d7e0e5 !important;
  }
`;

export default function AccountList() {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const accounts = [
    {
      name: "Susurluk Anadolu Lisesi",
      type: "Müşteri",
      contact: "Ahmet Yılmaz",
      phone: "0542 123 45 67",
      tax: "1234567890",
      balance: 12450,
      overdue: 2500,
    },
    {
      name: "Poyraz Gıda Ltd. Şti.",
      type: "Tedarikçi",
      contact: "Mehmet Kaya",
      phone: "0532 987 65 43",
      tax: "9876543210",
      balance: -8750,
      overdue: 0,
    },
    {
      name: "Susurluk Belediyesi",
      type: "Müşteri",
      contact: "Fatma Demir",
      phone: "0533 111 22 33",
      tax: "5556667778",
      balance: 5300,
      overdue: 0,
    },
    {
      name: "Temiz Kimya A.Ş.",
      type: "Tedarikçi",
      contact: "Ali Can",
      phone: "0541 222 33 44",
      tax: "1112223334",
      balance: -15600,
      overdue: 7200,
    },
  ];

  const tl = (n) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(Math.abs(n));

  return (
    <>
      <style>{darkForceStyles}</style>

      <div
        className="account-page"
        style={{
          background: "#14212b",
          color: "#e8eef2",
        }}
      >
        <div className="page-breadcrumb">
          Anasayfa / Müşteri - Tedarikçi / Hesap Listesi
        </div>

        <div className="page-header">
          <div>
            <h1>Hesap Listesi</h1>
            <p>Müşterilerinizi ve tedarikçilerinizi yönetin.</p>
          </div>

          <div className="header-actions">
            <button className="btn-outline">
              <MdDownload /> Dışa Aktar
            </button>

            <button className="btn-outline">
              <MdUpload /> İçe Aktar
            </button>

            <button className="btn-outline">
              <MdTableChart /> Excel
            </button>

            <button className="btn-outline">
              <MdPrint /> Yazdır
            </button>

            <div className="actions-menu">
              <button
                className="btn-outline"
                onClick={() => setShowActions((prev) => !prev)}
              >
                İşlemler <MdKeyboardArrowDown />
              </button>

              {showActions && (
                <div className="actions-dropdown">
                  <button
                    onClick={() =>
                      navigate("/customers/new?type=customer")
                    }
                  >
                    <MdPersonAdd />
                    Yeni Müşteri
                  </button>

                  <button
                    onClick={() =>
                      navigate("/customers/new?type=supplier")
                    }
                  >
                    <MdLocalShipping />
                    Yeni Tedarikçi
                  </button>

                  <button>
                    <MdPayments />
                    Tahsilat Yap
                  </button>

                  <button>
                    <MdAccountBalanceWallet />
                    Ödeme Yap
                  </button>

                  <div className="divider"></div>

                  <button>
                    <MdContentCopy />
                    Hesabı Kopyala
                  </button>

                  <button>
                    <MdArchive />
                    Pasife Al / Aktif Et
                  </button>

                  <button className="danger">
                    <MdDelete />
                    Toplu Sil
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn-green"
              onClick={() => navigate("/customers/new")}
            >
              <MdAdd /> Yeni Hesap
            </button>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card blue">
            <div className="icon">👥</div>
            <div>
              <span>Toplam Hesap</span>
              <h3>42</h3>
            </div>
          </div>

          <div className="summary-card green">
            <div className="icon">👤</div>
            <div>
              <span>Müşteri Sayısı</span>
              <h3>31</h3>
            </div>
          </div>

          <div className="summary-card purple">
            <div className="icon">🚚</div>
            <div>
              <span>Tedarikçi Sayısı</span>
              <h3>11</h3>
            </div>
          </div>

          <div className="summary-card red">
            <div className="icon">❗</div>
            <div>
              <span>Vadesi Geçmiş Alacak</span>
              <h3>₺24.750,00</h3>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button className="active">Tümü (42)</button>
          <button>Müşteriler (31)</button>
          <button>Tedarikçiler (11)</button>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <MdSearch />
            <input placeholder="Ünvan, yetkili, telefon, e-posta veya vergi no ile ara..." />
          </div>

          <button className="btn-outline">
            <MdFilterList />
            Filtrele
          </button>

          <button className="btn-outline">Sütunlar</button>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>ÜNVAN</th>
                <th>TÜR</th>
                <th>YETKİLİ</th>
                <th>TELEFON</th>
                <th>VERGİ NO</th>
                <th>BAKİYE</th>
                <th>VADESİ GEÇMİŞ</th>
                <th>DURUM</th>
                <th>İŞLEMLER</th>
              </tr>
            </thead>

            <tbody>
              {accounts.map((a, i) => (
                <tr key={i}>
                  <td>
                    <input type="checkbox" />
                  </td>

                  <td className="company">{a.name}</td>

                  <td>
                    <span
                      className={`type ${
                        a.type === "Müşteri"
                          ? "customer"
                          : "supplier"
                      }`}
                    >
                      {a.type}
                    </span>
                  </td>

                  <td>{a.contact}</td>

                  <td>{a.phone}</td>

                  <td>{a.tax}</td>

                  <td
                    className={
                      a.balance >= 0 ? "positive" : "negative"
                    }
                  >
                    {a.balance >= 0 ? "" : "-"}
                    {tl(a.balance)}
                  </td>

                  <td className={a.overdue ? "negative" : ""}>
                    {tl(a.overdue)}
                  </td>

                  <td>
                    <span className="status">Aktif</span>
                  </td>

                  <td className="row-actions">
                    <button title="Düzenle">
                      <MdEdit />
                    </button>

                    <button title="Detay">
                      <MdDescription />
                    </button>

                    <button title="Diğer">
                      <MdMoreHoriz />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-footer">
            <span>Toplam 42 hesap</span>

            <div className="pagination">
              <button>{"<"}</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>{">"}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}