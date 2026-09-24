import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/feedback/ErrorBoundary.jsx'
import { Layout } from './components/layout/Layout.jsx'
import { ToastProvider } from './components/ui/toast.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import AccountLayout from './components/account/AccountLayout.jsx'
import Profile from './pages/account/Profile.jsx'
import Wishlist from './pages/account/Wishlist.jsx'
import Orders from './pages/account/Orders.jsx'
import OrderDetails from './pages/account/OrderDetails.jsx'
import Returns from './pages/account/Returns.jsx'
import Notifications from './pages/account/Notifications.jsx'
import SellerLayout from './components/seller/SellerLayout.jsx'
import SellerOverview from './pages/seller/SellerOverview.jsx'
import SellerStoreProfile from './pages/seller/SellerStoreProfile.jsx'
import SellerProducts from './pages/seller/SellerProducts.jsx'
import SellerAddProduct from './pages/seller/SellerAddProduct.jsx'
import SellerEditProduct from './pages/seller/SellerEditProduct.jsx'
import SellerInventory from './pages/seller/SellerInventory.jsx'
import SellerOrders from './pages/seller/SellerOrders.jsx'
import SellerReturns from './pages/seller/SellerReturns.jsx'
import SellerAnalytics from './pages/seller/SellerAnalytics.jsx'
import SellerEarnings from './pages/seller/SellerEarnings.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminSellers from './pages/admin/AdminSellers.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminCoupons from './pages/admin/AdminCoupons.jsx'
import AdminDisputes from './pages/admin/AdminDisputes.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminSettlements from './pages/admin/AdminSettlements.jsx'
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx'
import SupportLayout from './components/support/SupportLayout.jsx'
import SupportDashboard from './pages/support/SupportDashboard.jsx'
import SupportTickets from './pages/support/SupportTickets.jsx'
import SupportTicketDetails from './pages/support/SupportTicketDetails.jsx'
import SupportDisputes from './pages/support/SupportDisputes.jsx'
import SupportRefunds from './pages/support/SupportRefunds.jsx'
import DeliveryLayout from './components/delivery/DeliveryLayout.jsx'
import DeliveryDashboard from './pages/delivery/DeliveryDashboard.jsx'
import DeliveryList from './pages/delivery/DeliveryList.jsx'
import DeliveryDetails from './pages/delivery/DeliveryDetails.jsx'
import DeliveryProfile from './pages/delivery/DeliveryProfile.jsx'
import DesignSystem from './pages/DesignSystem.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import SellerRegistration from './pages/SellerRegistration.jsx'
import { NotFound } from './pages/NotFound.jsx'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="product/:id" element={<ProductDetails />} />
                <Route path="category/:slug" element={<Products />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-confirmation/:id" element={<OrderSuccess />} />
                <Route path="account" element={<AccountLayout />}>
                  <Route index element={<Navigate to="profile" replace />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:orderId" element={<OrderDetails />} />
                  <Route path="returns" element={<Returns />} />
                  <Route path="notifications" element={<Notifications />} />
                </Route>
                <Route path="seller" element={<SellerLayout />}>
                  <Route index element={<SellerOverview />} />
                  <Route path="store" element={<SellerStoreProfile />} />
                  <Route path="products" element={<SellerProducts />} />
                  <Route path="products/new" element={<SellerAddProduct />} />
                  <Route path="products/:productId/edit" element={<SellerEditProduct />} />
                  <Route path="inventory" element={<SellerInventory />} />
                  <Route path="orders" element={<SellerOrders />} />
                  <Route path="returns" element={<SellerReturns />} />
                  <Route path="analytics" element={<SellerAnalytics />} />
                  <Route path="earnings" element={<SellerEarnings />} />
                </Route>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="sellers" element={<AdminSellers />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="disputes" element={<AdminDisputes />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="settlements" element={<AdminSettlements />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                </Route>
                <Route path="support" element={<SupportLayout />}>
                  <Route index element={<SupportDashboard />} />
                  <Route path="tickets" element={<SupportTickets />} />
                  <Route path="tickets/:ticketId" element={<SupportTicketDetails />} />
                  <Route path="disputes" element={<SupportDisputes />} />
                  <Route path="refunds" element={<SupportRefunds />} />
                </Route>
                <Route path="delivery" element={<DeliveryLayout />}>
                  <Route index element={<DeliveryDashboard />} />
                  <Route path="deliveries" element={<DeliveryList />} />
                  <Route path="deliveries/:deliveryId" element={<DeliveryDetails />} />
                  <Route path="profile" element={<DeliveryProfile />} />
                </Route>
                <Route path="design-system" element={<DesignSystem />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="register/seller" element={<SellerRegistration />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              </Routes>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
