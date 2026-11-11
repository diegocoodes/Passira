// @ts-check
import { module } from "@prisma/composer";
import passiraSanMartinService from "./service.mjs";

export default module("passira", ({ provision }) => {
  provision(passiraSanMartinService, { id: "passirasanmartin" });
});
