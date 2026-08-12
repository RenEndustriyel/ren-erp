import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./components/Layout/Layout";

import Dashboard from "./pages/Dashboard/Dashboard";

import Products from "./pages/Products/Products";
import NewProduct from "./pages/Products/NewProduct";

import Stock from "./pages/Stock/Stock";
import StockMovements from "./pages/Stock/StockMovements";
import StockCount from "./pages/Stock/StockCount";
import CriticalStock from "./pages/Stock/CriticalStock";
import BarcodeLabel from "./pages/Stock/BarcodeLabel";

import NewSale from "./pages/Sales/NewSale";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>

          {/* ANA SAYFA */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* ÜRÜNLER */}
          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/products/new"
            element={<NewProduct />}
          />

          {/* STOK */}
          <Route
            path="/stock"
            element={<Stock />}
          />

          <Route
            path="/stock/movements"
            element={<StockMovements />}
          />

          <Route
            path="/stock/count"
            element={<StockCount />}
          />

          <Route
            path="/stock/critical"
            element={<CriticalStock />}
          />

          <Route
            path="/stock/barcode"
            element={<BarcodeLabel />}
          />

          {/* SATIŞ */}
          <Route
            path="/sales/new"
            element={<NewSale />}
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;