export const toggleValue = <T,>(
  value: T,
  setState: React.Dispatch<React.SetStateAction<T[]>>
) => {
  setState(prev =>
    prev.includes(value)
      ? prev.filter(v => v !== value)
      : [...prev, value]
  );
};
