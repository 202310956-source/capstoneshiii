import { axiosWrapper } from "./axiosWrapper";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login       = (data) => axiosWrapper.post("/api/user/login", data);
export const register    = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = ()     => axiosWrapper.get("/api/user");
export const logout      = ()     => axiosWrapper.post("/api/user/logout");

// ─── Tables ──────────────────────────────────────────────────────────────────
export const addTable    = (data)               => axiosWrapper.post("/api/table/", data);
export const getTables   = ()                   => axiosWrapper.get("/api/table");
// Firestore: uses string doc IDs (not MongoDB ObjectId)
export const updateTable = ({ tableId, ...tableData }) =>
  axiosWrapper.put(`/api/table/${tableId}`, tableData);

// ─── Orders ──────────────────────────────────────────────────────────────────
export const addOrder         = (data)                    => axiosWrapper.post("/api/order/", data);
export const getOrders        = ()                        => axiosWrapper.get("/api/order");
export const getOrderById     = (id)                      => axiosWrapper.get(`/api/order/${id}`);
// Firestore: orderId is a string doc ID
export const updateOrderStatus = ({ orderId, orderStatus }) =>
  axiosWrapper.put(`/api/order/${orderId}`, { orderStatus });

// ─── Payments ────────────────────────────────────────────────────────────────
export const createOrderRazorpay  = (data) => axiosWrapper.post("/api/payment/create-order", data);
export const verifyPaymentRazorpay = (data) => axiosWrapper.post("/api/payment/verify-payment", data);

// ─── Products (Inventory) ────────────────────────────────────────────────────
export const getProducts    = (params)  => axiosWrapper.get("/api/product", { params });
export const getProductById = (id)      => axiosWrapper.get(`/api/product/${id}`);
export const addProduct     = (data)    => axiosWrapper.post("/api/product/", data);
export const updateProduct  = (id, data)=> axiosWrapper.put(`/api/product/${id}`, data);
export const deleteProduct  = (id)      => axiosWrapper.delete(`/api/product/${id}`);
export const adjustStock    = (id, adjustment) =>
  axiosWrapper.patch(`/api/product/${id}/adjust-stock`, { adjustment });

// ─── Discounts ───────────────────────────────────────────────────────────────
export const getDiscounts   = ()         => axiosWrapper.get("/api/discount");
export const addDiscount    = (data)     => axiosWrapper.post("/api/discount/", data);
export const applyDiscount  = (data)     => axiosWrapper.post("/api/discount/apply", data);
export const updateDiscount = (id, data) => axiosWrapper.put(`/api/discount/${id}`, data);
export const deleteDiscount = (id)       => axiosWrapper.delete(`/api/discount/${id}`);
