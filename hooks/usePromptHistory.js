"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gerador-prompts:history";
const MAX_ITEMS = 10;

function readFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage indisponível (ex.: modo privado) — falha em silêncio
  }
}

/**
 * Guarda os últimos 10 prompts gerados no localStorage do browser.
 * O histórico é local a cada dispositivo/navegador (não é partilhado com o servidor).
 */
export function usePromptHistory() {
  const [history, setHistory] = useState([]);

  // Carrega o histórico já guardado assim que o componente monta no browser.
  useEffect(() => {
    setHistory(readFromStorage());
  }, []);

  const addEntry = useCallback((entry) => {
    setHistory((prev) => {
      const next = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          ...entry,
        },
        ...prev,
      ].slice(0, MAX_ITEMS);
      writeToStorage(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeToStorage(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeToStorage([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
