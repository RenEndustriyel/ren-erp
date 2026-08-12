import {
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  MdDashboard,
  MdInventory2,
  MdPointOfSale,
  MdReceiptLong,
  MdPeople,
  MdShoppingCart,
  MdRequestQuote,
  MdAccountBalance,
  MdDescription,
  MdSearch,
  MdDarkMode,
  MdLightMode,
  MdExpandMore,
  MdChevronRight,
  MdSettings,
  MdStorefront,
  MdAssessment,
} from "react-icons/md";

import "./Layout.css";

const menuGroups = [
  {
    key: "dashboard",
    label: "Genel Bakış",
    icon: MdDashboard,
    items: [
      {
        label: "Dashboard",
        path: "/",
        end: true,
      },
    ],
  },

  {
    key: "stock",
    label: "Stok & Ürünler",
    icon: MdInventory2,
    items: [
      {
        label: "Ürünler",
        path: "/products",
        end: true,
      },
      {
        label: "Yeni Ürün",
        path: "/products/new",
        end: true,
      },
      {
        label: "Stok Listesi",
        path: "/stock",
        end: true,
      },
      {
        label: "Stok Hareketleri",
        path: "/stock/movements",
        end: true,
      },
      {
        label: "Stok Sayımı",
        path: "/stock/count",
        end: true,
      },
      {
        label: "Kritik Stoklar",
        path: "/stock/critical",
        end: true,
      },
      {
        label: "Barkod & Etiket",
        path: "/stock/barcode",
        end: true,
      },
    ],
  },

  {
    key: "sales",
    label: "Satış",
    icon: MdPointOfSale,
    items: [
      {
        label: "Yeni Satış",
        path: "/sales/new",
        end: true,
      },
      {
        label: "Satışlar",
        path: "/sales",
        end: true,
      },
      {
        label: "Satış Hareketleri",
        path: "/sales/movements",
        end: true,
      },
      {
        label: "Hızlı Satış",
        path: "/sales/quick",
        end: true,
      },
    ],
  },

  {
    key: "invoices",
    label: "Faturalar",
    icon: MdReceiptLong,
    items: [
      {
        label: "Faturalar",
        path: "/invoices",
        end: true,
      },
    ],
  },

  {
    key: "customers",
    label: "Cari",
    icon: MdPeople,
    items: [
      {
        label: "Cari Hesaplar",
        path: "/customers",
        end: true,
      },
    ],
  },

  {
    key: "purchases",
    label: "Alışlar",
    icon: MdShoppingCart,
    items: [
      {
        label: "Alışlar",
        path: "/purchases",
        end: true,
      },
    ],
  },

  {
    key: "orders",
    label: "Sipariş & Teklif",
    icon: MdRequestQuote,
    items: [
      {
        label: "Siparişler",
        path: "/orders",
        end: true,
      },
      {
        label: "Teklifler",
        path: "/quotes",
        end: true,
      },
    ],
  },

  {
    key: "finance",
    label: "Kasa & Banka",
    icon: MdAccountBalance,
    items: [
      {
        label: "Kasa",
        path: "/cash",
        end: true,
      },
      {
        label: "Bankalar",
        path: "/banks",
        end: true,
      },
      {
        label: "Tahsilatlar",
        path: "/collections",
        end: true,
      },
    ],
  },

  {
    key: "waybill",
    label: "İrsaliye",
    icon: MdDescription,
    items: [
      {
        label: "İrsaliyeler",
        path: "/waybills",
        end: true,
      },
    ],
  },

  {
    key: "reports",
    label: "Raporlar",
    icon: MdAssessment,
    items: [
      {
        label: "Rapor Merkezi",
        path: "/reports",
        end: true,
      },
    ],
  },
];

