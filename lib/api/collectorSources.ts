export const COLLECTOR_SOURCES = ["bokjiro", "youthcenter", "linkareer", "allcon", "campuspick", "data_go_kr", "saramin", "jobkorea", "linkareer_activity", "campuspick_activity", "allforyoung"] as const;

export type CollectorSource = (typeof COLLECTOR_SOURCES)[number];

export const COLLECTOR_SOURCE_LABELS: Record<CollectorSource, string> = {
  bokjiro: "복지로",
  youthcenter: "온통청년",
  linkareer: "링커리어",
  linkareer_activity: "링커리어",
  allcon: "올콘",
  campuspick: "캠퍼스픽",
  campuspick_activity: "캠퍼스픽",
  data_go_kr: "공공데이터포털",
  saramin: "사람인",
  jobkorea: "잡코리아",
  allforyoung: "요즘것들",
};

export function getCollectorSourceLabel(source: string): string {
  return Object.hasOwn(COLLECTOR_SOURCE_LABELS, source)
    ? COLLECTOR_SOURCE_LABELS[source as CollectorSource]
    : source;
}
