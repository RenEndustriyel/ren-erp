import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./components/Layout/Layout";

/* =========================================================
   ANA SAYFA
========================================================= */

import Overview from "./pages/Overview/Overview";

/* =========================================================
   HIZLI SATIŞ
========================================================= */

import QuickSale from "./pages/QuickSale/QuickSale";

/* =========================================================
   STOK
========================================================= */

import NewStock from "./pages/Stock/NewStock/NewStock";
import StockList from "./pages/Stock/StockList/StockList";
import Categories from "./pages/Stock/Categories/Categories";
import Brands from "./pages/Stock/Brands/Brands";
import Units from "./pages/Stock/Units/Units";
import StockMovements from "./pages/Stock/Movements/StockMovements";
import BulkOperations from "./pages/Stock/Bulk/BulkOperations";
import EditStock from "./pages/Stock/EditStock/EditStock";

/* =========================================================
   CARİ
========================================================= */

import CustomerList from "./pages/Customers/CustomerList/CustomerList";
import CustomerEdit from "./pages/Customers/CustomerEdit/CustomerEdit";
import NewCustomer from "./pages/Customers/NewCustomer/NewCustomer";
import CustomerMovements from "./pages/Customers/CustomerMovements/CustomerMovements";
import CustomerTransfer from "./pages/Customers/CustomerTransfer/CustomerTransfer";
import CustomerDetail from "./pages/Customers/CustomerDetail/CustomerDetail";
import CollectionsPayments from "./pages/Customers/CollectionsPayments/CollectionsPayments";
import Payments from "./pages/Customers/Payments/Payments";
import DueTracking from "./pages/Customers/DueTracking/DueTracking";
import CustomerReports from "./pages/Customers/CustomerReports/CustomerReports";

/* =========================================================
   KASA / BANKA
========================================================= */

import CashBank from "./pages/CashBank/CashBank";
import CashBankReports from "./pages/CashBankReports/CashBankReports";

/* =========================================================
   FATURALAR
========================================================= */

import InvoiceList from "./pages/Invoices/InvoiceList/InvoiceList";
import NewInvoice from "./pages/Invoices/NewInvoice/NewInvoice";
import SalesInvoices from "./pages/Invoices/SalesInvoices/SalesInvoices";
import PurchaseInvoices from "./pages/Invoices/PurchaseInvoices/PurchaseInvoices";
import ReturnInvoices from "./pages/Invoices/ReturnInvoices/ReturnInvoices";
import InvoiceReports from "./pages/Invoices/InvoiceReports/InvoiceReports";

/* =========================================================
   SİPARİŞ / TEKLİF
========================================================= */

import Orders from "./pages/Orders/Orders";

/* =========================================================
   RAPORLAR
========================================================= */

import Reports from "./pages/Reports/Reports";


/* =========================================================
   GEÇİCİ BOŞ MODÜL
========================================================= */

