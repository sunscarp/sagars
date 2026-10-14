import { readFileSync } from "fs";
import { join } from "path";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { orderTaxBreakdown } from "@/utils/tax";

const tenorSansBase64 = readFileSync(
  join(process.cwd(), "public", "fonts", "TenorSans-Regular.ttf")
).toString("base64");
const logoBase64 = readFileSync(
  join(process.cwd(), "public", "navbarlogo.png")
).toString("base64");

function resolveSellingPrice(item: any): number {
  const price = item.product?.Price || 0;
  const originalPrice = item.product?.OriginalPrice;
  const discountPercent = item.product?.DiscountPercent;

  if (discountPercent && discountPercent > 0 && originalPrice) {
    return Math.round(originalPrice * (1 - discountPercent / 100));
  }
  if (originalPrice && originalPrice < price) {
    return originalPrice;
  }
  return price;
}

async function generatePdfBuffer(order: any): Promise<Buffer> {
  const doc = new jsPDF();
  doc.addFileToVFS("TenorSans-Regular.ttf", tenorSansBase64);
  doc.addFont("TenorSans-Regular.ttf", "TenorSans", "normal");
  doc.setFont("TenorSans", "normal");

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
  const orderId = order.id || order.orderId || "";
  const invoiceNo = order.invoiceNo || orderId;

  const createdAtDate =
    order.createdAt?.toDate?.() ??
    (order.createdAt ? new Date(order.createdAt) : new Date());

  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.text(`Invoice No: TSDH-INV-${invoiceNo}`, 14, 99);
  doc.text(`Order ID: TSDH-ORD-${orderId}`, 14, 105);
  doc.text(
    `Order Date: ${createdAtDate.toLocaleDateString()}`,
    14,
    111,
  );
  doc.text(`Payment Method: ${order.paymentMethod ?? "Razorpay"}`, 14, 117);
  doc.text(`Payment Status: ${order.paymentStatus ?? "Paid"}`, 14, 123);

  // ===== BILLING DETAILS =====
  doc.setFontSize(12);
  doc.setTextColor(...darkBrown);
  doc.text("Billed To", 14, 133);

  const customer = order.customer || {};
  const stateCity = customer.stateCity ?? "";
  const pinCode = customer.pinCode ?? "";

  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.text(`Name: ${customer.name ?? ""}`, 14, 139);
  doc.text(`Email: ${customer.email ?? ""}`, 14, 145);
  doc.text(`Phone: ${customer.phone ?? ""}`, 14, 151);

  doc.text("Shipping Address:", 14, 159);
  doc.text(
    `${customer.address ?? ""}, ${stateCity} - ${pinCode}, Malaysia`,
    14,
    165,
  );

  // ===== CALCULATIONS =====
  const items = order.items || [];
  const subtotal = items.reduce((sum: number, item: any) => {
    const basePrice = resolveSellingPrice(item);
    const customPrice =
      item.isCustomized && item.customPrice ? item.customPrice : 0;
    return sum + (basePrice + customPrice) * (item.Quantity || 0);
  }, 0);

  const shipping = order.shippingCharge ?? 0;
  const discount = order.discountAmount ?? order.discount ?? 0;
  const grandTotal = order.total ?? subtotal - discount + shipping;

  const tax = orderTaxBreakdown(order);

  // ===== ORDER TABLE =====
  autoTable(doc, {
    startY: 173,
    head: [["Item Name", "Qty", "Price", "Total"]],
    body: items.map((item: any) => {
      const basePrice = resolveSellingPrice(item);
      const customPrice =
        item.isCustomized && item.customPrice ? item.customPrice : 0;
      const itemPrice = basePrice + customPrice;
      const qty = item.Quantity || 0;
      const itemTotal = itemPrice * qty;

      return [
        item.product?.ProductName ?? "Product",
        qty,
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

  const finalY = (doc as any).lastAutoTable?.finalY || 173;

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

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order, orderId, sendTo } = body || {};

    const recipient = sendTo || order?.customer?.email;
    if (!recipient) return NextResponse.json({ error: "No recipient" }, { status: 400 });

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) return NextResponse.json({ error: "Email not configured" }, { status: 500 });

    const transportOptions: any = {
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: { user, pass },
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const data = { ...order, orderId };
    const pdfBuffer = await generatePdfBuffer(data);

    const senderName = process.env.SENDER_NAME || "The Sagar's Design House";

    const items = order?.items || [];
    const subtotal = items.reduce((sum: number, it: any) => {
      const basePrice = resolveSellingPrice(it);
      const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
      return sum + (basePrice + customPrice) * (it.Quantity || 0);
    }, 0);
    const shipping = order.shippingCharge ?? 0;
    const discount = order.discountAmount ?? order.discount ?? 0;
    const grandTotal = order.total ?? subtotal - discount + shipping;
    const tax = orderTaxBreakdown(order);

    const plainItems = items
      .map((it: any) => {
        const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
        const basePrice = resolveSellingPrice(it);
        const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
        const itemPrice = basePrice + customPrice;
        const qty = it.Quantity || 0;
        const lineTotal = itemPrice * qty;
        return `${name} | Qty: ${qty} | Price: RM ${itemPrice} | Total: RM ${lineTotal}`;
      })
      .join("\n");

    await transporter.sendMail({
      from: `${senderName} <${user}>`,
      to: recipient,
      subject: `Your The Sagar's Design House Order ${orderId || order?.id}`,
      text:
        `Thank you for shopping with The Sagar's Design House.\n\n` +
        `Order: ${orderId || order?.id}\n\n` +
        `Items (Name | Qty | Price | Total):\n${plainItems}\n\n` +
        `Subtotal: RM ${subtotal}\n` +
        (discount > 0 ? `Discount: -RM ${discount}\n` : "") +
        `Taxable Value: RM ${tax.taxableValue}\n` +
        `SST @ ${tax.sstRate}%: RM ${tax.sst}\n` +
        `Shipping: RM ${shipping}${shipping === 0 ? " (Free)" : ` (incl. service tax ${tax.shippingSst})`}\n` +
        `Grand Total: RM ${grandTotal}\n\n` +
        `Your invoice is attached as a PDF.`,
      html:
        `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #171813;">` +
        `<div style="background:#F1EEE7;padding:16px;border-radius:0;border:1px solid #D8D5CD;border-bottom:0;">` +
        `<h2 style="margin:0;color:#171813;font-family:'Cormorant Garamond',Georgia,serif;">Thank you for your order</h2>` +
        `<p style="margin:4px 0 0 0;color:#595B53;">The Sagar's Design House</p>` +
        `</div>` +
        `<div style="border:1px solid #D8D5CD;border-top:0;padding:16px;border-radius:0;background:#FFFFFF;">` +
        `<p style="margin-top:0;">Order <strong>#${orderId || order?.id}</strong> has been received.</p>` +
        `<p style="margin-bottom:8px;"><strong>Order summary</strong></p>` +
        `<table style="border-collapse:collapse;width:100%;font-size:13px;background:#ffffff;border:1px solid #D8D5CD;">` +
        `<thead>` +
        `<tr style="background:#F1EEE7;color:#171813;">` +
        `<th style="padding:8px 6px;text-align:left;border-bottom:1px solid #D8D5CD;">Item</th>` +
        `<th style="padding:8px 6px;text-align:center;border-bottom:1px solid #D8D5CD;">Qty</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #D8D5CD;">Price</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #D8D5CD;">Total</th>` +
        `</tr>` +
        `</thead>` +
        `<tbody>` +
        `${
          items.length
            ? items
                .map((it: any, index: number) => {
                  const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
                  const basePrice = resolveSellingPrice(it);
                  const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
                  const itemPrice = basePrice + customPrice;
                  const qty = it.Quantity || 0;
                  const lineTotal = itemPrice * qty;
                  const rowBg = index % 2 === 0 ? "#FFFFFF" : "#ffffff";
                  return (
                    `<tr style="background:${rowBg};">` +
                    `<td style="padding:8px 6px;border-bottom:1px solid #D8D5CD;">${name}</td>` +
                    `<td style="padding:8px 6px;text-align:center;border-bottom:1px solid #D8D5CD;">${qty}</td>` +
                    `<td style="padding:8px 6px;text-align:right;border-bottom:1px solid #D8D5CD;">RM ${itemPrice}</td>` +
                    `<td style="padding:8px 6px;text-align:right;border-bottom:1px solid #D8D5CD;">RM ${lineTotal}</td>` +
                    `</tr>`
                  );
                })
                .join("")
            : `<tr><td colspan="4" style="padding:8px 6px;text-align:center;color:#595B53;">(No items found)</td></tr>`
        }` +
        `</tbody>` +
        `</table>` +
        `<p style="margin-top:12px;">` +
        `Subtotal: <strong>RM ${subtotal}</strong><br/>` +
        (discount > 0
          ? `Discount: <strong>-RM ${discount}</strong><br/>`
          : "") +
        `Taxable Value: <strong>RM ${tax.taxableValue}</strong><br/>` +
        `SST @ ${tax.sstRate}%: <strong>RM ${tax.sst}</strong><br/>` +
        `Shipping: <strong>RM ${shipping}${shipping === 0 ? " (Free)" : ` (incl. service tax ${tax.shippingSst})`}</strong><br/>` +
        `Grand Total: <strong>RM ${grandTotal}</strong>` +
        `</p>` +
        `<p style="margin-top:12px;">Your invoice PDF is attached to this email.</p>` +
        `<p style="margin-top:12px;font-size:12px;color:#595B53;">If you have any questions, just reply to this email.</p>` +
        `</div>` +
        `</div>`,
      attachments: [
        { filename: `SAGARS_INVOICE_${orderId || order?.id}.pdf`, content: pdfBuffer },
      ],
    });

    // Send notification to support
    const supportEmail = process.env.SUPPORT_EMAIL || "support@thesagarsdesignhouse.com";
    await transporter.sendMail({
      from: `${senderName} <${user}>`,
      to: supportEmail,
      subject: `New Order Received - ${orderId || order?.id}`,
      text:
        `New order placed.\n\n` +
        `Order: ${orderId || order?.id}\n` +
        `Customer: ${order?.customer?.name || ""}\n` +
        `Email: ${recipient}\n` +
        `Phone: ${order?.customer?.phone || ""}\n` +
        `Address: ${order?.customer?.address || ""}, ${order?.customer?.stateCity || ""} ${order?.customer?.pinCode || ""}\n\n` +
        `Items:\n${plainItems}\n\n` +
        `Grand Total: RM ${grandTotal}\n`,
      html:
        `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #171813;">` +
        `<div style="background:#F1EEE7;padding:16px;border-radius:0;border:1px solid #D8D5CD;border-bottom:0;">` +
        `<h2 style="margin:0;color:#171813;font-family:'Cormorant Garamond',Georgia,serif;">New Order Received</h2>` +
        `<p style="margin:4px 0 0 0;color:#595B53;">Order #${orderId || order?.id}</p>` +
        `</div>` +
        `<div style="border:1px solid #D8D5CD;border-top:0;padding:16px;border-radius:0;background:#FFFFFF;">` +
        `<p><strong>Customer:</strong> ${order?.customer?.name || ""}</p>` +
        `<p><strong>Email:</strong> ${recipient}</p>` +
        `<p><strong>Phone:</strong> ${order?.customer?.phone || ""}</p>` +
        `<p><strong>Address:</strong> ${order?.customer?.address || ""}, ${order?.customer?.stateCity || ""} ${order?.customer?.pinCode || ""}</p>` +
        `<h3 style="margin-top:16px;">Order Summary</h3>` +
        `<table style="border-collapse:collapse;width:100%;font-size:13px;background:#ffffff;border:1px solid #D8D5CD;">` +
        `<thead><tr style="background:#F1EEE7;">` +
        `<th style="padding:8px 6px;text-align:left;border-bottom:1px solid #D8D5CD;">Item</th>` +
        `<th style="padding:8px 6px;text-align:center;border-bottom:1px solid #D8D5CD;">Qty</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #D8D5CD;">Total</th>` +
        `</tr></thead><tbody>${
          items.length
            ? items.map((it: any, index: number) => {
                const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
                const basePrice = resolveSellingPrice(it);
                const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
                const itemPrice = basePrice + customPrice;
                const qty = it.Quantity || 0;
                const lineTotal = itemPrice * qty;
                return `<tr style="background:${index % 2 === 0 ? "#FFFFFF" : "#ffffff"};"><td style="padding:8px 6px;border-bottom:1px solid #D8D5CD;">${name}</td><td style="padding:8px 6px;text-align:center;border-bottom:1px solid #D8D5CD;">${qty}</td><td style="padding:8px 6px;text-align:right;border-bottom:1px solid #D8D5CD;">RM ${lineTotal}</td></tr>`;
              }).join("")
            : `<tr><td colspan="3" style="padding:8px 6px;text-align:center;">(No items)</td></tr>`
        }</tbody></table>` +
        `<p style="margin-top:12px;"><strong>Grand Total: RM ${grandTotal}</strong></p>` +
        `</div></div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("send-invoice error:", err);
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
