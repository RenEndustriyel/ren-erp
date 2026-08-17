import {
  MdDashboard,
  MdLogout,
} from "react-icons/md";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import "./Layout.css";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/dashboard");
  };

  return (
    <div className="ren-layout">

      <aside className="ren-sidebar">

        <div className="ren-brand">

          <div className="ren-brand-logo">
            R
          </div>

          <div className="ren-brand-text">
            <strong>
              REN ERP
            </strong>

            <span>
              İşletme Yönetim Sistemi
            </span>
          </div>

        </div>

        <div className="ren-sidebar-divider" />

        <div className="ren-sidebar-section-title">
          MENÜ
        </div>

        <nav className="ren-sidebar-nav">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `ren-sidebar-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <MdDashboard />

            <span>
              Genel Bakış
            </span>
          </NavLink>

        </nav>

        <div className="ren-sidebar-bottom">

          <div className="ren-sidebar-user">

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

          <button
            type="button"
            className="ren-logout"
            onClick={handleLogout}
          >
            <MdLogout />

            <span>
              Çıkış Yap
            </span>
          </button>

        </div>

      </aside>

      <main className="ren-main">
        <Outlet />
      </main>

    </div>
  );
}