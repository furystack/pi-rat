/**
 *
 * @param env The Env object, process.env by default
 * @returns The Port number to use
 */
export const getPort = (env = process.env) => parseInt(env.PORT as string, 10) || 9090
