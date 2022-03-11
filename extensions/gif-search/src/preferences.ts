import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import differenceInDays from "date-fns/differenceInDays";

import { getPreferenceValues, environment } from "@raycast/api";

export const API_KEY = "apiKey";
export const SHOW_PREVIEW = "showGifPreview";
export const DEFAULT_ACTION = "defaultAction";

export const CONFIG_URL = "https://cdn2.joe.sh/gif-search/config.json";

export type ServiceName = "giphy" | "tenor";
export const GIF_SERVICE: { [name: string]: ServiceName } = {
  GIPHY: "giphy",
  TENOR: "tenor",
};

export type Preference = { [preferenceName: string]: any };

let prefs: Preference;

export function getPrefs() {
  if (!prefs) {
    prefs = getPreferenceValues<Preference>();
  }

  return prefs;
}

export function getAPIKey(serviceName: ServiceName) {
  return getPrefs()[`${serviceName}-${API_KEY}`];
}

export function getShowPreview() {
  return getPrefs()[SHOW_PREVIEW];
}

export function getDefaultAction() {
  return getPrefs()[DEFAULT_ACTION];
}

export type Config = {
  apiKeys: {
    [service in ServiceName]: string;
  };
};

const configPath = path.resolve(environment.supportPath, "config.json");
export async function fetchConfig() {
  let config: Config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Config;

    const { mtime } = fs.statSync(configPath);
    const diff = differenceInDays(new Date(), new Date(mtime));
    if (diff > 7) {
      // Re-download config if over a week old
      throw new Error(`Config out of date, ${diff} days old`);
    }
  } catch (e) {
    const response = await fetch(CONFIG_URL);
    config = (await response.json()) as Config;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  }

  return config;
}
