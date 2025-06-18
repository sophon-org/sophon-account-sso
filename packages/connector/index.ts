export interface SophonAuthResult {
  type: "SOPHON_ACCOUNT_CREATED" | "SOPHON_ACCOUNT_LOGIN";
  data: {
    address: string;
    username?: string;
    passkeyPublicKey?: string;
    mode: "create" | "login";
    timestamp: string;
  };
}

export interface SophonAuthOptions {
  authUrl?: string;
  popupWidth?: number;
  popupHeight?: number;
}

export function connectSophon(
  options: SophonAuthOptions = {}
): Promise<SophonAuthResult> {
  const {
    authUrl = "http://localhost:3000",
    popupWidth = 400,
    popupHeight = 600,
  } = options;

  return new Promise((resolve, reject) => {
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;

    const popup = window.open(
      authUrl,
      "sophon-auth",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (
        !event.origin.includes("localhost") &&
        !event.origin.includes("sophon")
      ) {
        return;
      }

      if (
        event.data.type === "SOPHON_ACCOUNT_CREATED" ||
        event.data.type === "SOPHON_ACCOUNT_LOGIN"
      ) {
        window.removeEventListener("message", messageHandler);
        clearInterval(checkClosed);
        resolve(event.data);
      }
    };

    window.addEventListener("message", messageHandler);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageHandler);
        reject(new Error("Authentication cancelled"));
      }
    }, 1000);
  });
}

export default connectSophon;
