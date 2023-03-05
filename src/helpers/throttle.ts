export const throttle = <T extends unknown[]>(task: (...args: T) => void, wait: number, context: unknown): ((...args: T) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    let lastTime: number;
  
    return function(...args: T): void {
      const now = Date.now();
  
      if (lastTime && now < lastTime + wait) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          lastTime = now;
          task.apply(context, args);
        }, wait - (now - lastTime));
      } else {
        lastTime = now;
        task.apply(context, args);
      }
    };
  };
  