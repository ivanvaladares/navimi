import { INavimi_Components } from './@types/INavimi_Components';
import { INavimi_State } from './@types/INavimi_State';
import { INavimi_Functions } from './@types/Navimi';
import { getNodeContent } from './helpers/getNodeContent';
import { getNodeType } from './helpers/getNodeType';
import { mergeHtmlElement } from './helpers/mergeHtmlElement';
import { syncAttributes } from './helpers/syncAttributes';
import { throttle } from './helpers/throttle';

// Configuração do Registry Global para Hot Reload
const globalRegistry = (window as any).__NAVIMI_REGISTRY__ || {};
(window as any).__NAVIMI_REGISTRY__ = globalRegistry;

class __Navimi_Components implements INavimi_Components {

    private _navimiState: INavimi_State;
    private _uidCounter = 0;

    public init(navimiState: INavimi_State): void {
        this._navimiState = navimiState;
    }

    private _mergeHtml = (template: Element | DocumentFragment, node: Element | DocumentFragment | ShadowRoot) => {
        const getCleanNodes = (n: NodeList) => {
            return [].slice.call(n).filter((child: Node) => {
                return child.nodeType !== 3 || (child.textContent && child.textContent.trim().length > 0);
            });
        };

        const templateNodes: Element[] = getCleanNodes(template.childNodes) as Element[];
        const documentNodes: Element[] = getCleanNodes(node.childNodes) as Element[];

        const templateNodesLen = templateNodes.length;
        const documentNodesLen = documentNodes.length;

        for (let i = 0; i < templateNodesLen; i++) {
            const templateNode = templateNodes[i];
            const documentNode = documentNodes[i];

            if (!documentNode) {
                node.appendChild(templateNode.cloneNode(true));
                continue;
            }

            const typeMatch = getNodeType(templateNode) === getNodeType(documentNode);
            const tKey = templateNode.id || templateNode.getAttribute?.('key');
            const dKey = documentNode.id || documentNode.getAttribute?.('key');

            let keyMatch = true;
            if ((tKey && tKey !== '') || (dKey && dKey !== '')) {
                keyMatch = tKey === dKey;
            }

            if (!typeMatch || !keyMatch) {
                const nextSibling = documentNode.nextSibling;
                const newNode = templateNode.cloneNode(true);

                if (documentNode.parentNode === node) {
                    documentNode.replaceWith(newNode);
                } else if (nextSibling) {
                    nextSibling.before(newNode);
                } else {
                    node.append(newNode);
                }
                continue;
            }

            const templateContent = getNodeContent(templateNode);
            const documentContent = getNodeContent(documentNode);
            if (templateContent && templateContent !== documentContent) {
                documentNode.textContent = templateContent;
            }

            if (templateNode.localName) {
                syncAttributes(templateNode, documentNode);
                if (!templateNode.localName.includes('-')) {
                    mergeHtmlElement(templateNode, documentNode, this._mergeHtml);
                }
            }
        }

        for (let i = documentNodesLen - 1; i >= templateNodesLen; i--) {
            const nodeToRemove = documentNodes[i];
            nodeToRemove.remove();
        }
    };

