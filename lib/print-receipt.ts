// Print Receipt Utility

interface ReceiptData {
  invoiceNumber: string;
  businessName: string;
  phone?: string;
  address?: string;
  items: Array<{
    name: string;
    quantity: number;
    priceAtTime: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  date: Date;
  isWalkIn?: boolean;
  customerName?: string;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const formattedDate = new Date(data.date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="text-align: left; padding: 4px 0; border-bottom: 1px dashed #ddd;">
        ${item.name}
      </td>
      <td style="text-align: center; padding: 4px 0; border-bottom: 1px dashed #ddd;">
        ${item.quantity}
      </td>
      <td style="text-align: right; padding: 4px 0; border-bottom: 1px dashed #ddd;">
        ₹${(item.priceAtTime * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${data.invoiceNumber}</title>
      <style>
        @media print {
          body { margin: 0; padding: 10px; }
          .no-print { display: none; }
        }
        body {
          font-family: 'Courier New', monospace;
          max-width: 300px;
          margin: 0 auto;
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .business-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .invoice-info {
          text-align: center;
          margin-bottom: 10px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .items-table th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          font-size: 11px;
        }
        .items-table th:nth-child(2) { text-align: center; }
        .items-table th:last-child { text-align: right; }
        .total-section {
          border-top: 2px dashed #000;
          padding-top: 10px;
          margin-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .payment-method {
          text-align: center;
          background: #f5f5f5;
          padding: 5px;
          border-radius: 4px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 11px;
        }
        .print-btn {
          display: block;
          width: 100%;
          padding: 10px;
          margin-top: 20px;
          background: #f97316;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #ea580c;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${data.businessName || 'Veer Canteen'}</div>
        ${data.phone ? `<div>📞 ${data.phone}</div>` : ''}
        ${data.address ? `<div>📍 ${data.address}</div>` : ''}
      </div>

      <div class="invoice-info">
        <div><strong>Invoice #:</strong> ${data.invoiceNumber}</div>
        <div><strong>Date:</strong> ${formattedDate}</div>
        ${data.customerName ? `<div><strong>Customer:</strong> ${data.customerName}</div>` : ''}
        ${data.isWalkIn ? '<div><strong>Type:</strong> Walk-in</div>' : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>TOTAL</span>
          <span>₹${data.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div class="payment-method">
        💳 Paid via <strong>${data.paymentMethod.toUpperCase()}</strong>
      </div>

      <div class="footer">
        <div>Thank you for your order!</div>
        <div>Visit again 🙏</div>
      </div>

      <button class="print-btn no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">
        🖨️ Print Receipt
      </button>
    </body>
    </html>
  `;
}

export function printReceipt(data: ReceiptData) {
  const receiptHTML = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  }
}
