import { useSyncExternalStore } from "react";

const FAV_KEY = "tbr-favorites";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(favs: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch {
    /* ignore */
  }
}

let _favorites: string[] = read();
const listeners = new Set<() => void>();

function notify() {
  write(_favorites);
  listeners.forEach((l) => l());
}

export function getFavorites() {
  return _favorites;
}

export function isFavorite(id: string) {
  return _favorites.includes(id);
}

export function toggleFavorite(id: string) {
  _favorites = _favorites.includes(id)
    ? _favorites.filter((f) => f !== id)
    : [..._favorites, id];
  notify();
}

export function subscribeFavorites(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFavorites() {
  return useSyncExternalStore(subscribeFavorites, getFavorites);
}