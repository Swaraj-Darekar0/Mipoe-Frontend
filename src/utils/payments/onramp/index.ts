export interface OnrampWidgetParams {
  appId?: string;
  walletAddress: string;
  fiatAmount: number;
  fiatType?: number; // 1 = INR
  coinCode?: string; // "usdc"
  network?: string; // "base"
  paymentMethod?: number; // 1 = Instant UPI
  redirectUrl?: string;
  onSuccess?: (event: any) => void;
  onClose?: () => void;
}

export const loadOnrampScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("onramp-web-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://onramp.money/main/assets/js/onramp-sdk.js";
    script.id = "onramp-web-sdk";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openOnrampWidget = (params: OnrampWidgetParams) => {
  const baseUrl = "https://onramp.money/main/buy";

  const searchParams = new URLSearchParams({
    appId: params.appId || "mipoe_sandbox_app",
    walletAddress: params.walletAddress,
    fiatType: String(params.fiatType ?? 1),
    fiatAmount: String(params.fiatAmount),
    coinCode: params.coinCode || "usdc",
    network: params.network || "base",
    paymentMethod: String(params.paymentMethod ?? 1),
  });

  if (params.redirectUrl) {
    searchParams.set("redirectUrl", params.redirectUrl);
  }

  const widgetUrl = `${baseUrl}?${searchParams.toString()}`;

  // If window.onrampWebSDK is available, instantiate modal
  const sdk = (window as any).onrampWebSDK;
  if (sdk && typeof sdk.init === "function") {
    sdk.init({
      url: widgetUrl,
      onSuccess: params.onSuccess,
      onClose: params.onClose,
    });
    return;
  }

  // Fallback: Open in focused popup window
  const width = 450;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const popup = window.open(
    widgetUrl,
    "OnrampMoneyCheckout",
    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no`
  );

  // Monitor message events from onramp iframe/popup
  const messageListener = (event: MessageEvent) => {
    if (event.origin && (event.origin.includes("onramp.money") || event.origin.includes("testnet.onramp.money"))) {
      if (event.data?.type === "ONRAMP_SUCCESS" || event.data?.event === "SUCCESS") {
        if (params.onSuccess) params.onSuccess(event.data);
      }
      if (event.data?.type === "ONRAMP_CLOSE") {
        if (params.onClose) params.onClose();
        window.removeEventListener("message", messageListener);
      }
    }
  };
  window.addEventListener("message", messageListener);

  return popup;
};
