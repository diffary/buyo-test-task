import {useEffect} from "react";

export default function usePersistToLocalStorage<T>(key: string, value: T) {
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
}
