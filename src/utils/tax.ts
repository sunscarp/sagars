// SST (Sales & Service Tax) helpers for The Sagar's Design House (Malaysia).
//
// Product prices are SST-INCLUSIVE, so the Sales Tax is back-calculated from
// the total the customer actually pays (the customer-facing total never
// changes). Freight carries Service Tax baked into the shipping charge.

export const PRODUCT_SST_RATE = 10; // Sales Tax on goods
export const SHIPPING_SERVICE_TAX_RATE = 8; // Service Tax on freight

export const round2 = (n: number) => Math.round(n * 100) / 100;

export type TaxSplit = {
  taxable: number;
  sst: number;
  rate: number;
};

// Back-calculate SST from an SST-inclusive amount so that
// taxable + sst === inclusive exactly (2-decimal rounding).
export function splitInclusiveTax(
  inclusive: number,
  rate = PRODUCT_SST_RATE
): TaxSplit {
  const amount = Math.max(0, Number(inclusive) || 0);
  if (amount === 0) {
    return { taxable: 0, sst: 0, rate };
  }
  const taxable = round2((amount * 100) / (100 + rate));
  const sst = round2(amount - taxable);
  return { taxable, sst, rate };
}

export type OrderTaxBreakdown = {
  taxableValue: number;
  sst: number;
  sstRate: number;
  shippingTaxable: number;
  shippingSst: number;
  shippingSstRate: number;
  totalTax: number;
};

// Resolve the SST breakdown for an order. Uses stored fields when present (new
// orders) and falls back to back-calculation for older orders.
export function orderTaxBreakdown(order: any): OrderTaxBreakdown {
  const shippingCharge = Number(order?.shippingCharge ?? 0);

  let taxableValue: number;
  let sst: number;
  let sstRate = Number(order?.sstRate ?? PRODUCT_SST_RATE);

  const hasSst =
    order &&
    (typeof order.sst === "number" || typeof order.taxableValue === "number");

  if (hasSst) {
    taxableValue = Number(order.taxableValue ?? 0);
    sst = Number(order.sst ?? 0);
  } else {
    // Inclusive back-calc from product portion of the total
    const productTotal = Math.max(0, Number(order?.total ?? 0) - shippingCharge);
    const split = splitInclusiveTax(productTotal, sstRate);
    taxableValue = split.taxable;
    sst = split.sst;
    sstRate = split.rate;
  }

  // Shipping service tax (inclusive)
  let shippingTaxable: number;
  let shippingSst: number;
  if (
    order &&
    (typeof order.shippingSst === "number" ||
      typeof order.shippingTaxable === "number")
  ) {
    shippingTaxable = Number(order.shippingTaxable ?? 0);
    shippingSst = Number(order.shippingSst ?? 0);
  } else {
    const s = splitInclusiveTax(shippingCharge, SHIPPING_SERVICE_TAX_RATE);
    shippingTaxable = s.taxable;
    shippingSst = s.sst;
  }

  return {
    taxableValue,
    sst,
    sstRate,
    shippingTaxable,
    shippingSst,
    shippingSstRate: SHIPPING_SERVICE_TAX_RATE,
    totalTax: round2(sst + shippingSst),
  };
}
