/**
 * Navimi v0.2.1 
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com 
 * https://github.com/ivanvaladares/navimi 
 */ 
class __Navimi_Core{constructor(t,i,e){this._navigateTo=(t,i)=>{this._initRoute(t,i)},this._reportError=t=>{this._options.onError?this._options.onError(t):console.error(t)},this._initRoute=async(t,i,c)=>{var e=this._navimiHelpers.removeHash(t||this._navimiHelpers.getUrl());if(!c){if(this._currentUrl===e)return;this._abortController.abort(),this._abortController=new AbortController}var s=++this._callId,_=void 0!==t;let{routeItem:a,params:r}=this._navimiHelpers.getRouteAndParams(e,this._routesList);if((void 0!==i&&(r=Object.assign(Object.assign({},r),i)),this._options.onBeforeRoute)&&!1===await this._options.onBeforeRoute({url:e,routeItem:a,params:r},this._navigateTo))return;if(this._currentJS&&!c){const l=this._navimiJs.getInstance(this._currentJS);if(l){const p=l.beforeLeave;if(p)if(!1===p({url:e,routeItem:a,params:r}))return void(_||history.forward());l.destroy&&l.destroy()}}if(a){if(await this._navimiMiddleware.executeMiddlewares(this._abortController,{url:e,routeItem:a,params:r},(t,i)=>{this._initRoute(t,i,!0)}),!(s<this._callId)){this._currentUrl=e;try{var{title:m,jsUrl:n,cssUrl:o,templatesUrl:h,dependsOn:d}=a||{};if(!n&&!h)throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");n&&(this._currentJS=n,this._routesParams[n]={url:e,routeItem:a,params:r}),_&&(null!=i&&i.replaceUrl?history.replaceState(null,null,t):history.pushState(null,null,t)),this._navimiCss.fetchCss(this._abortController,o).catch(t=>{}),this._navimiTemplates.fetchTemplate(this._abortController,[h]).catch(t=>{});try{this._navimiJs.loadServices(this._abortController,n,d)}catch(t){this._reportError(t)}for(n&&await this._navimiJs.fetchJS(this._abortController,[n],!1);o&&!this._navimiCss.isCssLoaded(o)||h&&!this._navimiTemplates.isTemplateLoaded(h)||this._options.globalCssUrl&&!this._navimiCss.isCssLoaded(this._options.globalCssUrl)||this._options.globalTemplatesUrl&&!this._navimiTemplates.isTemplateLoaded(this._options.globalTemplatesUrl);){if(await this._navimiHelpers.timeout(10),s<this._callId)return;if(o&&this._navimiFetch.getErrors(o)||h&&this._navimiFetch.getErrors(h)||this._options.globalCssUrl&&this._navimiFetch.getErrors(this._options.globalCssUrl)||this._options.globalTemplatesUrl&&this._navimiFetch.getErrors(this._options.globalTemplatesUrl))return void this._reportError(new Error(this._navimiFetch.getErrors(o)||this._navimiFetch.getErrors(h)||this._navimiFetch.getErrors(this._options.globalCssUrl)||this._navimiFetch.getErrors(this._options.globalTemplatesUrl)))}this._navimiDom.setTitle(m);try{if(!n){var v=this._navimiTemplates.getTemplate(h);const u=document.querySelector("body");return void(v&&u&&(u.innerHTML=v))}await this._navimiJs.initJS(n,this._routesParams[n])}catch(t){this._reportError(t)}finally{if(s<this._callId)return;this._navimiDom.setNavimiLinks(),this._navimiDom.insertCss(this._navimiCss.getCss(o),"routeCss"),this._options.onAfterRoute&&this._options.onAfterRoute({url:e,routeItem:a,params:r},this._navigateTo)}}catch(t){this._reportError(t)}}}else s===this._callId&&this._reportError(new Error("No route match for url: "+e))},this._callId=0,this._abortController=new AbortController,this._currentJS=void 0,this._currentUrl=void 0,this._routesParams={},this._routesList=t||{},this._options=i||{},this._win=window||{},this._navimiFetch=e.navimiFetch,this._navimiDom=e.navimiDom,this._navimiCss=e.navimiCss,this._navimiJs=e.navimiJs,this._navimiTemplates=e.navimiTemplates,this._navimiMiddleware=e.navimiMiddleware,this._navimiHot=e.navimiHot,this._navimiHelpers=e.navimiHelpers,this._win.addEventListener("popstate",()=>{this._initRoute()}),this._win.navigateTo=this._navigateTo,this._navimiMiddleware.addMiddlewares(this._options.middlewares),(async()=>{await this._init()})(),this._initRoute(),this._options.hot&&this._initHot()}async _init(){(this._options.globalCssUrl||this._options.globalTemplatesUrl)&&(await Promise.all([this._navimiCss.fetchCss(void 0,this._options.globalCssUrl),this._navimiTemplates.fetchTemplate(void 0,[this._options.globalTemplatesUrl])]).catch(this._reportError),this._navimiDom.insertCss(this._navimiCss.getCss(this._options.globalCssUrl),"globalCss"))}_initHot(){console.warn("HOT is disabled! Use the unminified version to enable it.")}}class __Navimi_CSSs{constructor(){this._loadedCsss={},this.isCssLoaded=t=>void 0!==this._loadedCsss[t],this.getCss=t=>this._loadedCsss[t],this.fetchCss=(s,a,r)=>new Promise(async(t,i)=>{if(!a||this._loadedCsss[a])return t();try{var e=await this._navimiFetch.fetchFile(a,{headers:{Accept:"text/css"},signal:s?s.signal:void 0});r?(this._navimiDom.insertCss(e,a,!0),this._loadedCsss[a]="loaded"):this._loadedCsss[a]=e,t()}catch(t){i(t)}}),this.reloadCss=(t,i,e,s,a)=>{}}init(t,i,e){this._navimiDom=t,this._navimiFetch=i,this._navimiHelpers=e}}const __NAVIMI_DEV=!0,__NAVIMI_PROD=!1;class __Navimi_Dom{constructor(){this.setTitle=t=>{document.title=t},this.setNavimiLinks=()=>{document.querySelectorAll("[navimi-link]").forEach(t=>{t.removeAttribute("navimi-link"),t.setAttribute("navimi-linked",""),t.addEventListener("click",t=>{t.preventDefault(),window.navigateTo(t.target.pathname)})})},this.insertCss=(t,i,e)=>{const s=i?document.querySelector(`[cssId='${i}']`):void 0;if(s&&s.remove(),t){const a=document.createElement("style");a.innerHTML=t,i&&a.setAttribute("cssId",i);const r=document.getElementsByTagName("head")[0]||document.body;e?r.prepend(a):r.appendChild(a)}},this.insertJS=(t,i)=>{const e=document.querySelector(`[jsUrl='${i}']`),s=(e&&e.remove(),document.createElement("script")),a=(s.type="text/javascript",s.innerHTML=t,s.setAttribute("jsUrl",i),document.getElementsByTagName("head")[0]);(a||document.body).appendChild(s)},this.addLibrary=async t=>{let i=Array.isArray(t)?t:[t];0<(i=i.filter(t=>!this._navimiJSs.isJsLoaded(t))).length&&await Promise.all(i.map(t=>{const i=t.split(".").pop();if("css"!==i.toLowerCase())return this._navimiJSs.fetchJS(void 0,[t]);this._navimiCSSs.fetchCss(void 0,t,!0)})).catch(t=>{throw new Error(t)})}}init(t,i){this._navimiCSSs=t,this._navimiJSs=i}}class __Navimi_Fetch{constructor(){this.loadErrors={},this.init=(t,i)=>{this._bustCache=t.bustCache,this._fetch=i},this.getErrors=t=>this.loadErrors[t],this.fetchFile=(a,i)=>new Promise((e,s)=>{delete this.loadErrors[a];var t=a+(this._bustCache?"?v="+this._bustCache:"");(this._fetch||fetch)(t,i).then(async t=>{var i;if(!t||!t.ok)return this.loadErrors[a]=i="Could not load the file! - "+a,s(i);e(await t.text())}).catch(t=>{this.loadErrors[a]=t.message,s(t)})})}}class __Navimi_Helpers{constructor(){this.parseQuery=t=>{const i={};return t.split("&").map(t=>{t=t.split("=");i[decodeURIComponent(t[0])]=decodeURIComponent(t[1]||"")}),i},this.splitPath=t=>{if(!t)return[];var i=t.indexOf("?");return(t=0<=i?t.substr(0,i):t).split("/").filter(t=>0<t.length)},this.parsePath=(t,i)=>{var e=t.indexOf("?"),s=0<e?t.substr(e+1,t.length):"";const a=this.splitPath(t),r=this.splitPath(i);let n={};0<e&&(n={queryString:this.parseQuery(s)});for(let t=0;t<r.length;t++)if(":"===r[t].charAt(0)){var o=r[t].slice(1);if(a.length<=t)return null;n[o]=decodeURIComponent(a[t])}else if(!a[t]||r[t].toLowerCase()!==a[t].toLowerCase())return null;return n},this.isSameFile=(t,i)=>t&&i&&t.split("?").shift().toLowerCase()==i.split("?").shift().toLowerCase(),this.timeout=i=>new Promise(t=>setTimeout(t,i)),this.debounce=(t,i)=>{let e;return function(){clearTimeout(e),e=setTimeout(()=>{e=null,t.apply(this,arguments)},i)}},this.getUrl=()=>{const t=document.location;var i=t.toString().match(/^[^#]*(#.+)$/);const e=i?i[1]:"";return[t.pathname,t.search,e].join("")},this.removeHash=t=>{var i=t.indexOf("#");return 0<i?t.substr(0,i):t},this.stringify=t=>{const i=[],s=e=>{if("function"==typeof e)return String(e);if(e instanceof Error)return e.message;if(null===e||"object"!=typeof e)return e;if(-1!==i.indexOf(e))return`[Circular: ${i.indexOf(e)}]`;if(i.push(e),Array.isArray(e))return t=e.map(s),i.pop(),t;var t=Object.keys(e).reduce((t,i)=>(t[i]=s(((t,i)=>{if(Object.prototype.hasOwnProperty.call(t,i))try{return t[i]}catch(t){return}return t[i]})(e,i)),t),{});return i.pop(),t};return JSON.stringify(s(t))},this.cloneObject=e=>null===e||"object"!=typeof e?e:Object.keys(e).reduce((t,i)=>(null!==e[i]&&"object"==typeof e[i]?t[i]=this.cloneObject(e[i]):t[i]=e[i],t),Array.isArray(e)?[]:{}),this.getRouteAndParams=(t,i)=>{var e=this.splitPath(t),s=i["*"];let a,r;for(const o in i){var n=this.splitPath(o);if(n.length===e.length&&(r=this.parsePath(t,o))){a=i[o];break}}return{routeItem:a=!a&&s?s:a,params:r}}}}class __Navimi_Hot{constructor(){this.openHotWs=(t,i)=>{},this._digestHot=(t,i,e,s,a,r)=>{}}init(t,i,e){this._navimiCSSs=t,this._navimiJSs=i,this._navimiTemplates=e}}class __Navimi_JSs{constructor(){this._navimiLoaderNS="__navimiLoader",this._callBackNS="_jsLoaderCallback",this._promiseNS="_promise_",this._loadedJSs={},this._externalJSs={},this._routesJSs={},this._dependencyJSsMap={},this._routesJSsServices={},this._awaitJS=s=>new Promise((t,i)=>{const e=setInterval(()=>this._routesJSs[s]?(clearInterval(e),t(this._routesJSs[s])):void 0===this._navimiLoader[this._promiseNS+s]?(clearInterval(e),i("Error loading file! "+s)):void 0,50)}),this._fetch=(s,a,r)=>new Promise(async(i,e)=>{try{let t;t="string"==typeof this._loadedJSs[a]?this._loadedJSs[a]:await this._navimiFetch.fetchFile(a,{headers:{Accept:"application/javascript"},signal:s?s.signal:void 0}),this._insertJS(a,t,r),void 0===r&&this._navimiLoader[this._promiseNS+a](!0),i()}catch(t){e(t)}}),this._insertJS=(t,i,e)=>{var s=void 0!==e?`(function(){window.${this._navimiLoaderNS}.${this._callBackNS}("${t}", ${e}, (function(){return ${i}   
                })())}())`:i;this._loadedJSs[t]=!!e||i,this._navimiDom.insertJS(s,t)},this._instantiateJS=async(e,t,s)=>{const a=this._navimiLoader[this._promiseNS+e],i=this._navimiLoader[this._promiseNS+e+"_reject"];if(setTimeout(()=>{delete this._navimiLoader[this._promiseNS+e],delete this._navimiLoader[this._promiseNS+e+"_reject"]},10),t)return this._externalJSs[e]=s,void(a&&a(Object.freeze(s)));try{this._navimiState.unwatchState(e);var r={addLibrary:this._navimiDom.addLibrary,setTitle:this._navimiDom.setTitle,navigateTo:window.navigateTo,getTemplate:this._navimiTemplates.getTemplate,fetchJS:t=>{const i=Array.isArray(t)?t:[t];return i.map(t=>{this._dependencyJSsMap[t]=Object.assign(Object.assign({},this._dependencyJSsMap[t]||{}),{[e]:!0})}),this.fetchJS(void 0,i,!0)},fetchTemplate:t=>{t=Array.isArray(t)?t:[t];return this._navimiTemplates.fetchTemplate(void 0,t,e)},setState:this._navimiState.setState,getState:this._navimiState.getState,setNavimiLinks:this._navimiDom.setNavimiLinks,unwatchState:t=>this._navimiState.unwatchState(e,t),watchState:(t,i)=>this._navimiState.watchState(e,t,i)};let i={};if(this._routesJSsServices[e]&&0<this._routesJSsServices[e].length){for(;;){if(-1===this._routesJSsServices[e].map(t=>void 0===this._externalJSs[this._options.services[t]]).indexOf(!0))break;if(this._routesJSsServices[e].map(t=>this._options.services[t]).find(t=>this._navimiFetch.getErrors(t)))return;await this._navimiHelpers.timeout(10)}this._routesJSsServices[e].map(t=>{i=Object.assign(Object.assign({},i),{[t]:this._externalJSs[this._options.services[t]]})})}var n=new s(Object.freeze(r),i);this._routesJSs[e]=n,a&&a(n)}catch(t){i&&i(t)}},this.isJsLoaded=t=>void 0!==this._loadedJSs[t],this.getInstance=t=>this._routesJSs[t],this.fetchJS=(s,t,a)=>{var i=e=>new Promise(async(t,i)=>a&&this._externalJSs[e]?t(this._externalJSs[e]):this._routesJSs[e]?t(this._routesJSs[e]):void(this._navimiLoader[this._promiseNS+e]?await this._awaitJS(e).then(t).catch(i):(this._navimiLoader[this._promiseNS+e]=t,this._navimiLoader[this._promiseNS+e+"_reject"]=i,this._fetch(s,e,a).catch(t=>{this._navimiLoader[this._promiseNS+e+"_reject"](t)}))));return 1<t.length?Promise.all(t.map(i)):i(t[0])},this.loadServices=(i,s,t)=>{if(s&&t&&0!==t.length&&(this._routesJSsServices[s]=this._routesJSsServices[s]||[],t&&0<t.length)){let e=[];const a=t.map(t=>{var i=this._options.services&&this._options.services[t];return void 0===i?e.push(t):(-1===this._routesJSsServices[s].indexOf(t)&&this._routesJSsServices[s].push(t),this._dependencyJSsMap[i]=Object.assign(Object.assign({},this._dependencyJSsMap[i]||{}),{[s]:!0})),i});if(0<e.length)throw new Error("Service(s) not defined: "+e.join(", "));Promise.all(a.filter(t=>void 0!==t).map(t=>this.fetchJS(i,[t],!0)))}},this.initJS=async(t,i)=>{const e=this.getInstance(t);e&&e.init&&await e.init(i)},this.reloadJs=(t,i,e,s,a)=>{}}init(t,i,e,s,a,r){this._navimiDom=t,this._navimiFetch=i,this._navimiTemplates=e,this._navimiState=s,this._navimiHelpers=a,this._options=r,this._navimiLoader=window[this._navimiLoaderNS]={[this._callBackNS]:this._instantiateJS}}}class __Navimi_Middleware{constructor(){this._middlewareStack=[],this.addMiddlewares=t=>{Array.isArray(t)&&this._middlewareStack.push(...t.filter(t=>void 0!==t))},this.executeMiddlewares=async(r,i,n)=>{let o=-1;const h=async(e,s,a=0)=>{o=a;const t=this._middlewareStack[a];t?await t(i,async(t,i)=>{r.signal.aborted?s():t?(s(),n(t,i)):await h(e,s,a+1)}):e()};await new Promise(await h).catch(t=>{})}}}class Navimi{constructor(t,i){const e=new __Navimi_Fetch,s=new __Navimi_Dom,a=new __Navimi_CSSs,r=new __Navimi_JSs,n=new __Navimi_Templates;var o=new __Navimi_Middleware;const h=new __Navimi_State,c=new __Navimi_Hot;var l=new __Navimi_Helpers,t=(e.init(i),a.init(s,e,l),s.init(a,r),r.init(s,e,n,h,l,i),n.init(e,l),h.init(l),new __Navimi_Core(t,i,{navimiFetch:e,navimiJs:r,navimiCss:a,navimiDom:s,navimiTemplates:n,navimiMiddleware:o,navimiState:h,navimiHot:c,navimiHelpers:l}));return t}}class __Navimi_State{constructor(){this.state={},this.stateWatchers={},this.prevState={},this.stateDiff={},this._navimiHelpers={},this.getStateDiff=t=>{t.sort((t,i)=>i.length-t.length).map(i=>{this.stateDiff[i]||this._navimiHelpers.stringify(this.getState(i,this.prevState)||"")!==this._navimiHelpers.stringify(this.getState(i,this.state)||"")&&(this.stateDiff[i]=!0,t.map(t=>{i!==t&&0===i.indexOf(t)&&(this.stateDiff[t]=!0)}))})},this.mergeState=(t,i)=>{i instanceof Error&&(i=Object.assign(Object.assign({},i),{message:i.message,stack:i.stack}));var e=t=>t&&"object"==typeof t&&!Array.isArray(t)&&null!==t;if(e(t)&&e(i))for(const s in i)e(i[s])?(t[s]||Object.assign(t,{[s]:{}}),this.mergeState(t[s],i[s])):Object.assign(t,{[s]:i[s]})},this.setState=t=>{var i=Object.keys(this.stateWatchers);0<i.length&&(this.prevState=this._navimiHelpers.cloneObject(this.state)),this.mergeState(this.state,t),0<i.length&&(this.getStateDiff(i),this.invokeStateWatchers())},this.getState=(t,i)=>{t=t?t.split(".").reduce((t,i)=>t&&t[i]||void 0,i||this.state):i||this.state;return t?Object.freeze(this._navimiHelpers.cloneObject(t)):void 0},this.watchState=(t,i,e)=>{i&&e&&(this.stateWatchers[i]||(this.stateWatchers[i]={}),this.stateWatchers[i]=Object.assign(Object.assign({},this.stateWatchers[i]),{[t]:[...this.stateWatchers[i][t]||[],e]}))},this.unwatchState=(i,t)=>{const e=t=>{this.stateWatchers[t][i]=void 0,delete this.stateWatchers[t][i],0===Object.keys(this.stateWatchers[t]).length&&delete this.stateWatchers[t]};if(t){const s=Array.isArray(t)?t:[t];void s.map(t=>{this.stateWatchers[t]||(this.stateWatchers[t]={}),e(t)})}else Object.keys(this.stateWatchers).map(e)}}init(t){this._navimiHelpers=t,this.invokeStateWatchers=t.debounce(()=>{const t=Object.keys(this.stateWatchers),i=Object.keys(this.stateDiff);this.stateDiff={},t.filter(t=>i.includes(t)).sort((t,i)=>i.length-t.length).map(e=>{Object.keys(this.stateWatchers[e]).map(t=>{const i=this.getState(e);this.stateWatchers[e][t]&&this.stateWatchers[e][t].map(t=>t&&t(i))})})},10)}}class __Navimi_Templates{constructor(){this._templatesCache={},this._loadedTemplates={},this._dependencyTemplatesMap={},this.loadTemplate=(t,i)=>{const e=new RegExp("<t ([^>]+)>"),s=new RegExp("</t>"),a=new RegExp('id="([^"]+)"');let r=t;if(e.exec(r))for(;t&&0<t.length;){var n=e.exec(r);if(!n||0===n.length)break;var o=a.exec(n[1]),o=0<o.length&&o[1],n=(r=r.substr(n.index+n[0].length),s.exec(r));if(!o||!n||0===n.length)break;this._templatesCache[o]=r.substr(0,n.index)}else this._templatesCache[i]=r},this.isTemplateLoaded=t=>void 0!==this._loadedTemplates[t],this.getTemplate=t=>{const i=Array.isArray(t)?t:[t];t=i.map(t=>this._templatesCache[t]);return 1<t.length?t:t[0]},this.fetchTemplate=(a,t,i)=>{var e=s=>new Promise(async(t,i)=>{if(!s||this._loadedTemplates[s])return t();try{var e=await this._navimiFetch.fetchFile(s,{headers:{Accept:"text/html"},signal:a?a.signal:void 0});this.loadTemplate(e,s),this._loadedTemplates[s]=!0,t()}catch(t){i(t)}});return i&&t.map(t=>{this._dependencyTemplatesMap[t]=Object.assign(Object.assign({},this._dependencyTemplatesMap[t]||{}),{[i]:!0})}),1<t.length?Promise.all(t.map(e)):e(t[0])},this.reloadTemplate=(t,i,e,s,a,r)=>{}}init(t,i){this._navimiFetch=t,this._navimiHelpers=i}}