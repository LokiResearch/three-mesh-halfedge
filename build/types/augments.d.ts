declare global {
    interface Array<T> {
        clear(): Array<T>;
        remove(t: T): boolean;
    }
}
export {};
//# sourceMappingURL=augments.d.ts.map