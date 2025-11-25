export const loadCashfreeScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("cashfree-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.id = "cashfree-js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};