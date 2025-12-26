export const setNavimiLinks = (): void => {
    document.querySelectorAll('[navimi-link]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            // @ts-ignore
            const link = e.target.closest('[navimi-link]');
            link && (window as any).navigateTo(link.pathname);
        });
    });
};
