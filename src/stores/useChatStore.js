import { create } from "zustand";

export const chatStore = create(() => ({
  messagesByConv: new Map(), // Map<conversationId, Message[]>
  // 已经发起但尚未完成或得到最终确认的异步操作
  inflightByConv: new Map(), // Map<conversationId, { jobId, assistantId, controller, lastOffset }>
  assistantTextMapByConv: new Map(), // Map<conversationId, Map<assistantId, string>>
}));

// region 工具函数

export function getConvMsgs(convId) {
  const s = chatStore.getState();
  return s.messagesByConv.get(convId) || [];
}

export function setConvMsgs(convId, msgs) {
  const s = chatStore.getState();
  const map = new Map(s.messagesByConv);
  map.set(convId, msgs);
  chatStore.setState({ messagesByConv: map });
}

export function getAssistantText(convId, assistantId) {
  const s = chatStore.getState();
  const convMap = s.assistantTextMapByConv.get(convId);
  if (!convMap) return "";
  return convMap.get(assistantId) || "";
}
export function appendAssistantText(convId, assistantId, chunk) {
  const s = chatStore.getState();
  const map = new Map(s.assistantTextMapByConv);
  const convMap = new Map(map.get(convId) || new Map());
  const prev = convMap.get(assistantId) || "";
  convMap.set(assistantId, prev + chunk);
  map.set(convId, convMap);
  chatStore.setState({ assistantTextMapByConv: map });
}
export function setInflight(convId, inflight) {
  const s = chatStore.getState();
  const map = new Map(s.inflightByConv);
  map.set(convId, inflight);
  chatStore.setState({ inflightByConv: map });
}
export function getInflight(convId) {
  return chatStore.getState().inflightByConv.get(convId);
}
export function clearInflight(convId) {
  const s = chatStore.getState();
  const map = new Map(s.inflightByConv);
  map.delete(convId);
  chatStore.setState({ inflightByConv: map });
}

// endregion