export default function Layout() {
  const location = useLocation();

  const [search, setSearch] =
    useState("");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  /*
   * Başlangıçta hiçbir menü açık değil.
   */
  const [openGroup, setOpenGroup] =
    useState(null);

  const [darkMode, setDarkMode] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "ren-theme"
        );

      return saved === "dark";
    });

  const activeGroup = useMemo(() => {
    const found = menuGroups.find(
      (group) =>
        group.items.some(
          (item) =>
            location.pathname === item.path
        )
    );

    return found?.key || null;
  }, [location.pathname]);

  const toggleGroup = (key) => {
    setOpenGroup((current) =>
      current === key
        ? null
        : key
    );
  };

  const toggleTheme = () => {
    setDarkMode((current) => {
      const next = !current;

      localStorage.setItem(
        "ren-theme",
        next ? "dark" : "light"
      );

      document.documentElement.dataset.theme =
        next ? "dark" : "light";

      document.body.classList.toggle(
        "dark",
        next
      );

      return next;
    });
  };

  const filteredGroups =
    menuGroups
      .map((group) => {
        const q =
          search
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            );

        if (!q) {
          return group;
        }

        const groupMatches =
          group.label
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(q);

        const items =
          group.items.filter((item) =>
            item.label
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(q)
          );

        if (
          groupMatches ||
          items.length
        ) {
          return {
            ...group,
            items: groupMatches
              ? group.items
              : items,
          };
        }

        return null;
      })
      .filter(Boolean);

  return (
    <div className="ren-layout">

      <aside
        className={`ren-sidebar ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="ren-brand">
          <div className="ren-brand-mark">
            R
          </div>

          <div>
            <strong>
              REN ERP
            </strong>

            <span>
              Endüstriyel Yönetim Sistemi
            </span>
          </div>
        </div>

        <div className="ren-sidebar-search">
          <MdSearch />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Menüde ara..."
          />
        </div>

        <nav className="ren-sidebar-menu">

          {filteredGroups.map(
            (group) => {
              const Icon = group.icon;

              const isSearchMode =
                search.trim().length > 0;

              const expanded =
                isSearchMode
                  ? true
                  : openGroup ===
                    group.key;

              /*
               * Aktif grup sadece içeride gösterilir;
               * kendiliğinden açılmaz.
               *
               * Kullanıcı sayfaya doğrudan
               * /products/new ile geldiyse ilgili
               * grup da kapalı kalabilir.
               */
              return (
                <div
                  className="ren-menu-group"
                  key={group.key}
                >

                  <button
                    type="button"
                    className="ren-menu-group-title"
                    onClick={() =>
                      toggleGroup(
                        group.key
                      )
                    }
                  >
                    <span className="ren-menu-group-left">
                      <Icon />

                      <span>
                        {group.label}
                      </span>
                    </span>

                    {expanded ? (
                      <MdExpandMore />
                    ) : (
                      <MdChevronRight />
                    )}
                  </button>

                  {expanded && (
                    <div className="ren-menu-items">

                      {group.items.map(
                        (item) => (
                          <NavLink
                            key={
                              item.path
                            }
                            to={
                              item.path
                            }
                            end={
                              item.end ===
                              true
                            }
                            className={({
                              isActive,
                            }) =>
                              `ren-menu-link ${
                                isActive
                                  ? "active"
                                  : ""
                              }`
                            }
                            onClick={() => {
                              setMobileOpen(
                                false
                              );

                              /*
                               * Bir menü öğesine tıklayınca
                               * grup açık kalır.
                               */
                              if (
                                !isSearchMode
                              ) {
                                setOpenGroup(
                                  group.key
                                );
                              }
                            }}
                          >
                            <span className="ren-menu-dot">
                              •
                            </span>

                            <span>
                              {
                                item.label
                              }
                            </span>
                          </NavLink>
                        )
                      )}

                    </div>
                  )}

                </div>
              );
            }
          )}

        </nav>

        <button
          type="button"
          className="ren-theme-toggle"
          onClick={
            toggleTheme
          }
        >
          {darkMode ? (
            <MdLightMode />
          ) : (
            <MdDarkMode />
          )}

          <span>
            {darkMode
              ? "Gündüz Modu"
              : "Gece Modu"}
          </span>
        </button>

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

          <button
            type="button"
            className="ren-user-more"
            title="Ayarlar"
          >
            <MdSettings />
          </button>

        </div>

      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="ren-mobile-overlay"
          aria-label="Menüyü kapat"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
        />
      )}

      <main className="ren-main">

        <button
          type="button"
          className="ren-mobile-menu-button"
          onClick={() =>
            setMobileOpen(
              true
            )
          }
        >
          <MdStorefront />
          REN ERP
        </button>

        <div className="ren-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}