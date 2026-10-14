import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { resolvePricing } from "@/utils/pricing";
import { orderTaxBreakdown } from "@/utils/tax";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadFontAndLogo(doc: jsPDF) {
  const [fontRes, logoRes] = await Promise.all([
    fetch("/fonts/TenorSans-Regular.ttf"),
    fetch("/navbarlogo.png"),
  ]);
  const fontBase64 = arrayBufferToBase64(await fontRes.arrayBuffer());
  const logoBase64 = arrayBufferToBase64(await logoRes.arrayBuffer());
  doc.addFileToVFS("TenorSans-Regular.ttf", fontBase64);
  doc.addFont("TenorSans-Regular.ttf", "TenorSans", "normal");
  doc.setFont("TenorSans", "normal");
  return logoBase64;
}

export async function generateInvoice(order: any) {
  const doc = new jsPDF();
  const logoBase64 = await loadFontAndLogo(doc);

  // Brand colors
  const darkBrown: [number, number, number] = [45, 45, 45];
  const accent: [number, number, number] = [210, 105, 63];
  const lightBg: [number, number, number] = [243, 237, 228];

  // ===== HEADER / BRAND =====
  doc.addImage(logoBase64, "PNG", 82.5, 6, 45, 45);

  doc.setFontSize(9);
  doc.setTextColor(...darkBrown);
  doc.text("The Sagar's Design House", 14, 56);
  doc.text("No. 8, Jalan Bukit Bintang, Bukit Bintang,", 14, 62);
  doc.text("55100 Kuala Lumpur, Malaysia", 14, 68);
  doc.text("SST No.: 000000000000", 14, 74);
  doc.text("Email: support@thesagarsdesignhouse.com", 14, 80);
  doc.text("Phone: +60 12-345 6789", 14, 86);

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(14, 91, 196, 91);

  // ===== INVOICE DETAILS =====
  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.text(`Invoice No: TSDH-INV-${order.invoiceNo ?? order.id}`, 14, 99);
  doc.text(`Order ID: TSDH-ORD-${order.id}`, 14, 105);
  doc.text(
    `Order Date: ${order.createdAt?.toDate?.().toLocaleDateString()}`,
    14,
    111
  );
  doc.text(`Payment Method: ${order.paymentMethod ?? "Razorpay"}`, 14, 117);
  doc.text(`Payment Status: ${order.paymentStatus ?? "Paid"}`, 14, 123);

  // ===== BILLING DETAILS =====
  doc.setFontSize(12);
  doc.setTextColor(...darkBrown);
  doc.text("Billed To", 14, 133);

  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.text(`Name: ${order.customer?.name}`, 14, 139);
  doc.text(`Email: ${order.customer?.email}`, 14, 145);
  doc.text(`Phone: ${order.customer?.phone}`, 14, 151);

  doc.text("Shipping Address:", 14, 159);
  doc.text(
    `${order.customer?.address}, ${order.customer?.stateCity ?? ""} - ${order.customer?.pinCode ?? ""}, Malaysia`,
    14,
    165
  );

  // ===== CALCULATIONS =====
  const subtotal = order.items.reduce((sum: number, item: any) => {
    const basePrice = resolvePricing({
      Price: item.product?.Price,
      OriginalPrice: item.product?.OriginalPrice,
      DiscountPercent: item.product?.DiscountPercent,
    }).selling;
    const customPrice =
      item.isCustomized && item.customPrice ? item.customPrice : 0;
    return sum + (basePrice + customPrice) * item.Quantity;
  }, 0);

  const shipping = order.shippingCharge ?? 0;
  const discount = order.discountAmount ?? order.discount ?? 0;
  const grandTotal = order.total;

  const tax = orderTaxBreakdown(order);

  // ===== ORDER TABLE =====
  autoTable(doc, {
    startY: 173,
    head: [["Item Name", "Qty", "Price", "Total"]],
    body: order.items.map((item: any) => {
      const basePrice = resolvePricing({
        Price: item.product?.Price,
        OriginalPrice: item.product?.OriginalPrice,
        DiscountPercent: item.product?.DiscountPercent,
      }).selling;
      const customPrice =
        item.isCustomized && item.customPrice ? item.customPrice : 0;
      const itemPrice = basePrice + customPrice;
      const itemTotal = itemPrice * item.Quantity;

      return [
        item.product?.ProductName ?? "Product",
        item.Quantity,
        `RM ${itemPrice}`,
        `RM ${itemTotal}`,
      ];
    }),
    styles: { fontSize: 10, textColor: darkBrown, font: "TenorSans" },
    headStyles: {
      fillColor: lightBg,
      textColor: darkBrown,
      fontStyle: "normal",
    },
    alternateRowStyles: { fillColor: [249, 246, 240] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 173;

  // ===== PRICE BREAKDOWN (SST) =====
  let y = finalY + 10;
  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.setFont("TenorSans", "normal");

  doc.text(`Subtotal: RM ${subtotal}`, 14, y);
  y += 6;

  if (discount > 0) {
    doc.text(`Discount: -RM ${discount}`, 14, y);
    y += 6;
  }

  doc.text(`Taxable Value: RM ${tax.taxableValue}`, 14, y);
  y += 6;
  doc.text(`SST @ ${tax.sstRate}%: RM ${tax.sst}`, 14, y);
  y += 6;

  doc.text(
    `Shipping: RM ${shipping} ${shipping === 0 ? "(Free)" : `(incl. service tax ${tax.shippingSst})`}`,
    14,
    y
  );
  y += 6;

  doc.text(`Grand Total: RM ${grandTotal}`, 14, y);

  // ===== FOOTER =====
  y += 12;
  doc.text("Thank you for shopping with The Sagar's Design House.", 14, y);
  y += 6;
  doc.text("Keep supporting Malaysian handmade products.", 14, y);
  y += 6;
  doc.text("For support, WhatsApp us at +60 12-345 6789", 14, y);

  // ===== SAVE =====
  doc.save(`SAGARS_INVOICE_${order.id}.pdf`);
}
