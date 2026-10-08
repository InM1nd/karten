import { createContext, useContext } from "react";
import { Word } from "../data/types";
import { WORDS } from "../data/words";

export interface Deck {
  words: Word[];
  byId: Record<string, Word>;
}

export function makeDeck(custom: Word[]): Deck {
  const words = [...WORDS, ...custom];
  return { words, byId: Object.fromEntries(words.map((w) => [w.id, w])) };
}

export const DeckContext = createContext<Deck>(makeDeck([]));
export const useDeck = () => useContext(DeckContext);
