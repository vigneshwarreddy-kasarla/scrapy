import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type UseWebSocketProps = {
  topic: string;
  onMessage: (message: any) => void;
};

export function useWebSocket({ topic, onMessage }: UseWebSocketProps) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      // We use webSocketFactory because SockJS handles fallback scenarios
      webSocketFactory: () => new SockJS(
        import.meta.env.MODE === "production" ? "/ws" : "http://localhost:8080/ws"
      ),
      debug: (str) => console.log("[STOMP]", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log(`[STOMP] Connected. Subscribing to ${topic}`);
      client.subscribe(topic, (message) => {
        if (message.body) {
          try {
            const body = JSON.parse(message.body);
            onMessage(body);
          } catch (e) {
            onMessage(message.body);
          }
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("[STOMP] Error:", frame.headers["message"], frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [topic, onMessage]);
}