    public registerComponent = (
        componentName: string,
        componentClass: any,
        getFunctions?: (callerUid: string) => INavimi_Functions,
        services?: Record<string, InstanceType<any>>): InstanceType<any> => {

        if (!componentName || !/-/.test(componentName)) {
            return;
        }

        // [HOT RELOAD - PASSO 1]
        // Sempre atualizamos o Registry com a versão mais nova da classe e dependências
        globalRegistry[componentName] = {
            Class: componentClass,
            getFunctions,
            services
        };

        // [HOT RELOAD - PASSO 2]
        // Se já existe, executamos o Hot Swap e paramos por aqui (não tentamos redefinir a tag)
        //removeIf(minify)
        if (customElements.get(componentName)) {
            this._performHotSwap(componentName);

            // Retorna o construtor do componente já registrado
            return customElements.get(componentName);
        }
        //endRemoveIf(minify)

        const self = this;

        const wrappedComponentClass = class NavimiWebComponent extends HTMLElement {
            private _instance: any;
            private _uid: string;
            private _mounted = false;
            private _previousTemplate: string | undefined;
            private _initialInnerHTML: string;
            private _attrObserver: MutationObserver | null = null;
            private _shadowRoot: ShadowRoot | null = null;

            public props: Record<string, any> = {};

            constructor() {
                super();
                this._uid = `component:${self._uidCounter++}`;
                this._initialInnerHTML = this.innerHTML;

                this._syncPropsFromAttributes();

                // 1. Shadow DOM Opcional
                if (this.hasAttribute('shadow')) {
                    this._shadowRoot = this.attachShadow({ mode: 'open' });
                }

                // [HOT RELOAD - PASSO 3]
                // Instanciação Dinâmica: Não usamos a 'componentClass' do closure,
                // mas sim a que está no Registry global (que pode ter sido atualizada).
                this._initializeInstance();
            }

            // Método extraído para permitir re-inicialização durante o Hot Swap
            _initializeInstance() {
                const def = globalRegistry[componentName];
                const CurrentClass = def.Class;
                // @ts-ignore
                const getFuncs = def.getFunctions || (() => undefined);
                
                // Instancia a classe mais atual
                this._instance = new CurrentClass(this.props, getFuncs(this._uid), def.services);

                // Configurações Padrão
                this._instance.props = this.props;
                this._instance.element = this;
                this._instance.childComponents = [];
                this._instance.parentComponent = null;
                this._instance.update = throttle(this.render.bind(this), 16, this);

                this._mixinClassMethods(CurrentClass);
            }

            // Agora público para ser acessado pelo _performHotSwap
            public _mixinClassMethods(originalClass: any) {
                const proto = originalClass.prototype;
                const methods = Object.getOwnPropertyNames(proto);

                methods.forEach(method => {
                    const internalProps = ['constructor', 'render', 'update', 'onMount', 'onRender', 'onUnmount'];
                    if (internalProps.includes(method) || method.startsWith('_')) return;

                    // Sobrescrevemos o método no wrapper para apontar para a nova instância
                    // @ts-ignore
                    this[method] = (...args) => this._instance[method](...args);
                });

                // Garante que o getter de state aponte para a nova instância
                Object.defineProperty(this, 'state', {
                    get: () => this._instance.state,
                    set: (v) => this._instance.state = v,
                    configurable: true // Importante para permitir redefinição
                });
            }

            async connectedCallback() {
                if (!this._mounted) {
                    try {
                        this._connectToParent();

                        this._attrObserver = new MutationObserver((mutations) => {
                            let hasChanges = false;
                            const oldProps = { ...this.props };

                            mutations.forEach(mutation => {
                                if (mutation.type === 'attributes') {
                                    const name = mutation.attributeName!;
                                    const val = this.getAttribute(name);
                                    
                                    // 2. Tratamento de Booleanos
                                    if (val === null) {
                                        delete this.props[name];
                                    } else if (val === '') {
                                        this.props[name] = true;
                                    } else {
                                        this.props[name] = val;
                                    }

                                    if (this.props[name] !== oldProps[name]) {
                                        hasChanges = true;
                                    }
                                }
                            });

                            if (hasChanges) {
                                this._instance.props = this.props;

                                if (!this._instance.shouldUpdate || this._instance.shouldUpdate(oldProps, this.props)) {
                                    this._instance.update();
                                }
                            }
                        });

                        this._attrObserver.observe(this, { attributes: true });

                        await this.render();

                        await this._instance.onMount?.();
                        
                        this._mounted = true;
                        
                    } catch (e) {
                        console.error(`[Navimi] Erro ao montar <${this.localName}>:`, e);
                        // Opcional: renderizar erro se falhar no mount
                    }
                }
            }

            disconnectedCallback() {
                if (this._attrObserver) {
                    this._attrObserver.disconnect();
                    this._attrObserver = null;
                }

                // Limpeza segura
                if (this._instance && this._instance.parentComponent) {
                    this._instance.parentComponent.childComponents =
                        this._instance.parentComponent.childComponents.filter(
                            (child: any) => child !== this._instance
                        );
                }

                if (self._navimiState) {
                    self._navimiState.unwatchState(this._uid);
                }

                this._instance.onUnmount?.();

                this._mounted = false;
            }

            async render() {
                // Se a instância não existe ou não tem render, aborta
                if (!this._instance || !this._instance.render) return;

                try {
                    // 1. Tenta executar o render do usuário
                    // Nota: Já removi o .call() redundante conforme conversamos
                    const html = await this._instance.render(this._initialInnerHTML);

                    const target = this._shadowRoot || this;

                    // Limpeza se vazio
                    if (!html) {
                        target.innerHTML = '';
                        return;
                    }

                    // Cache check (simples string check)
                    if (html === this._previousTemplate) return;
                    this._previousTemplate = html;

                    // Parse e Merge
                    const template = document.createElement('template');
                    template.innerHTML = html;
                    const frag = template.content;

                    self._mergeHtml(frag, target);

                    // 2. Só chama onRender se tudo acima funcionou
                    this._instance.onRender?.();

                } catch (e) {
                    // --- ZONA DE SEGURANÇA ---
                    
                    console.error(`[Navimi] Erro fatal no componente <${this.localName}>:`, e);
                    
                    // Renderiza um Fallback Visual para o desenvolvedor/usuário saber que ali deu erro
                    // em vez de deixar um buraco branco na tela.
                    const target = this._shadowRoot || this;
                    
                    // Você pode customizar esse HTML de erro
                    target.innerHTML = `
                        <div style="
                            padding: 8px; 
                            border: 1px dashed #ff4d4f; 
                            background: #fff2f0; 
                            color: #ff4d4f; 
                            font-family: monospace; 
                            font-size: 12px;
                            border-radius: 4px;
                            margin: 4px 0;
                        ">
                            ⚠️ <strong>&lt;${this.localName}&gt; Error:</strong><br>
                            ${(e as Error).message}
                        </div>
                    `;
                    
                    // Opcional: Se tiver um método onError no componente, chama ele
                    this._instance.onError?.(e);
                }
            }

            private _syncPropsFromAttributes() {
                for (const attr of Array.from(this.attributes)) {
                    this.props[attr.name] = attr.value === '' ? true : attr.value;
                }
                if (this._instance) {
                    this._instance.props = this.props;
                }
            }

            private _connectToParent() {
                let parent = this.parentElement;
                while (parent) {
                    if (parent.tagName.includes('-') && customElements.get(parent.tagName.toLowerCase())) {
                        const parentInstance = (parent as any)._instance;
                        if (parentInstance) {
                            this._instance.parentComponent = parentInstance;
                            if (!parentInstance.childComponents.includes(this._instance)) {
                                parentInstance.childComponents.push(this._instance);
                            }
                            return;
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }

        customElements.define(componentName, wrappedComponentClass);
        return wrappedComponentClass;
    };

    // [HOT RELOAD - PASSO 4]
    // A mágica acontece aqui: Substituímos o cérebro (_instance) mantendo o corpo (DOM)
    //removeIf(minify)    
    private _performHotSwap(componentName: string) {
        const elements = document.querySelectorAll(componentName);
        
        elements.forEach((el: any) => {
            if (el._instance) {
                // 1. Salva o estado antigo para restaurar (State Preservation)
                const oldState = el._instance.state;
                
                // 2. Chama onUnmount da instância antiga (Cleanup)
                if (el._instance.onUnmount) el._instance.onUnmount();

                // 3. Reinicializa usando a NOVA classe do Registry
                // Isso cria o novo this._instance
                el._initializeInstance();

                // 4. Restaura o estado (se possível)
                if (oldState && el._instance.state) {
                    // Merge cuidadoso ou substituição total
                    el._instance.state = { ...el._instance.state, ...oldState };
                }

                // 5. Reconecta e Renderiza
                if (el._instance.onMount) el._instance.onMount();
                
                el.render(); // Força update visual imediato
            }
        });
    }
    //endRemoveIf(minify)
}

export default __Navimi_Components;
