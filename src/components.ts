
class __Navimi_Components implements INavimi_Components {

    private _components: INavimi_KeyList<any> = {};
    private _navimiHelpers: INavimi_Helpers;

    public init(navimiHelpers: INavimi_Helpers): void {

        this._navimiHelpers = navimiHelpers;
        this._components = {};

        new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let node: any;
                for (node of mutation.addedNodes) {
                    if (this._components[node.localName] && !node.attributes["initialized"]) {
                        this.registerTag(node);
                    }
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    registerComponent = (name: string, componentClass: InstanceType<any>): void => {
        if (!this._components[name] && /\-/.test(name)) {
            this._components[name] = this.createElement(componentClass, this);
            [].slice.call(document.querySelectorAll(name)).map(this.registerTag)
        }
    };

    registerTag = (element: Element): void => {
        // connects the component class to the tag 
        const componentClass = this._components[element.localName];
        Object.setPrototypeOf(element, componentClass.prototype);
        //@ts-ignore
        element.init();
    };

    iterateChildren = (item: any, callback: any): void => {
        Object.keys(this._components).map(name => {
            [].slice.call(item.querySelectorAll(name)).map(callback);
        });
    }

    createElement = (Element: InstanceType<any>, navimiComponents: any): InstanceType<any> => {

        return class extends (Element) {


            eventHandler(handler: () => boolean) {
                return (event: Event) => (handler.call(this, event) !== false && event.defaultPrevented) || this.render();
            }

            registerClassHandlers(handler: string) {
                if (/^on/.test(handler) && handler in HTMLElement.prototype) {
                    this.addEventListener(handler.substr(2), this.eventHandler(this[handler]))
                }
            }

            registerTagsEvents(node: any) {
                for (let list of [].slice.call(node.attributes)) {
                    if (/^on/.test(list.name)) {
                        const eventName: string = list.name;
                        const handler: string[] = /{\s*(\w+)/.exec(node[eventName]) || [];
                        if (handler && handler[1]) {
                            node[eventName] = this.eventHandler(this[handler[1]])
                        }
                    }
                }
            }

            init() {
                this.setAttribute("initialized", "true");
                super.init && super.init();
                Object.getOwnPropertyNames(Element.prototype).map(this.registerClassHandlers, this);
                this.render();
            }

            render() {
                this.props = this.props || {};

                if (this.props.children === undefined) {
                    this.props.children = this.innerHTML;
                }

                navimiComponents.iterateChildren(this, (element: any) => {
                    element.onBeforeRemove && element.onBeforeRemove();
                });

                // todo: use virtual or shadow dom.
                this.innerHTML = super.render && super.render();

                navimiComponents.iterateChildren(this, navimiComponents.registerTag);

                [].slice.call(this.querySelectorAll("*")).map(this.registerTagsEvents, this);
            }
        }
    };
}