class __Navimi_Fetch implements INavimi_Fetch {

    private _bustCache: string;
    private loadErrors: INavimi_KeyList<string> = {};

    public init = (options: INavimi_Options): void => {
        this._bustCache = options.bustCache;
    };

    public getErrors = (url: string): string => {
        return this.loadErrors[url];
    };

    public fetchFile = (url: string, options?: RequestInit): Promise<string> => {
        return new Promise((resolve, reject) => {
            delete this.loadErrors[url];

            const requestUrl = url + (this._bustCache ? '?v=' + this._bustCache : '');

            fetch(requestUrl, options)
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

//removeIf(dist)
module.exports.fetch = __Navimi_Fetch;
//endRemoveIf(dist)
