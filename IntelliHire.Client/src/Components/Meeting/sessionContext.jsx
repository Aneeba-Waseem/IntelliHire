// ThemeContext.js
import { createContext, useContext, useState } from 'react';

const sessionContext = createContext();

export function SessionProvider({ children }) {
  const [WebRtcSessionId, setWebRtcSessionId] = useState("TestSession123");

  return (
    <sessionContext.Provider value={{ WebRtcSessionId, setWebRtcSessionId }}>
      {children}
    </sessionContext.Provider>
  );
}

export function useSession() {
  return useContext(sessionContext);
}
