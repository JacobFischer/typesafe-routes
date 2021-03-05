/* NOTE: this part is VERY experimental */
import * as React from 'react';
import {
  LinkProps,
  Link,
  NavLink,
  NavLinkProps,
  Redirect,
  RedirectProps,
  Route as ReactRouterRoute,
  /*
  RouteChildrenProps,
  RouteComponentProps,
  match,
  */
  RouteProps,
  useParams,
} from 'react-router-dom';
import type { BaseParameter } from './parameter';
import { route, Route } from './route';

// these are copy and pasted so they are not exported in the final bundle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParameterType = BaseParameter<string, any, boolean>;
type RouteSegment = string | ParameterType;

type RouteFormatOptions<T extends RouteSegment[]> = NonNullable<
  Parameters<Route<T>['format']>[1]
>;

type RouteParseOptions<T extends RouteSegment[]> = NonNullable<
  Parameters<Route<T>['parse']>[1]
>;

type FilterString<T extends unknown[]> = T extends []
  ? []
  : T extends [infer H, ...infer R]
  ? H extends string
    ? FilterString<R>
    : [H, ...FilterString<R>]
  : T;

type RouteParameters<T extends RouteSegment[]> = Route<T>['defaults'];
type ParametersProps<
  T extends RouteSegment[]
> = FilterString<T> extends never[]
  ? {
      parameters?: RouteParameters<T>;
    }
  : {
      parameters: RouteParameters<T>;
    };

type RouteFormatProps<T extends RouteSegment[]> = ParametersProps<T> &
  RouteFormatOptions<T>;

/*
type MatchOverrides<T extends RouteSegment[]> = {
  match: Omit<match<Record<string, never>>, 'params'> & {
    params: RouteParameters<T>;
  };
};

type RouteComponentPropsOverrides<
  T extends RouteSegment[]
> = RouteComponentProps<Record<string, never>> & MatchOverrides<T>;

type RouteChildrenPropsOverrides<
  T extends RouteSegment[]
> = RouteChildrenProps<Record<string, never>> & MatchOverrides<T>;

type RoutePropsOverrides<T extends RouteSegment[]> = {
  component?: React.ComponentType<RouteComponentPropsOverrides<T>>;
  render?: (props: RouteComponentPropsOverrides<T>) => React.ReactNode;
  children?:
    | ((props: RouteChildrenPropsOverrides<T>) => React.ReactNode)
    | React.ReactNode;
};
*/

export interface ReactRoute<T extends RouteSegment[] = RouteSegment[]>
  extends Route<T> {
  readonly Link: React.ComponentType<
    Omit<LinkProps, 'to'> & RouteFormatProps<T>
  >;

  readonly NavLink: React.ComponentType<
    Omit<NavLinkProps, 'to'> & RouteFormatProps<T>
  >;

  readonly RedirectFromPath: React.ComponentType<Omit<RedirectProps, 'from'>>;
  readonly RedirectToPath: React.ComponentType<Omit<RedirectProps, 'to'>>;

  readonly RedirectFrom: React.ComponentType<
    Omit<RedirectProps, 'from'> & RouteFormatProps<T>
  >;
  readonly RedirectTo: React.ComponentType<
    Omit<RedirectProps, 'to'> & RouteFormatProps<T>
  >;

  /*
  readonly Route: React.ComponentType<
    Omit<RouteProps, 'path'> & RoutePropsOverrides<T>
  >;
  */
  readonly Route: React.ComponentType<Omit<RouteProps, 'path'>>;

  readonly RouteFormatted: React.ComponentType<
    Omit<RouteProps, 'path'> & RouteFormatProps<T>
  >;

  readonly useParams: (options?: RouteParseOptions<T>) => RouteParameters<T>;

  /**
   * Creates a **new** ReactRoute by extending new string(s) and parameter(s)
   * onto the end of this route.
   *
   * @param segments - The new segments to concat to the end of this route.
   * @returns A new ReactRoute that is this current route, with new segments on
   * the end. This route is not mutated.
   */
  readonly extend: <TSegments2 extends RouteSegment[]>(
    ...segments: TSegments2
  ) => ReactRoute<[...T, ...TSegments2]>;
}

/**.
 * Creates a route of static strings and parameters.
 * This includes additional react-router functionality.
 *
 * @param segments - The segments of the route, a mix of static strings and
 * parameters.
 * @returns A reactRoute object to help you build paths for this route.
 */
export function reactRoute<T extends RouteSegment[]>(
  ...segments: T
): ReactRoute<T> {
  const baseRoute = route(...segments);
  return {
    ...baseRoute,
    Link: ({
      parameters = {} as RouteParameters<T>,
      joiner,
      encoder,
      ...props
    }) => (
      <Link
        to={baseRoute.format(parameters, { encoder, joiner })}
        {...props}
      />
    ),

    NavLink: ({
      parameters = {} as RouteParameters<T>,
      joiner,
      encoder,
      ...props
    }) => (
      <NavLink
        to={baseRoute.format(parameters, { encoder, joiner })}
        {...props}
      />
    ),

    RedirectFromPath: (props) => (
      <Redirect from={baseRoute.path()} {...props} />
    ),

    RedirectToPath: (props) => <Redirect to={baseRoute.path()} {...props} />,

    RedirectFrom: ({
      parameters = {} as RouteParameters<T>,
      joiner,
      encoder,
      ...props
    }) => (
      <Redirect
        from={baseRoute.format(parameters, { encoder, joiner })}
        {...props}
      />
    ),

    RedirectTo: ({
      parameters = {} as RouteParameters<T>,
      joiner,
      encoder,
      ...props
    }) => (
      <Redirect
        to={baseRoute.format(parameters, { encoder, joiner })}
        {...props}
      />
    ),

    /*
    Route: ({ component, render, children, ...props }) => {
      const renderWrapped =
        render && ((...args: Parameters<typeof render>) => render(...args));
      const componentWrapped =
        component &&
        ((...args: Parameters<typeof component>) => component(...args));

      return <ReactRouterRoute path={baseRoute.path()} {...props} />;
    },
    */

    Route: (props) => <ReactRouterRoute path={baseRoute.path()} {...props} />,

    RouteFormatted: ({
      parameters = {} as RouteParameters<T>,
      joiner,
      encoder,
      ...props
    }) => (
      <ReactRouterRoute
        path={baseRoute.format(parameters, { encoder, joiner })}
        {...(props as RouteProps)}
      />
    ),

    useParams: (options) => baseRoute.parse(useParams(), options),

    extend(...newSegments) {
      return reactRoute(...segments, ...newSegments);
    },
  };
}

export * from './parameter'; // re-export