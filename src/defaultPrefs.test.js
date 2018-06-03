import defaultPrefs from "./defaultPrefs";

test("defaultPrefs should match snaptshot", () => {
    expect(defaultPrefs).toMatchSnapshot();
});
