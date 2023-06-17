import { EnvironmentController } from "../controllers/environment.controller";
import { locales } from "./locales.templates";

export const getLocale = () => {
    let name = EnvironmentController.instance.locale;
    return locales[name] ?? locales['en'];
}