function EmptyModule({
  title,
  description,
}) {
  return (
    <div
      style={{
        minHeight:
          "100vh",
        padding:
          "40px",
        boxSizing:
          "border-box",
        background:
          "linear-gradient(180deg,#f8fafc,#f3f6f9)",
        fontFamily:
          'Inter,"Segoe UI",Arial,sans-serif',
      }}
    >

      <div
        style={{
          background:
            "#fff",
          border:
            "1px solid #e0e7ef",
          borderRadius:
            "10px",
          padding:
            "28px",
          maxWidth:
            "700px",
        }}
      >

        <div
          style={{
            fontSize:
              "11px",
            color:
              "#286fc7",
            fontWeight:
              700,
            marginBottom:
              "8px",
          }}
        >
          REN ERP
        </div>


        <h1
          style={{
            margin:
              0,
            fontSize:
              "24px",
            color:
              "#172033",
          }}
        >
          {
            title
          }
        </h1>


        <p
          style={{
            color:
              "#8793a3",
            fontSize:
              "11px",
          }}
        >
          {
            description
          }
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          element={
            <Layout />
          }
        >

          {/* =================================================
              ANA SAYFA
          ================================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="/dashboard"
            element={
              <Overview />
            }
          />


          {/* =================================================
              HIZLI SATIŞ
          ================================================= */}

          <Route
            path="/quick-sale"
            element={
              <QuickSale />
            }
          />


          {/* =================================================
              STOK
          ================================================= */}

          <Route
            path="/stock/new"
            element={
              <NewStock />
            }
          />

          <Route
            path="/stock/list"
            element={
              <StockList />
            }
          />

          <Route
            path="/stock/edit/:id"
            element={
              <EditStock />
            }
          />

          <Route
            path="/stock/categories"
            element={
              <Categories />
            }
          />

          <Route
            path="/stock/brands"
            element={
              <Brands />
            }
          />

          <Route
            path="/stock/units"
            element={
              <Units />
            }
          />

          <Route
            path="/stock/movements"
            element={
              <StockMovements />
            }
          />

          <Route
            path="/stock/bulk"
            element={
              <BulkOperations />
            }
          />


          {/* =================================================
              CARİ
          ================================================= */}

          <Route
            path="/customers"
            element={
              <CustomerList />
            }
          />

          <Route
            path="/customers/new"
            element={
              <NewCustomer />
            }
          />

          <Route
            path="/customers/edit/:id"
            element={
              <CustomerEdit />
            }
          />

          <Route
            path="/customers/movements"
            element={
              <CustomerMovements />
            }
          />

          <Route
            path="/customers/transfer"
            element={
              <CustomerTransfer />
            }
          />

          <Route
            path="/customers/detail"
            element={
              <CustomerDetail />
            }
          />

          <Route
            path="/customers/collections"
            element={
              <CollectionsPayments />
            }
          />

          <Route
            path="/customers/payments"
            element={
              <Payments />
            }
          />

          <Route
            path="/customers/due-tracking"
            element={
              <DueTracking />
            }
          />

          <Route
            path="/customers/reports"
            element={
              <CustomerReports />
            }
          />


          {/* =================================================
              KASA / BANKA
          ================================================= */}

          <Route
            path="/cash-bank"
            element={
              <CashBank />
            }
          />

          <Route
            path="/cash-bank/accounts"
            element={
              <CashBank />
            }
          />

          <Route
            path="/cash-bank/checks"
            element={
              <EmptyModule
                title="Çekler"
                description="Alınan ve verilen çeklerinizi yönetin."
              />
            }
          />

          <Route
            path="/cash-bank/reports"
            element={
              <CashBankReports />
            }
          />

          <Route
            path="/cash-bank/cash-flow"
            element={
              <CashBankReports
                mode="cashflow"
              />
            }
          />


          {/* =================================================
              FATURALAR
          ================================================= */}

          <Route
            path="/invoices"
            element={
              <InvoiceList />
            }
          />

          <Route
            path="/invoices/new"
            element={
              <NewInvoice />
            }
          />

          <Route
            path="/invoices/sales"
            element={
              <SalesInvoices />
            }
          />

          <Route
            path="/invoices/purchases"
            element={
              <PurchaseInvoices />
            }
          />

          <Route
            path="/invoices/returns"
            element={
              <ReturnInvoices />
            }
          />

          <Route
            path="/invoices/reports"
            element={
              <InvoiceReports />
            }
          />

          <Route
            path="/invoices/detail"
            element={
              <NewInvoice />
            }
          />

          <Route
            path="/invoices/edit"
            element={
              <NewInvoice />
            }
          />


          {/* =================================================
              SİPARİŞ / TEKLİF
          ================================================= */}

          <Route
            path="/orders"
            element={
              <Orders />
            }
          />


          {/* =================================================
              RAPORLAR MERKEZİ
          ================================================= */}

          <Route
            path="/reports"
            element={
              <Reports />
            }
          />


          {/* =================================================
              REN AI
          ================================================= */}

          <Route
            path="/assistant"
            element={
              <EmptyModule
                title="REN AI"
                description="REN AI işletme asistanı."
              />
            }
          />


          {/* =================================================
              AYARLAR
          ================================================= */}

          <Route
            path="/settings"
            element={
              <EmptyModule
                title="Ayarlar"
                description="REN ERP sistem ayarları."
              />
            }
          />

        </Route>


        {/* =================================================
            404
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );
}