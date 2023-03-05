export const setNavimiLinks = (): void => {
    document.querySelectorAll('[navimi-link]').forEach(el => {
        el.removeAttribute('navimi-link');
        el.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            (window as any).navigateTo((event.target as HTMLAnchorElement).pathname);
        });
    });
};
