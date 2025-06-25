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
export declare function connectSophon(options?: SophonAuthOptions): Promise<SophonAuthResult>;
export declare const sophonSsoConnector: (options?: {
    session?: any;
    paymaster?: `0x${string}`;
}) => import("@wagmi/core").CreateConnectorFn<import("zksync-sso/.").ProviderInterface, Record<string, unknown>, Record<string, unknown>>;
export default connectSophon;
