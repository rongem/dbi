declare module 'dotenv' {
    const dotenv: {
        config: (options?: { path?: string }) => any;
    };

    export default dotenv;
}