import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdAddBusiness,
  MdAddShoppingCart,
  MdAddBox,
  MdApps,
  MdArrowDropDown,
  MdArrowForwardIos,
  MdAssignment,
  MdBarChart,
  MdBusiness,
  MdCalendarMonth,
  MdCategory,
  MdClose,
  MdDashboard,
  MdDescription,
  MdExpandLess,
  MdExpandMore,
  MdGroup,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdMenu,
  MdNotificationsNone,
  MdPayments,
  MdPersonAdd,
  MdPointOfSale,
  MdReceiptLong,
  MdSettings,
  MdShoppingCart,
  MdStorefront,
  MdSupportAgent,
  MdAccountBalanceWallet,
} from "react-icons/md";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import "./Layout.css";
import "../../styles/cari-status.css";

const MENU = {
  stock: [
    ["/stock/list", "Stok Listesi", MdStorefront],
    ["/stock/new", "Yeni Stok", MdAddBox],
    ["/stock/categories", "Kategoriler", MdCategory],
    ["/stock/brands", "Markalar", MdBusiness],
    ["/stock/units", "Birimler", MdApps],
    ["/stock/movements", "Stok Hareketleri", MdBarChart],
    ["/stock/bulk", "Toplu İşlemler", MdDescription],
  ],
  customers: [
    ["/customers", "Hesap Listesi", MdGroup, true],
    ["/customers/new", "Yeni Hesap", MdPersonAdd],
    ["/customers/movements", "Cari Hareket", MdReceiptLong],
    ["/customers/transfer", "Cari Virman", MdArrowForwardIos],
    ["/customers/collections", "Tahsilat", MdPayments],
    ["/customers/payments", "Ödeme", MdPointOfSale],
    ["/customers/due-tracking", "Vade Takibi", MdCalendarMonth],
    ["/customers/reports", "Cari Raporlar", MdBarChart],
  ],
  orders: [
    ["/orders?type=all", "Tüm Sipariş / Teklifler", MdAssignment],
    ["/orders?type=offer", "Teklifler", MdDescription],
    ["/orders?type=new-offer", "Yeni Teklif", MdAddBox],
    ["/orders?type=order", "Siparişler", MdShoppingCart],
    ["/orders?type=new-order", "Yeni Sipariş", MdAddShoppingCart],
    ["/orders?type=converted", "Tekliften Siparişe", MdArrowForwardIos],
    ["/orders?type=invoice", "Siparişten Faturaya", MdReceiptLong],
    ["/orders?type=reports", "Sipariş / Teklif Raporu", MdBarChart],
  ],
  invoices: [
    ["/invoices", "Fatura Listesi", MdDescription, true],
    ["/invoices/new", "Yeni Fatura", MdAddBox],
    ["/invoices/sales", "Satış Faturaları", MdPointOfSale],
    ["/invoices/purchases", "Alış Faturaları", MdShoppingCart],
    ["/invoices/returns", "İade Faturaları", MdReceiptLong],
    ["/invoices/reports", "Fatura Raporları", MdBarChart],
  ],
  cash: [
    ["/cash-bank/accounts", "Kasa ve Bankalar", MdAccountBalanceWallet],
    ["/cash-bank/checks", "Çekler", MdDescription],
    ["/cash-bank/reports", "Kasa / Banka Raporu", MdBarChart],
    ["/cash-bank/cash-flow", "Nakit Akışı Raporu", MdPayments],
  ],
};

function GroupButton({
  label,
  icon: Icon,
  open,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`ren-menu-item ren-menu-parent ${active ? "section-active" : ""}`}
      onClick={onClick}
    >
      <span className="ren-menu-icon">
        <Icon />
      </span>
      <span className="ren-menu-label">{label}</span>
      <span className="ren-menu-arrow">
        {open ? <MdExpandLess /> : <MdExpandMore />}
      </span>
    </button>
  );
}

