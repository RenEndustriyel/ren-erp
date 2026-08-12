import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../../theme/ThemeContext";
import "./Layout.css";

const menuGroups = [
  {
    id: "stock",
    icon: "▣",
    title: "Stok & Ürünler",
    items: [
      { label: "Ürünler", path: "/products" },
      { label: "Yeni Ürün", path: "/products/new" },
      { label: "Stok Listesi", path: "/stock" },
      { label: "Stok Hareketleri", path: "/stock/movements" },
      { label: "Stok Sayımı", path: "/stock/count" },
      { label: "Kritik Stoklar", path: "/stock/critical" },
      { label: "Barkod & Etiket", path: "/stock/barcode" },
    ],
  },

  {
    id: "sales",
    icon: "🛒",
    title: "Satış",
    items: [
      { label: "Yeni Satış", path: "/sales/new" },
      { label: "Satışlar", path: "/sales" },
      { label: "Satış Hareketleri", path: "/sales/movements" },
      { label: "Hızlı Satış", path: "/sales/quick" },
    ],
  },

  {
    id: "invoices",
    icon: "▤",
    title: "Faturalar",
    items: [
      { label: "Yeni Fatura", path: "/invoices/new" },
      { label: "Fatura Listesi", path: "/invoices" },
      { label: "Satış Faturaları", path: "/invoices/sales" },
      { label: "Alış Faturaları", path: "/invoices/purchases" },
      { label: "İade Faturaları", path: "/invoices/returns" },
    ],
  },

  {
    id: "customers",
    icon: "♟",
    title: "Cari",
    items: [
      { label: "Cari Listesi", path: "/customers" },
      { label: "Yeni Cari", path: "/customers/new" },
      { label: "Cari Hareketleri", path: "/customers/movements" },
      { label: "Cari Ekstre", path: "/customers/statements" },
      { label: "Tahsilatlar", path: "/collections" },
      { label: "Ödeme Takibi", path: "/payments" },
    ],
  },

  {
    id: "purchases",
    icon: "↓",
    title: "Alışlar",
    items: [
      { label: "Yeni Alış", path: "/purchases/new" },
      { label: "Alış Listesi", path: "/purchases" },
      { label: "Alış Hareketleri", path: "/purchases/movements" },
      { label: "Tedarikçiler", path: "/suppliers" },
    ],
  },

  {
    id: "orders",
    icon: "☷",
    title: "Sipariş & Teklif",
    items: [
      { label: "Yeni Sipariş", path: "/orders/new" },
      { label: "Siparişler", path: "/orders" },
      { label: "Yeni Teklif", path: "/offers/new" },
      { label: "Teklifler", path: "/offers" },
      { label: "Bekleyen Siparişler", path: "/orders/pending" },
    ],
  },

  {
    id: "cash",
    icon: "₺",
    title: "Kasa & Banka",
    items: [
      { label: "Yeni Kasa Hareketi", path: "/cash/new" },
      { label: "Kasa Hareketleri", path: "/cash/movements" },
      { label: "Kasa Listesi", path: "/cash" },
      { label: "Masraf Girişi", path: "/expenses/new" },
      { label: "Kasa Virman", path: "/cash/transfer" },
      { label: "Banka Hesapları", path: "/banks" },
      { label: "Banka Entegrasyonu", path: "/banks/integration" },
    ],
  },

  {
    id: "dispatch",
    icon: "▱",
    title: "İrsaliye",
    items: [
      { label: "Yeni İrsaliye", path: "/dispatch/new" },
      { label: "İrsaliye Listesi", path: "/dispatch" },
      { label: "Sevk İşlemleri", path: "/dispatch/shipping" },
    ],
  },

  {
    id: "reports",
    icon: "▥",
    title: "Raporlar",
    items: [
      { label: "Genel Raporlar", path: "/reports" },
      { label: "Stok Raporları", path: "/reports/stock" },
      { label: "Cari Raporları", path: "/reports/customers" },
      { label: "Satış Raporları", path: "/reports/sales" },
      { label: "Alış Raporları", path: "/reports/purchases" },
      { label: "Kasa Raporları", path: "/reports/cash" },
      { label: "Kâr / Zarar", path: "/reports/profit" },
      { label: "KDV Raporları", path: "/reports/vat" },
    ],
  },

  {
    id: "settings",
    icon: "⚙",
    title: "Ayarlar",
    items: [
      { label: "Genel Ayarlar", path: "/settings" },
      { label: "Şirket Bilgileri", path: "/settings/company" },
      { label: "Kullanıcılar", path: "/settings/users" },
      { label: "Yetkilendirme", path: "/settings/permissions" },
      { label: "Birimler", path: "/settings/units" },
      { label: "KDV Ayarları", path: "/settings/vat" },
    ],
  },
];

function SidebarGroup({
  group,
  openGroup,
  setOpenGroup,
}) {
  const location = useLocation();

  const isActive = group.items.some(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`)
  );

  const isOpen = openGroup === group.id;

  const toggleGroup = () => {
    setOpenGroup(isOpen ? null : group.id);
  };

  return (
    <div className={`ren-menu-group ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className={`ren-menu-group-button ${
          isActive ? "has-active" : ""
        }`}
        onClick={toggleGroup}
      >
        <span className="ren-menu-left">
          <span className="ren-menu-icon">
            {group.icon}
          </span>

          <span>{group.title}</span>
        </span>

        <span className="ren-menu-arrow">
          {isOpen ? "⌄" : "›"}
        </span>
      </button>

      <div
        className={`ren-submenu ${
          isOpen ? "submenu-open" : ""
        }`}
      >
        {group.items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `ren-submenu-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="ren-submenu-dot">
              •
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const [openGroup, setOpenGroup] = useState(null);

  const {
    isDark,
    toggleTheme,
  } = useTheme();

  return (
    <div className="ren-app-shell">
      {/* SOL MENÜ */}
      <aside className="ren-sidebar">
        <div className="ren-brand">
          <div className="ren-brand-name">
            REN ERP
          </div>

          <div className="ren-brand-subtitle">
            Endüstriyel Yönetim Sistemi
          </div>
        </div>

        <div className="ren-sidebar-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Menüde ara..."
          />
        </div>

        <nav className="ren-sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `ren-main-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="ren-menu-icon">
              ⌂
            </span>

            <span>Genel Bakış</span>
          </NavLink>

          {menuGroups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              openGroup={openGroup}
              setOpenGroup={setOpenGroup}
            />
          ))}

          <NavLink
            to="/ren-ai"
            className={({ isActive }) =>
              `ren-ai-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="ren-ai-icon">
              ✦
            </span>

            <span className="ren-ai-text">
              <strong>REN AI</strong>

              <small>
                Akıllı Asistan
              </small>
            </span>

            <span className="ren-ai-status" />
          </NavLink>
        </nav>

        {/* TEMA */}
        <div className="ren-theme-toggle">
          <button
            type="button"
            onClick={toggleTheme}
            title={
              isDark
                ? "Gündüz temasına geç"
                : "Gece temasına geç"
            }
          >
            <span className="ren-theme-icon">
              {isDark ? "☀" : "☾"}
            </span>

            <span>
              {isDark
                ? "Gündüz Modu"
                : "Gece Modu"}
            </span>
          </button>
        </div>

        {/* KULLANICI */}
        <div className="ren-sidebar-footer">
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

            <span className="ren-user-more">
              •••
            </span>
          </div>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className="ren-main-content">
        <Outlet />
      </main>
    </div>
  );
}