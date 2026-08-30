import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import "./Layout.css";
import "../../styles/cari-status.css";

export default function Layout() {
  const location = useLocation();

  const [stockOpen, setStockOpen] =
    useState(false);

  const [customerOpen, setCustomerOpen] =
    useState(false);

  const [ordersOpen, setOrdersOpen] =
    useState(false);

  const [invoiceOpen, setInvoiceOpen] =
    useState(false);

  const [cashOpen, setCashOpen] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const isStockPage =
    location.pathname.startsWith(
      "/stock"
    );

  const isCustomerPage =
    location.pathname.startsWith(
      "/customers"
    );

  const isOrdersPage =
    location.pathname.startsWith(
      "/orders"
    );

  const isInvoicePage =
    location.pathname.startsWith(
      "/invoices"
    );

  const isCashPage =
    location.pathname.startsWith(
      "/cash-bank"
    );

  const isQuickSalePage =
    location.pathname.startsWith(
      "/quick-sale"
    );

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (
      sidebarOpen &&
      window.innerWidth <= 650
    ) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [sidebarOpen]);

  return (
    <div className="ren-layout">

      {sidebarOpen && (
        <button
          type="button"
          className="ren-sidebar-overlay"
          aria-label="Menüyü kapat"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <aside
        className={`ren-sidebar ${
          sidebarOpen
            ? "mobile-open"
            : ""
        }`}
      >

        {/* LOGO */}

        <div className="ren-logo">

          <div className="ren-logo-mark">
            R
          </div>

          <div>
            <div className="ren-logo-title">
              REN ERP
            </div>

            <div className="ren-logo-subtitle">
              İşletme Yönetim Sistemi
            </div>
          </div>

          <button
            type="button"
            className="ren-mobile-close"
            aria-label="Menüyü kapat"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ×
          </button>

        </div>

        {/* MENÜ */}

        <nav className="ren-menu">

          <div className="ren-menu-section">
            GENEL
          </div>


          {/* GENEL BAKIŞ */}

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `ren-menu-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="ren-menu-icon">
              ▦
            </span>

            <span>
              Genel Bakış
            </span>

          </NavLink>


          {/* HIZLI SATIŞ */}

          <NavLink
            to="/quick-sale"
            className={
              `ren-menu-item ${
                isQuickSalePage
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="ren-menu-icon">
              ₺
            </span>

            <span>
              Hızlı Satış
            </span>

          </NavLink>


          {/* STOK */}

          <button
            type="button"
            className={`ren-menu-item ren-menu-parent ${
              isStockPage
                ? "section-active"
                : ""
            }`}
            onClick={() =>
              setStockOpen(
                (value) =>
                  !value
              )
            }
          >

            <span className="ren-menu-icon">
              ▣
            </span>

            <span>
              Stok
            </span>

            <span className="ren-menu-arrow">
              {stockOpen
                ? "⌃"
                : "⌄"}
            </span>

          </button>


          {stockOpen && (
            <div className="ren-submenu">

              <NavLink
                to="/stock/list"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Stok Listesi
              </NavLink>

              <NavLink
                to="/stock/new"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Yeni Stok
              </NavLink>

              <NavLink
                to="/stock/categories"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Kategoriler
              </NavLink>

              <NavLink
                to="/stock/brands"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Markalar
              </NavLink>

              <NavLink
                to="/stock/units"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Birimler
              </NavLink>

              <NavLink
                to="/stock/movements"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Stok Hareketleri
              </NavLink>

              <NavLink
                to="/stock/bulk"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Toplu İşlemler
              </NavLink>

            </div>
          )}


          {/* MÜŞTERİ - TEDARİKÇİ */}

          <button
            type="button"
            className={`ren-menu-item ren-menu-parent ${
              isCustomerPage
                ? "section-active"
                : ""
            }`}
            onClick={() =>
              setCustomerOpen(
                (value) =>
                  !value
              )
            }
          >

            <span className="ren-menu-icon">
              ◉
            </span>

            <span>
              Müşteri - Tedarikçi
            </span>

            <span className="ren-menu-arrow">
              {customerOpen
                ? "⌃"
                : "⌄"}
            </span>

          </button>


          {customerOpen && (
            <div className="ren-submenu">

              <NavLink
                to="/customers"
                end
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Hesap Listesi
              </NavLink>

              <NavLink
                to="/customers/new"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Yeni Hesap
              </NavLink>

              <NavLink
                to="/customers/movements"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Cari Hareket
              </NavLink>

              <NavLink
                to="/customers/transfer"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Cari Virman
              </NavLink>

              <NavLink
                to="/customers/collections"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Tahsilat
              </NavLink>

              <NavLink
                to="/customers/payments"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Ödeme
              </NavLink>

              <NavLink
                to="/customers/due-tracking"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Vade Takibi
              </NavLink>

              <NavLink
                to="/customers/reports"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Cari Raporlar
              </NavLink>

            </div>
          )}


          {/* SİPARİŞ - TEKLİF */}

          <button
            type="button"
            className={`ren-menu-item ren-menu-parent ${
              isOrdersPage
                ? "section-active"
                : ""
            }`}
            onClick={() =>
              setOrdersOpen(
                (value) =>
                  !value
              )
            }
          >

            <span className="ren-menu-icon">
              ▤
            </span>

            <span>
              Sipariş - Teklif
            </span>

            <span className="ren-menu-arrow">
              {ordersOpen
                ? "⌃"
                : "⌄"}
            </span>

          </button>


          {ordersOpen && (
            <div className="ren-submenu">

              <NavLink
                to="/orders?type=all"
                className="ren-submenu-item"
              >
                Tüm Sipariş / Teklifler
              </NavLink>

              <NavLink
                to="/orders?type=offer"
                className="ren-submenu-item"
              >
                Teklifler
              </NavLink>

              <NavLink
                to="/orders?type=new-offer"
                className="ren-submenu-item"
              >
                Yeni Teklif
              </NavLink>

              <NavLink
                to="/orders?type=order"
                className="ren-submenu-item"
              >
                Siparişler
              </NavLink>

              <NavLink
                to="/orders?type=new-order"
                className="ren-submenu-item"
              >
                Yeni Sipariş
              </NavLink>

              <NavLink
                to="/orders?type=converted"
                className="ren-submenu-item"
              >
                Tekliften Siparişe
              </NavLink>

              <NavLink
                to="/orders?type=invoice"
                className="ren-submenu-item"
              >
                Siparişten Faturaya
              </NavLink>

              <NavLink
                to="/orders?type=reports"
                className="ren-submenu-item"
              >
                Sipariş / Teklif Raporu
              </NavLink>

            </div>
          )}


          {/* FATURALAR */}

          <button
            type="button"
            className={`ren-menu-item ren-menu-parent ${
              isInvoicePage
                ? "section-active"
                : ""
            }`}
            onClick={() =>
              setInvoiceOpen(
                (value) =>
                  !value
              )
            }
          >

            <span className="ren-menu-icon">
              ▥
            </span>

            <span>
              Faturalar
            </span>

            <span className="ren-menu-arrow">
              {invoiceOpen
                ? "⌃"
                : "⌄"}
            </span>

          </button>


          {invoiceOpen && (
            <div className="ren-submenu">

              <NavLink
                to="/invoices"
                end
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Fatura Listesi
              </NavLink>

              <NavLink
                to="/invoices/new"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Yeni Fatura
              </NavLink>

              <NavLink
                to="/invoices/sales"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Satış Faturaları
              </NavLink>

              <NavLink
                to="/invoices/purchases"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Alış Faturaları
              </NavLink>

              <NavLink
                to="/invoices/returns"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                İade Faturaları
              </NavLink>

              <NavLink
                to="/invoices/reports"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Fatura Raporları
              </NavLink>

            </div>
          )}


          {/* NAKİT */}

          <button
            type="button"
            className={`ren-menu-item ren-menu-parent ${
              isCashPage
                ? "section-active"
                : ""
            }`}
            onClick={() =>
              setCashOpen(
                (value) =>
                  !value
              )
            }
          >

            <span className="ren-menu-icon">
              ₺
            </span>

            <span>
              Nakit
            </span>

            <span className="ren-menu-arrow">
              {cashOpen
                ? "⌃"
                : "⌄"}
            </span>

          </button>


          {cashOpen && (
            <div className="ren-submenu">

              <NavLink
                to="/cash-bank/accounts"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Kasa ve Bankalar
              </NavLink>

              <NavLink
                to="/cash-bank/checks"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Çekler
              </NavLink>

              <NavLink
                to="/cash-bank/reports"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Kasa / Banka Raporu
              </NavLink>

              <NavLink
                to="/cash-bank/cash-flow"
                className={({ isActive }) =>
                  `ren-submenu-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                Nakit Akışı Raporu
              </NavLink>

            </div>
          )}


          {/* RAPORLAR */}

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `ren-menu-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="ren-menu-icon">
              ▥
            </span>

            <span>
              Raporlar
            </span>

          </NavLink>


          {/* REN AI */}

          <NavLink
            to="/assistant"
            className={({ isActive }) =>
              `ren-menu-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="ren-menu-icon">
              ✦
            </span>

            <span>
              REN AI
            </span>

          </NavLink>


          {/* AYARLAR */}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `ren-menu-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="ren-menu-icon">
              ⚙
            </span>

            <span>
              Ayarlar
            </span>

          </NavLink>

        </nav>


        <div className="ren-sidebar-bottom">

          <div className="ren-user-card">

            <div className="ren-user-avatar">
              R
            </div>

            <div className="ren-user-info">

              <strong>
                REN Endüstriyel
              </strong>

              <span>
                Yönetici
              </span>

            </div>

          </div>

        </div>

      </aside>


      <main className="ren-main">

        <header className="ren-topbar">

          <div className="ren-topbar-left">

            <button
              type="button"
              className="ren-mobile-menu-button"
              aria-label="Menüyü aç"
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
            >
              ☰
            </button>

            <div className="ren-topbar-title">
              REN ERP
            </div>

          </div>


          <div className="ren-topbar-right">

            <button
              type="button"
              className="ren-topbar-button"
            >
              ?
            </button>


            <div className="ren-profile">

              <div className="ren-profile-avatar">
                ME
              </div>

              <div className="ren-profile-info">

                <strong>
                  Mehmet
                </strong>

                <span>
                  REN Endüstriyel
                </span>

              </div>

            </div>

          </div>

        </header>


        <div className="ren-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}