import { QRCodeSVG } from "qrcode.react";

/** Defaults used until the café configures its UPI ID in admin Settings. */
const DEFAULT_UPI_ID = "7728059988@ptyes";
const DEFAULT_CAFE_NAME = "THE BELGRAVIA ROAST";

/**
 * Build a standard UPI payment URI. Scanning this with any UPI app
 * (Paytm, PhonePe, GPay, BHIM, ...) opens a payment sheet for this
 * account, with the order amount and note pre-filled when available.
 */
function buildUpiUri(
  opts: { amount?: number; orderId?: string; upiId?: string; cafeName?: string } = {},
) {
  const params = new URLSearchParams({
    pa: opts.upiId?.trim() || DEFAULT_UPI_ID,
    pn: opts.cafeName?.trim() || DEFAULT_CAFE_NAME,
    cu: "INR",
  });
  if (opts.amount && opts.amount > 0) {
    params.set("am", String(opts.amount));
  }
  if (opts.orderId) {
    params.set("tn", `Order ${opts.orderId}`);
  }
  return `upi://pay?${params.toString()}`;
}

/**
 * Generated QR used when the owner's real UPI QR image
 * (public/manasqrcode.jpeg) is not present in the project. When an
 * upiId from Settings is provided, it always wins over the default.
 */
export function UpiQrCode({
  amount,
  orderId,
  upiId,
  cafeName,
}: {
  amount?: number;
  orderId?: string;
  upiId?: string;
  cafeName?: string;
}) {
  const value = buildUpiUri({ amount, orderId, upiId, cafeName });
  return (
    <QRCodeSVG
      value={value}
      size={256}
      level="M"
      marginSize={2}
      bgColor="#FFFFFF"
      fgColor="#1B2A3D"
      className="h-full w-full"
    />
  );
}
