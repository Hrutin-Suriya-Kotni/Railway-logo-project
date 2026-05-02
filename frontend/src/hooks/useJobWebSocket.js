import { useEffect, useRef, useState } from "react";

const RECONNECT_DELAY_MS = 2000;

function useJobWebSocket({ jobId, wsBaseUrl, shouldReconnect, onMessage, onError }) {
  const [connectionState, setConnectionState] = useState("idle");
  const reconnectRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectFlag = useRef(shouldReconnect);

  useEffect(() => {
    reconnectFlag.current = shouldReconnect;
  }, [shouldReconnect]);

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let isActive = true;

    const connect = () => {
      if (!isActive) {
        return;
      }
      setConnectionState("connecting");

      const socket = new WebSocket(`${wsBaseUrl}/ws/${jobId}`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isActive) {
          return;
        }
        setConnectionState("connected");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          onMessage?.(payload);
        } catch (error) {
          onError?.("Failed to parse server update.");
        }
      };

      socket.onerror = () => {
        onError?.("WebSocket error.");
        socket.close();
      };

      socket.onclose = () => {
        if (!isActive) {
          return;
        }
        if (reconnectFlag.current) {
          setConnectionState("reconnecting");
          reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        } else {
          setConnectionState("closed");
        }
      };
    };

    connect();

    return () => {
      isActive = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [jobId, wsBaseUrl, onMessage, onError]);

  return connectionState;
}

export default useJobWebSocket;
