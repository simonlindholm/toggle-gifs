import defaultPrefs from "./defaultPrefs";

test("defaultPrefs", () => {
  expect(defaultPrefs).toMatchSnapshot();
});
