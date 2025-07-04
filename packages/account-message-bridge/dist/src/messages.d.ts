export type FromWebActions = {
    echo: {
        message: string;
    };
};
export type FromWebActionNames = keyof FromWebActions;
export type FromNativeActions = {
    echo: {
        message: string;
    };
};
export type FromNativeActionNames = keyof FromNativeActions;
