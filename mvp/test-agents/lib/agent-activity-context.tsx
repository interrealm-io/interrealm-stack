"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AgentActivityContextType {
  activeAgents: Set<string>;
  highlightAgent: (memberId: string) => void;
}

const AgentActivityContext = createContext<AgentActivityContextType | undefined>(undefined);

export function AgentActivityProvider({ children }: { children: ReactNode }) {
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());

  const highlightAgent = useCallback((memberId: string) => {
    setActiveAgents((prev) => new Set(prev).add(memberId));

    // Remove highlight after 2 seconds
    setTimeout(() => {
      setActiveAgents((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }, 2000);
  }, []);

  return (
    <AgentActivityContext.Provider value={{ activeAgents, highlightAgent }}>
      {children}
    </AgentActivityContext.Provider>
  );
}

export function useAgentActivity() {
  const context = useContext(AgentActivityContext);
  if (!context) {
    throw new Error("useAgentActivity must be used within AgentActivityProvider");
  }
  return context;
}
