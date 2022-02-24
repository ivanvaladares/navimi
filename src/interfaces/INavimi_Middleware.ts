interface INavimi_Middlewares {
    addMiddlewares: (middlewares: INavimi_Middleware[]) => void;
    executeMiddlewares: (abortController: AbortController, context: INavimi_Context, callback: (url: string, params: INavimi_KeyList<any>) => void) => Promise<void>;
}