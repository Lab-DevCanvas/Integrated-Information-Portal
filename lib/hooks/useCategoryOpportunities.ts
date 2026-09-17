import { useEffect, useState } from "react";
import { fetchCategoryOpportunities } from "../api/fetchCategoryOpportunities";
import type { Opportunity } from "../types";
import { useAppStore } from "../store/useAppStore";

interface CategoryState {
  key: string;
  items: Opportunity[];
  total: number;
  loadingMore: boolean;
  error: string;
  backgroundError: string;
}

export function useCategoryOpportunities(source: string, periodStatus: string) {
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([source, periodStatus, retry]);
  const [state, setState] = useState<CategoryState>({ key: "", items: [], total: 0, loadingMore: false, error: "", backgroundError: "" });
  useEffect(() => {
    const controller = new AbortController();
    let receivedFirstPage = false;
    fetchCategoryOpportunities({ source, periodStatus }, controller.signal, ({ items, total, complete }) => {
      if (controller.signal.aborted) return;
      receivedFirstPage = true;
      setState({ key, items, total, loadingMore: !complete, error: "", backgroundError: "" });
      useAppStore.setState((state) => ({ crawledOpportunities: [...new Map([...state.crawledOpportunities, ...items].map((item) => [item.id, item])).values()] }));
    }).catch(() => {
      if (controller.signal.aborted) return;
      if (receivedFirstPage) {
        setState((current) => current.key === key ? {
          ...current, loadingMore: false,
          backgroundError: "나머지 공고를 불러오지 못했습니다. 지금까지 불러온 결과를 표시합니다.",
        } : current);
      } else {
        setState({ key, items: [], total: 0, loadingMore: false, backgroundError: "", error: "공고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." });
      }
    });
    return () => controller.abort();
  }, [source, periodStatus, key]);
  const current = state.key === key;
  return {
    items: current ? state.items : [],
    total: current ? state.total : 0,
    loading: !current,
    loadingMore: current && state.loadingMore,
    error: current ? state.error : "",
    backgroundError: current ? state.backgroundError : "",
    retry: () => setRetry((value) => value + 1),
  };
}
