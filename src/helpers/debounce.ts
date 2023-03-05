export const debounce = <T extends unknown[]>(task: (...args: T) => unknown, wait: number): ((...args: T) => void) => {
    let timeout: ReturnType<typeof setTimeout>;

    return function(...args: T): void {
        const func = (): void => {
            timeout = null;
            task.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
};
