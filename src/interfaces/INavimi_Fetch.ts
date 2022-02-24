interface INavimi_Fetch {
    init: (options: INavimi_Options) => void;
    getErrors: (url: string) => string
    fetchFile: (url: string, options?: RequestInit) => Promise<string>;
}