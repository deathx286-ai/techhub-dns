import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import OrderDetailPage from "./pages/OrderDetailPage";
import PreDeliveryQueue from "./pages/PreDeliveryQueue";
import InDelivery from "./pages/InDelivery";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow mb-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-bold">TechHub Delivery Workflow</h1>
              <nav className="flex gap-4">
                <Link to="/" className="text-blue-600 hover:underline">
                  Dashboard
                </Link>
                <Link to="/pre-delivery" className="text-blue-600 hover:underline">
                  Pre-Delivery Queue
                </Link>
                <Link to="/in-delivery" className="text-blue-600 hover:underline">
                  In Delivery
                </Link>
                <Link to="/admin" className="text-blue-600 hover:underline">
                  Admin
                </Link>
              </nav>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/pre-delivery" element={<PreDeliveryQueue />} />
            <Route path="/in-delivery" element={<InDelivery />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
