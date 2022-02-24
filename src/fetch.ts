class __Navimi_Fetch implements INavimi_Fetch {

    private _bustCache: string;
    private _fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

    private loadErrors: INavimi_KeyList<string> = {};

    public init = (options: INavimi_Options, fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>): void => {
        this._bustCache = options.bustCache;
        this._fetch = fetch;
    };

    public getErrors = (url: string): string => {
        return this.loadErrors[url];
    };

    public fetchFile = (url: string, options?: RequestInit): Promise<string> => {
        return new Promise((resolve, reject) => {
            delete this.loadErrors[url];

            const requestUrl = url + (this._bustCache ? '?v=' + this._bustCache : '');

            //todo: add retry with options
            (this._fetch || fetch)(requestUrl, options)
                .then(async (data: Response) => {
                    if (!data || !data.ok) {
                        const error = `Could not load the file! - ${url}`;
                        this.loadErrors[url] = error;
                        return reject(error);
                    }
                    resolve(await data.text());
                })
                .catch(ex => {
                    this.loadErrors[url] = ex.message;
                    reject(ex);
                });

        });

    };

}