function Submenu({ items }) {
  return (
    <div className="ren-submenu">
      {items.map(([to, label, Icon, exact]) => (
        <NavLink
          key={`${to}-${label}`}
          to={to}
          end={Boolean(exact)}
          className={({ isActive }) =>
            `ren-submenu-item ${isActive ? "active" : ""}`
          }
        >
          <span className="ren-submenu-icon">
            <Icon />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
}

function SimpleMenuItem({
  to,
  label,
  icon: Icon,
  active,
  end = false,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `ren-menu-item ${active || isActive ? "active" : ""}`
      }
    >
      <span className="ren-menu-icon">
        <Icon />
      </span>
      <span className="ren-menu-label">{label}</span>
    </NavLink>
  );
}

function QuickActionMenu({ onNavigate }) {
  const actions = useMemo(
    () => [
      {
        label: "Yeni Cari",
        icon: MdPersonAdd,
        path: "/customers/new",
      },
      {
        label: "Yeni Satış",
        icon: MdPointOfSale,
        path: "/quick-sale",
      },
      {
        label: "Yeni Alış",
        icon: MdShoppingCart,
        path: "/invoices/new",
      },
      {
        label: "Yeni Ürün",
        icon: MdAddBox,
        path: "/stock/new",
      },
      {
        label: "Proje Ekle",
        icon: MdAssignment,
        path: "/orders?type=new-order",
        note: "Sipariş / teklif alanı",
      },
    ],
    []
  );

  return (
    <div className="ren-quick-menu">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            type="button"
            className="ren-quick-menu-item"
            key={action.label}
            onClick={() => onNavigate(action.path)}
          >
            <span className="ren-quick-menu-icon">
              <Icon />
            </span>

            <span className="ren-quick-menu-copy">
              <strong>{action.label}</strong>
              {action.note ? <small>{action.note}</small> : null}
            </span>

            <MdKeyboardArrowRight className="ren-quick-menu-arrow" />
          </button>
        );
      })}
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const quickMenuRef = useRef(null);

  const [stockOpen, setStockOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [uiMode, setUiMode] = useState(
    () => localStorage.getItem("ren_ui_mode") || "basic"
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ren_theme") || "light"
  );

  const pathname = location.pathname;

  const isStockPage = pathname.startsWith("/stock");
  const isCustomerPage = pathname.startsWith("/customers");
  const isOrdersPage = pathname.startsWith("/orders");
  const isInvoicePage = pathname.startsWith("/invoices");
  const isCashPage = pathname.startsWith("/cash-bank");
  const isQuickSalePage = pathname.startsWith("/quick-sale");

  useEffect(() => {
    setSidebarOpen(false);
    setQuickOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isStockPage) setStockOpen(true);
    if (isCustomerPage) setCustomerOpen(true);
    if (isOrdersPage) setOrdersOpen(true);
    if (isInvoicePage) setInvoiceOpen(true);
    if (isCashPage) setCashOpen(true);
  }, [
    isStockPage,
    isCustomerPage,
    isOrdersPage,
    isInvoicePage,
    isCashPage,
  ]);

  useEffect(() => {
    const closeQuickMenu = (event) => {
      if (
        quickMenuRef.current &&
        !quickMenuRef.current.contains(event.target)
      ) {
        setQuickOpen(false);
      }
    };

    document.addEventListener("mousedown", closeQuickMenu);

    return () => {
      document.removeEventListener("mousedown", closeQuickMenu);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("ren_ui_mode", uiMode);
  }, [uiMode]);

  useEffect(() => {
    localStorage.setItem("ren_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (sidebarOpen && window.innerWidth <= 900) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const runQuickAction = (path) => {
    setQuickOpen(false);
    navigate(path);
  };

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  return (
    <div className={`ren-layout ren-ui-${uiMode} ren-theme-${theme}`}>
      {sidebarOpen ? (
        <button
          type="button"
          className="ren-sidebar-overlay"
          aria-label="Menüyü kapat"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`ren-sidebar ${sidebarOpen ? "mobile-open" : ""}`}
      >
        <div className="ren-logo">
          <div className="ren-logo-mark">
            <span>R</span>
          </div>

          <div className="ren-logo-copy">
            <div className="ren-logo-title">REN ERP</div>
            <div className="ren-logo-subtitle">
              İşletme Yönetim Sistemi
            </div>
          </div>

          <button
            type="button"
            className="ren-mobile-close"
            aria-label="Menüyü kapat"
            onClick={() => setSidebarOpen(false)}
          >
            <MdClose />
          </button>
        </div>

        <nav className="ren-menu">
          <div className="ren-menu-section">GENEL</div>

          <SimpleMenuItem
            to="/dashboard"
            label="Genel Bakış"
            icon={MdDashboard}
            end
          />

          <SimpleMenuItem
            to="/quick-sale"
            label="Hızlı Satış"
            icon={MdPointOfSale}
            active={isQuickSalePage}
          />

          <div className="ren-menu-divider" />

          <GroupButton
            label="Stok"
            icon={MdStorefront}
            open={stockOpen}
            active={isStockPage}
            onClick={() => setStockOpen((value) => !value)}
          />
          {stockOpen ? <Submenu items={MENU.stock} /> : null}

          <GroupButton
            label="Müşteri - Tedarikçi"
            icon={MdGroup}
            open={customerOpen}
            active={isCustomerPage}
            onClick={() =>
              setCustomerOpen((value) => !value)
            }
          />
          {customerOpen ? (
            <Submenu items={MENU.customers} />
          ) : null}

          <GroupButton
            label="Sipariş - Teklif"
            icon={MdAssignment}
            open={ordersOpen}
            active={isOrdersPage}
            onClick={() => setOrdersOpen((value) => !value)}
          />
          {ordersOpen ? <Submenu items={MENU.orders} /> : null}

          <GroupButton
            label="Faturalar"
            icon={MdDescription}
            open={invoiceOpen}
            active={isInvoicePage}
            onClick={() =>
              setInvoiceOpen((value) => !value)
            }
          />
          {invoiceOpen ? (
            <Submenu items={MENU.invoices} />
          ) : null}

          <GroupButton
            label="Nakit"
            icon={MdAccountBalanceWallet}
            open={cashOpen}
            active={isCashPage}
            onClick={() => setCashOpen((value) => !value)}
          />
          {cashOpen ? <Submenu items={MENU.cash} /> : null}

          <SimpleMenuItem
            to="/reports"
            label="Raporlar"
            icon={MdBarChart}
          />

          <SimpleMenuItem
            to="/assistant"
            label="REN AI"
            icon={MdApps}
          />

          <SimpleMenuItem
            to="/settings"
            label="Ayarlar"
            icon={MdSettings}
          />
        </nav>

        <div className="ren-sidebar-bottom">
          <div className="ren-user-card">
            <div className="ren-user-avatar">R</div>

            <div className="ren-user-info">
              <strong>REN Endüstriyel</strong>
              <span>Yönetici</span>
            </div>

            <MdKeyboardArrowDown className="ren-user-arrow" />
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
              onClick={() => setSidebarOpen(true)}
            >
              <MdMenu />
            </button>

            <div className="ren-breadcrumb">
              <span>Anasayfa</span>
              <b>/</b>
              <strong>
                {pathname === "/dashboard"
                  ? "Özet"
                  : pathname === "/quick-sale"
                  ? "Hızlı Satış"
                  : pathname.startsWith("/stock")
                  ? "Stok"
                  : pathname.startsWith("/customers")
                  ? "Cari"
                  : pathname.startsWith("/invoices")
                  ? "Faturalar"
                  : pathname.startsWith("/cash-bank")
                  ? "Nakit"
                  : pathname.startsWith("/reports")
                  ? "Raporlar"
                  : pathname.startsWith("/orders")
                  ? "Sipariş - Teklif"
                  : "REN ERP"}
              </strong>
            </div>
          </div>

          <div className="ren-topbar-right">
            <div className="ren-view-switch">
              <button
                type="button"
                className={uiMode === "basic" ? "active" : ""}
                onClick={() => setUiMode("basic")}
              >
                Temel
              </button>

              <button
                type="button"
                className={uiMode === "advanced" ? "active" : ""}
                onClick={() => setUiMode("advanced")}
              >
                Gelişmiş
              </button>
            </div>

            <button
              type="button"
              className="ren-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Gündüz görünümüne geç" : "Gece görünümüne geç"}
              title={theme === "dark" ? "Gündüz görünümü" : "Gece görünümü"}
            >
              {theme === "dark" ? "☀" : "☾"}
              <span>{theme === "dark" ? "Gündüz" : "Gece"}</span>
            </button>

            <div className="ren-quick-action-wrap" ref={quickMenuRef}>
              <button
                type="button"
                className={`ren-quick-action-button ${
                  quickOpen ? "open" : ""
                }`}
                onClick={() => setQuickOpen((value) => !value)}
              >
                <MdAddBox />
                Hızlı İşlem
                <MdArrowDropDown />
              </button>

              {quickOpen ? (
                <QuickActionMenu onNavigate={runQuickAction} />
              ) : null}
            </div>

            <button
              type="button"
              className="ren-topbar-icon-button"
              aria-label="Uygulamalar"
            >
              <MdApps />
            </button>

            <button
              type="button"
              className="ren-topbar-icon-button ren-notification-button"
              aria-label="Bildirimler"
            >
              <MdNotificationsNone />
              <span />
            </button>

            <div className="ren-profile">
              <div className="ren-profile-avatar">ME</div>

              <div className="ren-profile-info">
                <strong>Mehmet</strong>
                <span>REN Endüstriyel</span>
              </div>

              <MdKeyboardArrowDown className="ren-profile-arrow" />
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
