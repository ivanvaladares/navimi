import { INavimi_Route, INavimi_Services, INavimi_Options } from './Navimi'

declare class INavimi_Core {
    constructor(routes: Record<string, INavimi_Route>, services: INavimi_Services, options?: INavimi_Options);
}

export { INavimi_Core }