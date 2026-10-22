import { loadCashfreeScript } from "./cashfree";
import { loadRazorpayScript } from "./razorpay";

export { loadCashfreeScript } from "./cashfree";
export { loadRazorpayScript } from "./razorpay";

export async function loadGatewayScript(gateway: "cashfree" | "razorpay"): Promise<boolean> {
  if (gateway === "razorpay") {
    return await loadRazorpayScript();
  }
  return await loadCashfreeScript();
}
