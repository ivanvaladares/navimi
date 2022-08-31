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
            const error = `Could not load the file! - ${url}`;

            //todo: add retry with options

            fetch(requestUrl, options)
                .then((data: Response) => {
                    if (!data || !data.ok) {
                        this.loadErrors[url] = error;
                        return reject(error);
                    }
                    data.text().then(resolve);
                })
                .catch(() => {
                    this.loadErrors[url] = error;
                    reject(error);
                });

        });

    };

}

//removeIf(dist)
module.exports.fetch = __Navimi_Fetch;
//endRemoveIf(dist)
