import { QRCodeSVG } from "qrcode.react";

const UPI_ID = "7728059988@ptyes";
const CAFÉ_NAME = "THE BELGRAVIA ROAST";

/**
 * Build a standard UPI payment URI. Scanning this with any UPI app
 * (Paytm, PhonePe, GPay, BHIM, ...) opens a payment sheet for this
 * account, with the order amount and note pre-filled when available.
 */
export function buildUpiUri(opts: { amount?: number; orderId?: string } = {}) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: CAFÉ_NAME,
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
 * Placeholder QR code rendered when the owner's real UPI QR image
 * (public/manasqrcode.jpeg) is not present in the project yet.
 * It encodes the same UPI account, so customers can still scan and pay.
 */
export function UpiQrCode({ amount, orderId }: { amount?: number; orderId?: string }) {
  const value = buildUpiUri({ amount, orderId });
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