import { route, parameter } from "../src";

describe("route", () => {
    it("exists", () => {
        expect(route).toBeTruthy();
    });

    it("is a function", () => {
        expect(typeof route).toBe("function");
    });

    it("route has the correct shape", () => {
        const test = route("test");

        expect(typeof test).toBe("object");
        expect(typeof test.create).toBe("function");
        expect(typeof test.parse).toBe("function");
        expect(typeof test.parameters).toBe("object");
        expect(typeof test.path).toBe("function");
        expect(Object.keys(test)).toHaveLength(4);
    });

    it("works with parameters", () => {
        const routeWithParameters = route(
            "first/", parameter("someNumber", Number), "/third/parameter/", parameter("aString"),
        );
        expect(routeWithParameters).toBeTruthy();

        const parameterNames = Object.keys(routeWithParameters.parameters).sort();
        const expectedParameterNames = ["someNumber", "aString"].sort();
        expect(parameterNames).toMatchObject(expectedParameterNames);

        const expectedPath = "first/:someNumber/third/parameter/:aString";
        expect(routeWithParameters.path()).toBe(expectedPath);

        const expectedWithParameters = "first/1337/third/parameter/hello%20there";
        expect(routeWithParameters.create({
            aString: "hello there",
            someNumber: 1337,
        })).toBe(expectedWithParameters);
    });

    it("works with just strings", () => {
        const strings = ["this/only/has", "/strings", "/in/it"] as const;
        const fullRoute = strings.join("");
        const routeOnlyStrings = route(...strings);
        expect(routeOnlyStrings).toBeTruthy();

        expect(Object.keys(routeOnlyStrings.parameters)).toHaveLength(0);
        expect(routeOnlyStrings.path()).toBe(fullRoute);
        expect(routeOnlyStrings.path((s) => `---${s.toUpperCase()}---`)).toBe(fullRoute);
        expect(routeOnlyStrings.create()).toBe(fullRoute);
        expect(routeOnlyStrings.create({})).toBe(fullRoute);
    });

    it("works with a custom replacer", () => {
        const custom = route("test", parameter("one"), parameter("two"));

        expect(custom.path((s) => `>$-${s}-$<`)).toBe("test>$-one-$<>$-two-$<");
    });

    it("parses objects", () => {
        const test = route("test", parameter("one", Number), parameter("two", Boolean));

        const stringified = {
            one: "1337",
            two: "true",
        };

        expect(test.parse(stringified)).toMatchObject({
            one: 1337,
            two: true,
        });
    });

    it("parses a partial object using default values", () => {
        const test = route("test", parameter("three"), "hello", parameter("four", Boolean));

        const stringified = {
            three: "some%20string",
            // NOTE: four is missing on purpose for this test
        };

        expect(Object.prototype.hasOwnProperty.call(stringified, "four")).toBe(false);

        expect(test.parse(stringified, { useDefaults: true })).toMatchObject({
            three: "some string",
            four: false,
        });
    });

    it("parses with other permutations of defaults", () => {
        const test = route("test", parameter("five"));

        const stringified = {
            five: "hio",
            // NOTE: four is missing on purpose for this test
        };

        const expected = stringified;

        expect(test.parse(stringified, {})).toMatchObject(expected);
        expect(test.parse(stringified, { useDefaults: false })).toMatchObject(expected);
    });

    it("throws on invalid objects to parse", () => {
        const test = route("test", parameter("six"));

        expect(() => test.parse({})).toThrow();
    });
});