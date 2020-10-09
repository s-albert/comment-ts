declare namespace SerializeError {
    export interface serializeError {
        (error: Error): string;
    }
}

declare module "serialize-error" {
    const serializeError: SerializeError.serializeError;
    export = serializeError;
}
