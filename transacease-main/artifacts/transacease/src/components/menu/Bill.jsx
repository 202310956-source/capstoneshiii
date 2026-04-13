import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import { addOrder, createOrderRazorpay, updateTable, verifyPaymentRazorpay, applyDiscount } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { FaTag } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const DISCOUNT_TYPES = [
  { key: "SENIOR", label: "Senior Citizen", description: "20% off (60+)", type: "percentage", value: 20 },
  { key: "PWD", label: "Person w/ Disability", description: "20% off PWD", type: "percentage", value: 20 },
  { key: "EMPLOYEE", label: "Employee", description: "15% off staff", type: "percentage", value: 15 },
];

const LOCAL_PROMO_CODES = {
  "WELCOME10": { type: "percentage", value: 10, description: "Welcome Promo — 10% off" },
  "SAVE50": { type: "fixed", value: 50, description: "₹50 off your order" },
  "SAVE100": { type: "fixed", value: 100, description: "₹100 off your order" },
  "PROMO20": { type: "percentage", value: 20, description: "20% off promo code" },
};

const calcDiscount = (type, value, base) => {
  if (type === "percentage") return Math.min((base * value) / 100, base);
  if (type === "fixed") return Math.min(value, base);
  return 0;
};

const Bill = () => {
  const dispatch = useDispatch();
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalWithTax = total + tax;

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  const [selectedDiscountType, setSelectedDiscountType] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  const specialDiscount = selectedDiscountType
    ? calcDiscount("percentage", selectedDiscountType.value, totalWithTax)
    : 0;

  const promoBase = totalWithTax - specialDiscount;
  const promoDiscount = appliedPromo
    ? calcDiscount(appliedPromo.type, appliedPromo.value, promoBase)
    : 0;

  const totalDiscount = specialDiscount + promoDiscount;
  const finalTotal = Math.max(0, totalWithTax - totalDiscount);

  const handleSelectDiscountType = (dt) => {
    setSelectedDiscountType((prev) => (prev?.key === dt.key ? null : dt));
  };

  const discountMutation = useMutation({
    mutationFn: (data) => applyDiscount(data),
    onSuccess: (res) => {
      const { discountAmount: da, type, value } = res.data.data;
      setAppliedPromo({ type: type || "fixed", value: da, code: promoCode.toUpperCase(), description: `Code — saving ₹${da.toFixed(2)}` });
      setPromoCode("");
      setPromoError("");
      enqueueSnackbar(`Promo applied! Saving ₹${da.toFixed(2)}`, { variant: "success" });
    },
    onError: () => setPromoError("Invalid or expired promo code."),
  });

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoError("");
    const localMatch = LOCAL_PROMO_CODES[code];
    if (localMatch) {
      setAppliedPromo({ ...localMatch, code });
      setPromoCode("");
      enqueueSnackbar(`Promo applied! ${localMatch.description}`, { variant: "success" });
      return;
    }
    discountMutation.mutate({ code, orderAmount: totalWithTax });
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  const orderMutation = useMutation({
    mutationFn: (data) => addOrder(data),
    onSuccess: (resData) => {
      const { data } = resData.data;
      setOrderInfo(data);
      const tableData = { status: "Booked", currentOrderId: data.id || data._id, tableId: data.tableId || data.table };
      setTimeout(() => tableUpdateMutation.mutate(tableData), 1500);
      enqueueSnackbar("Order Placed!", { variant: "success" });
      setShowInvoice(true);
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Order failed", { variant: "error" }),
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (data) => updateTable(data),
    onSuccess: () => { dispatch(removeCustomer()); dispatch(removeAllItems()); },
  });

  const buildOrderData = (extraPayment = {}) => ({
    customerDetails: { name: customerData.customerName, phone: customerData.customerPhone, guests: customerData.guests },
    orderStatus: "In Progress",
    bills: { total, tax, discount: totalDiscount, totalWithTax: finalTotal },
    items: cartData,
    tableId: customerData.table?.tableId,
    paymentMethod,
    ...extraPayment,
  });

  const handlePlaceOrder = async () => {
    if (!paymentMethod) { enqueueSnackbar("Please select a payment method!", { variant: "warning" }); return; }
    if (cartData.length === 0) { enqueueSnackbar("Cart is empty!", { variant: "warning" }); return; }

    if (paymentMethod === "Online") {
      try {
        const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!loaded) { enqueueSnackbar("Razorpay SDK failed to load.", { variant: "warning" }); return; }
        const { data } = await createOrderRazorpay({ amount: finalTotal.toFixed(2) });
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.order.amount, currency: data.order.currency,
          name: "TransacEase", description: "Secure Payment", order_id: data.order.id,
          handler: async (response) => {
            const verification = await verifyPaymentRazorpay(response);
            enqueueSnackbar(verification.data.message, { variant: "success" });
            setTimeout(() => orderMutation.mutate(buildOrderData({
              paymentData: { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id }
            })), 1500);
          },
          prefill: { name: customerData.customerName, contact: customerData.customerPhone },
          theme: { color: "#f6b100" },
        };
        new window.Razorpay(options).open();
      } catch { enqueueSnackbar("Payment Failed!", { variant: "error" }); }
    } else {
      orderMutation.mutate(buildOrderData());
    }
  };

  const handlePreviewReceipt = () => {
    if (cartData.length === 0) { enqueueSnackbar("Cart is empty!", { variant: "warning" }); return; }
    setOrderInfo({
      orderDate: new Date().toISOString(),
      customerDetails: { name: customerData.customerName || "Customer", phone: customerData.customerPhone || "—", guests: customerData.guests || 1 },
      items: cartData,
      bills: { total, tax, discount: totalDiscount, totalWithTax: finalTotal },
      paymentMethod: paymentMethod || "—",
    });
    setShowInvoice(true);
  };

  return (
    <>
      <div className="px-4 py-3 space-y-4 overflow-y-auto scrollbar-hide">
        {/* Special Discounts */}
        <div>
          <p className="text-xs text-[#686868] uppercase tracking-wider font-bold mb-2">Special Discounts</p>
          <div className="space-y-1.5">
            {DISCOUNT_TYPES.map((dt) => (
              <button key={dt.key} onClick={() => handleSelectDiscountType(dt)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left transition-all text-sm border ${
                  selectedDiscountType?.key === dt.key
                    ? "bg-[#1e3a2f] border-green-700 text-green-300"
                    : "bg-[#1f1f1f] border-[#2a2a2a] text-[#ababab] hover:border-[#3a3a3a]"
                }`}>
                <div>
                  <span className="font-semibold">{dt.label}</span>
                  <p className="text-xs opacity-60 mt-0.5">{dt.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className="text-xs font-bold">{dt.value}% off</span>
                  {selectedDiscountType?.key === dt.key && (
                    <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Promo Code */}
        <div>
          <p className="text-xs text-[#686868] uppercase tracking-wider font-bold mb-2">Promo Code</p>
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-[#1e3a2f] rounded-lg px-3 py-2.5 border border-green-800">
              <div className="flex items-center gap-2">
                <FaTag className="text-green-400 flex-shrink-0" size={12} />
                <div>
                  <p className="text-green-300 text-sm font-bold font-mono">{appliedPromo.code}</p>
                  <p className="text-green-600 text-xs">{appliedPromo.description}</p>
                </div>
              </div>
              <button onClick={handleRemovePromo} className="text-green-600 hover:text-red-400 ml-2 flex-shrink-0 transition-colors">
                <IoClose size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text" value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  placeholder="Enter code..."
                  className="flex-1 bg-[#1f1f1f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none border border-[#2a2a2a] focus:border-[#f6b100] uppercase font-mono tracking-wider transition-colors"
                />
                <button onClick={handleApplyPromo} disabled={discountMutation.isPending || !promoCode.trim()}
                  className="bg-[#025cca] text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors">
                  Apply
                </button>
              </div>
              {promoError && <p className="text-red-400 text-xs">{promoError}</p>}
              <p className="text-[#444] text-xs">Try: WELCOME10 · SAVE50 · SAVE100 · PROMO20</p>
            </div>
          )}
        </div>

        {/* Bill Summary */}
        <div className="bg-[#151515] rounded-xl p-3 space-y-2 border border-[#2a2a2a]">
          <div className="flex justify-between text-sm">
            <span className="text-[#686868]">Subtotal ({cartData.length} items)</span>
            <span className="text-[#f5f5f5] font-semibold">₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#686868]">Tax (5.25%)</span>
            <span className="text-[#f5f5f5] font-semibold">₹{tax.toFixed(2)}</span>
          </div>
          {selectedDiscountType && (
            <div className="flex justify-between text-sm">
              <span className="text-green-400">{selectedDiscountType.label} ({selectedDiscountType.value}%)</span>
              <span className="text-green-400 font-semibold">−₹{specialDiscount.toFixed(2)}</span>
            </div>
          )}
          {appliedPromo && (
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Code: {appliedPromo.code}</span>
              <span className="text-green-400 font-semibold">−₹{promoDiscount.toFixed(2)}</span>
            </div>
          )}
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm border-t border-[#252525] pt-1.5">
              <span className="text-green-500 font-semibold">Total Saved</span>
              <span className="text-green-500 font-bold">−₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-[#252525]">
            <span className="text-[#f5f5f5] font-bold">Total</span>
            <span className="text-[#f6b100] font-bold text-xl">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <p className="text-xs text-[#686868] uppercase tracking-wider font-bold mb-2">Payment Method</p>
          <div className="flex gap-2">
            {["Cash", "Online"].map((method) => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                  paymentMethod === method
                    ? "bg-[#025cca] border-blue-600 text-white"
                    : "bg-[#1f1f1f] border-[#2a2a2a] text-[#ababab] hover:border-[#3a3a3a]"
                }`}>
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-2">
          <button onClick={handlePlaceOrder} disabled={orderMutation.isPending || cartData.length === 0}
            className="bg-[#f6b100] py-3 w-full rounded-xl text-[#1a1a1a] font-bold text-base disabled:opacity-40 hover:bg-yellow-400 transition-colors">
            {orderMutation.isPending ? "Placing Order..." : "Place Order"}
          </button>
          <button onClick={handlePreviewReceipt} disabled={cartData.length === 0}
            className="bg-[#1a1a1a] border border-[#2a2a2a] py-2.5 w-full rounded-xl text-[#ababab] font-semibold text-sm disabled:opacity-40 hover:border-[#3a3a3a] transition-colors">
            Preview Receipt
          </button>
        </div>
      </div>

      {showInvoice && <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />}
    </>
  );
};

export default Bill;
