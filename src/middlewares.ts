import { INavimi_Middlewares } from './@types/INavimi_Middleware';
import { 
    INavimi_Context, 
    INavimi_Middleware 
} from './@types/Navimi';

class __Navimi_Middlewares implements INavimi_Middlewares {

    private _middlewareStack: INavimi_Middleware[] = [];

    public addMiddlewares = (middlewares: INavimi_Middleware[]): void => {
        if (Array.isArray(middlewares)) {
            this._middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
        }
    };

    public executeMiddlewares = async (abortController: AbortController, context: INavimi_Context, callback: (url: string, params: Record<string, any>) => void): Promise<any> => {
        let prevIndex = -1;
        const runner = async (resolve: (value?: unknown) => void, reject: (reason?: any) => void, index = 0): Promise<void> => {
            //removeIf(minify)
            if (index === prevIndex) {
                console.warn('next() called multiple times');
            }
            //endRemoveIf(minify)
            prevIndex = index;
            const middleware = this._middlewareStack[index];
            if (middleware) {
                try {
                    await middleware(context, async (url: string, params?: Record<string, any>) => {
                        if (abortController && abortController.signal.aborted) {
                            resolve();
                        } else {
                            if (!url) {
                                await runner(resolve, reject, index + 1);
                            } else {
                                callback(url, params);
                                resolve();
                            }
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve();
            }
        }
        return await new Promise(runner);
    };

}

export default __Navimi_Middlewares;
