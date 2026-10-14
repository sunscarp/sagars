import { NextRequest, NextResponse } from "next/server";
import { stateFromPostcode } from "@/utils/shipping";

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get("pincode") || "";
  const country = req.nextUrl.searchParams.get("country") || "Malaysia";

  const digits = pincode.replace(/\D/g, "");

  // Non-Malaysia: return the country as the region
  if (country !== "Malaysia") {
    if (digits.length < 3) {
      return NextResponse.json({ city: "", state: "", district: "", error: "Invalid postal code" }, { status: 400 });
    }
    return NextResponse.json({
      city: "",
      state: country,
      district: "",
    });
  }

  if (!/^\d{5}$/.test(digits)) {
    return NextResponse.json({ error: "Invalid postcode" }, { status: 400 });
  }

  const state = stateFromPostcode(digits);
  return NextResponse.json({
    city: "",
    state,
    district: state,
  });
}
