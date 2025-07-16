export type FromWebActions = {
    echo: {
        message: string;
    };
    connected: {
        address: string;
    };
    closeModal: {};
    rpc: {
        id: string;
        requestId: string;
        content: unknown;
    };
};
export type FromWebActionNames = keyof FromWebActions;
export type FromNativeActions = {
    echo: {
        message: string;
    };
    openModal: {};
    rpc: {
        id: string;
        requestId: string;
        content: unknown;
    };
};
export type FromNativeActionNames = keyof FromNativeActions;
