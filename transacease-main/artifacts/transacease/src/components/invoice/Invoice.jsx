import React, { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaPrint } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

const Invoice = ({ orderInfo, setShowInvoice }) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => {
    const printStyles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; color: #111; padding: 20px; }
      .receipt { max-width: 380px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
      .receipt-header { background: #1a1a1a; color: white; text-align: center; padding: 20px 16px; }
      .receipt-header h1 { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
      .receipt-header p { font-size: 11px; color: #aaa; margin-top: 4px; }
      .section { padding: 14px 16px; border-bottom: 1px solid #eee; }
      .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
      .info-row .label { color: #666; }
      .info-row .value { font-weight: 600; color: #111; }
      .item-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 7px 0; border-bottom: 1px dashed #eee; }
      .item-row:last-child { border-bottom: none; }
      .item-name { font-weight: 600; font-size: 13px; color: #111; }
      .item-meta { font-size: 11px; color: #888; margin-top: 2px; }
      .item-subtotal { font-weight: 700; font-size: 13px; color: #111; text-align: right; }
      .totals { background: #f9f9f9; padding: 14px 16px; }
      .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
      .total-row .label { color: #555; }
      .total-row .value { font-weight: 600; }
      .total-row.discount .label, .total-row.discount .value { color: #16a34a; }
      .total-row.grand { font-size: 15px; font-weight: 700; border-top: 2px solid #ddd; margin-top: 8px; padding-top: 8px; }
      .receipt-footer { text-align: center; padding: 14px 16px; font-size: 11px; color: #888; }
    `;

    const bills = orderInfo.bills || {};
    const subtotal = bills.total ?? 0;
    const tax = bills.tax ?? 0;
    const discount = bills.discount ?? 0;
    const finalTotal = bills.totalWithTax ?? subtotal + tax - discount;
    const orderId = String(orderInfo.orderDate ? new Date(orderInfo.orderDate).getTime() : Date.now()).slice(-6);
    const orderDate = orderInfo.orderDate
      ? new Date(orderInfo.orderDate).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
      : new Date().toLocaleString();

    const itemsHtml = (orderInfo.items || []).map((item) => {
      const unitPrice = item.pricePerQuantity ?? (item.price / (item.quantity || 1));
      const itemSubtotal = item.price ?? unitPrice * (item.quantity || 1);
      return `
        <div class="item-row">
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-meta">₹${unitPrice.toFixed(2)} × ${item.quantity}</div>
          </div>
          <div class="item-subtotal">₹${itemSubtotal.toFixed(2)}</div>
        </div>`;
    }).join("");

    const discountHtml = discount > 0
      ? `<div class="total-row discount"><span class="label">Discount</span><span class="value">−₹${discount.toFixed(2)}</span></div>`
      : "";

    const paymentHtml = orderInfo.paymentMethod !== "Cash" && orderInfo.paymentData
      ? `<div class="section">
          <div class="section-label">Payment Details</div>
          <div class="info-row"><span class="label">Order ID</span><span class="value">${orderInfo.paymentData.razorpay_order_id || "—"}</span></div>
          <div class="info-row"><span class="label">Payment ID</span><span class="value">${orderInfo.paymentData.razorpay_payment_id || "—"}</span></div>
        </div>`
      : "";

    const receiptHtml = `
      <div class="receipt">
        <div class="receipt-header">
          <h1>TRANSACEASE</h1>
          <p>Order Receipt</p>
          <p>${orderDate}</p>
        </div>

        <div class="section">
          <div class="section-label">Order Info</div>
          <div class="info-row"><span class="label">Receipt #</span><span class="value">${orderId}</span></div>
          <div class="info-row"><span class="label">Customer</span><span class="value">${orderInfo.customerDetails?.name || "—"}</span></div>
          <div class="info-row"><span class="label">Phone</span><span class="value">${orderInfo.customerDetails?.phone || "—"}</span></div>
          <div class="info-row"><span class="label">Guests</span><span class="value">${orderInfo.customerDetails?.guests || 1}</span></div>
          <div class="info-row"><span class="label">Payment</span><span class="value">${orderInfo.paymentMethod || "Cash"}</span></div>
        </div>

        <div class="section">
          <div class="section-label">Items Ordered</div>
          ${itemsHtml}
        </div>

        ${paymentHtml}

        <div class="totals">
          <div class="section-label">Bill Summary</div>
          <div class="total-row"><span class="label">Subtotal (${(orderInfo.items || []).length} items)</span><span class="value">₹${subtotal.toFixed(2)}</span></div>
          <div class="total-row"><span class="label">Tax (5.25%)</span><span class="value">₹${tax.toFixed(2)}</span></div>
          <div class="total-row"><span class="label">Before Discount</span><span class="value">₹${(subtotal + tax).toFixed(2)}</span></div>
          ${discountHtml}
          <div class="total-row grand"><span class="label">TOTAL PAID</span><span class="value">₹${finalTotal.toFixed(2)}</span></div>
        </div>

        <div class="receipt-footer">
          <p>Thank you for dining with us!</p>
          <p>Receipt #${orderId} · ${orderDate}</p>
        </div>
      </div>
    `;

    const WinPrint = window.open("", "_blank", "width=500,height=750");
    WinPrint.document.write(`<!DOCTYPE html><html><head><title>Receipt #${orderId}</title><style>${printStyles}</style></head><body>${receiptHtml}</body></html>`);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 800);
  };

  if (!orderInfo) return null;

  const bills = orderInfo.bills || {};
  const subtotal = bills.total ?? 0;
  const tax = bills.tax ?? 0;
  const discount = bills.discount ?? 0;
  const finalTotal = bills.totalWithTax ?? subtotal + tax - discount;
  const orderId = String(orderInfo.orderDate ? new Date(orderInfo.orderDate).getTime() : Date.now()).slice(-6);
  const orderDate = orderInfo.orderDate
    ? new Date(orderInfo.orderDate).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
    : new Date().toLocaleString();

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <FaCheck className="text-white" size={14} />
            </motion.div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg">Order Confirmed!</h2>
              <p className="text-gray-400 text-xs">Receipt #{orderId}</p>
            </div>
          </div>
          <button onClick={() => setShowInvoice(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <IoClose size={22} />
          </button>
        </div>

        <div ref={invoiceRef}>
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Order Info</p>
            <div className="space-y-1.5">
              {[
                ["Date", orderDate],
                ["Customer", orderInfo.customerDetails?.name || "—"],
                ["Phone", orderInfo.customerDetails?.phone || "—"],
                ["Guests", orderInfo.customerDetails?.guests || 1],
                ["Payment", orderInfo.paymentMethod || "Cash"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-800 font-semibold text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Items ({(orderInfo.items || []).length})
            </p>
            <div className="space-y-2">
              {(orderInfo.items || []).map((item, i) => {
                const unitPrice = item.pricePerQuantity ?? (item.price / (item.quantity || 1));
                const itemSubtotal = item.price ?? unitPrice * (item.quantity || 1);
                return (
                  <div key={i} className="flex items-start justify-between py-2 border-b border-dashed border-gray-100 last:border-0">
                    <div className="flex-1 pr-3">
                      <p className="text-gray-800 font-semibold text-sm">{item.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        ₹{unitPrice.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-gray-800 font-bold text-sm">₹{itemSubtotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-4 bg-gray-50">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Bill Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700 font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (5.25%)</span>
                <span className="text-gray-700 font-semibold">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total Before Discount</span>
                <span className="font-semibold text-gray-700">₹{(subtotal + tax).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm bg-green-50 -mx-1 px-1 py-1 rounded">
                  <span className="text-green-700 font-semibold">Discount Applied</span>
                  <span className="text-green-700 font-bold">−₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-gray-200">
                <span className="text-gray-900 font-bold text-base">Total Paid</span>
                <span className="text-gray-900 font-bold text-2xl">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {orderInfo.paymentMethod !== "Cash" && orderInfo.paymentData && (
            <div className="px-5 py-3 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Payment Details</p>
              <p className="text-gray-500 text-xs break-all">
                <span className="font-semibold">Order ID: </span>{orderInfo.paymentData.razorpay_order_id}
              </p>
              <p className="text-gray-500 text-xs break-all">
                <span className="font-semibold">Payment ID: </span>{orderInfo.paymentData.razorpay_payment_id}
              </p>
            </div>
          )}

          <div className="px-5 py-3 text-center border-t border-gray-100">
            <p className="text-gray-400 text-xs">Thank you for your order!</p>
            <p className="text-gray-400 text-xs">Receipt #{orderId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
          >
            <FaPrint size={14} />
            Print Receipt
          </button>
          <button
            onClick={() => setShowInvoice(false)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Invoice;
