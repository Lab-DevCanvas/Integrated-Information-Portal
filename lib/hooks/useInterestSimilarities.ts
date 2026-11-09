import { useEffect, useMemo, useState } from "react";
import { selectedInterests } from "../scoring/contestFit";
import type { Opportunity, UserProfile } from "../types";

type Scores = Record<string, Record<string, number>>;
const cache = new Map<string, {expires: number; request: Promise<Scores>}>();

function load(interests: string[], ids: string[]): Promise<Scores> {
  const key = JSON.stringify([interests, ids]);
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.request;
  const request = fetch("/api/ai/interest-similarities", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({interests, ids}), signal: AbortSignal.timeout(35000),
  }).then(async response => {
    if (!response.ok) throw new Error("similarity unavailable");
    const body = await response.json();
    const result: Scores = {};
    for (const id of ids) {
      for (const interest of interests) {
        const value = body.similarities?.[id]?.[interest];
        if (typeof value === "number" && Number.isFinite(value) && value >= -1 && value <= 1) {
          (result[id] ??= {})[interest] = value;
        }
      }
    }
    return result;
  }).catch(error => {
    cache.delete(key);
    throw error;
  });
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, {expires: Date.now() + 60000, request});
  return request;
}

export function useInterestSimilarities(items: Opportunity[], profile: UserProfile | null) {
  const interestsKey = JSON.stringify(selectedInterests(profile).sort());
  const idsKey = JSON.stringify(items.filter(x => x.dataOrigin === "crawling" && /^[a-f0-9]{24}$/.test(x.id)).map(x => x.id).sort());
  const key = interestsKey + idsKey;
  const [state, setState] = useState<{key: string; scores: Scores}>({key: "", scores: {}});
  useEffect(() => {
    const interests: string[] = JSON.parse(interestsKey);
    const ids: string[] = JSON.parse(idsKey);
    if (!interests.length || !ids.length) return;
    let active = true;
    void (async () => {
      let scores: Scores = {};
      for (let offset = 0; offset < ids.length && active; offset += 100) {
        try {
          scores = {...scores, ...await load(interests, ids.slice(offset, offset + 100))};
          if (active) setState({key, scores});
        } catch { break; }
      }
    })();
    return () => { active = false; };
  }, [interestsKey, idsKey, key]);
  return useMemo(() => items.map(item => ({
    ...item, interestSimilarities: state.key === key ? state.scores[item.id] : undefined,
  })), [items, state, key]);
}
