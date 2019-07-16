/* eslint-disable */

import { TypesafeRouteParameter, parameter } from "./parameter";

type ValuesOf<T extends unknown[]> = T[number]; // eslint-disable-line @typescript-eslint/no-explicit-any
type ParameterType = TypesafeRouteParameter<string, any>;
type RouteSegment = string | ParameterType;
type OnlyRouteParameters<T extends RouteSegment[]> = Exclude<(ValuesOf<T>), string>;
type ParametersObject<T extends RouteSegment[]> = {
    [key in OnlyRouteParameters<T>["name"]]: ReturnType<Extract<OnlyRouteParameters<T>, { name: key }>["parser"]>;
};

/** A utility route for handing serialization and de-serialization to and from routes matching it. */
interface TypesafeRoute<T extends {}>{
    /**
     * Creates a new route injecting values to the parmeters.
     *
     * @param parameters - key/value object of parameters to inject
     * @returns A string of the route filled in with parameter values.
     */
    create(parameters: T): string;

    /**
     * Parses an object of key/value strings into their
     * @param obj - key value pairs to parse
     * @returns A new object of key values pairs, where each value was de-serialized.
     */
    parse(obj: { [key: string]: string | undefined }, options?: { useDefaults?: boolean }): T;

    /**
     * Creates the raw path for this route, using parameter name in place.
     * @param formatter - An optional formatter to invoke on each parameter name. By default adds a colon in front.
     * e.g. `parameterName` -> `:parameterName`
     * @returns the route's path with parameter names in place.
     */
    path(formatter?: (parameterName: string) => string): string;

    /**
     * The default value(s) for parameters in this route.
     * This exists mostly as a way to check for key and types at runtime.
     */
    parameters: Readonly<T>;
}

/**
 * Creates a route from JUST strings, no parameters.
 *
 * @param segments - The string segments of the route.
 * @returns a route object to help you build paths for this route.
 */
export function route(...segments: string[]): TypesafeRoute<{}> & {
    create(parameters?: {}): string; // make parameters optional as they will always be empty on parameter-less routes
};

/**
 * Creates a route of static strings and parameters.
 *
 * @param segments - The segments of the route, a mix of static strings and parameters.
 * @returns a route object to help you build paths for this route.
 */
export function route<
    T extends RouteSegment[],
    P = ParametersObject<T>,
>(...segments: T): TypesafeRoute<P>;

/**
 * Creates a route of static strings and parameters.
 *
 * @param segments - The segments of the route, a mix of static strings and parameters.
 * @returns a route object to help you build paths for this route.
 */
export function route<
    T extends RouteSegment[],
    P = ParametersObject<T>,
>(...segments: T): TypesafeRoute<P> {
    const asString = (formatParameter: (p: ParameterType) => string) => segments
        .map((segment) => typeof segment === "string"
            ? segment
            : formatParameter(segment)
        )
        .join("");

    const asObject = (reducer: (parameter: ParameterType) => P[keyof P]) => segments.reduce((parameters, segment) => {
        if (typeof segment !== "string") { // it is a parameter segment, so get it's default value
            const key = segment.name as keyof P;
            parameters[key] = reducer(segment);
        }
        return parameters;
    }, {} as P);

    const defaultParameters = asObject((parameter) => parameter.parser(""));

    return {
        create(parameters: P) {
            return asString(p => encodeURIComponent(p.stringify(
                parameters[p.name as keyof P] as any,
            )));
        },

        parse(obj: { [key: string]: string | undefined }, options?: { useDefaults?: boolean }) {
            return asObject((parameter) => {
                const key = parameter.name as keyof P;
                const value = obj[parameter.name];
                if (typeof value === "undefined") {
                    if (options && options.useDefaults) {
                        return defaultParameters[key];
                    }
                    throw new Error(`cannot parse ${obj}, missing expected key ${key}`);
                }

                return parameter.parser(decodeURIComponent(value));
            });
        },

        path(formatter = (parameterName: string) => `:${parameterName}`) {
            return asString((p) => formatter(p.name));
        },

        parameters: defaultParameters,
    };
}