import { 
    INavimi_Middleware, 
    INavimi_Context
} from './Navimi';

declare class INavimi_Middlewares {
    addMiddlewares: (middlewares: INavimi_Middleware[]) => void;
    executeMiddlewares: (abortController: AbortController, context: INavimi_Context, callback: (url: string, params: Record<string, any>) => void) => Promise<any>;
}

export { INavimi_Middlewares };