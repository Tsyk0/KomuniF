/** 绑定页面级 WS 事件监听并返回清理函数。 */
export function bindWindowWebSocketListeners(input: {
  onNewMessage: (detail: any) => void;
  onMessageSent: (detail: any) => void;
  onError: (detail: any) => void;
}): () => void {
  const handleNewMessage = (event: Event) => {
    input.onNewMessage((event as CustomEvent).detail);
  };
  const handleMessageSent = (event: Event) => {
    input.onMessageSent((event as CustomEvent).detail);
  };
  const handleError = (event: Event) => {
    input.onError((event as CustomEvent).detail);
  };
  window.addEventListener("websocket:newMessage", handleNewMessage);
  window.addEventListener("websocket:messageSent", handleMessageSent);
  window.addEventListener("websocket:error", handleError);
  return () => {
    window.removeEventListener("websocket:newMessage", handleNewMessage);
    window.removeEventListener("websocket:messageSent", handleMessageSent);
    window.removeEventListener("websocket:error", handleError);
  };
}
