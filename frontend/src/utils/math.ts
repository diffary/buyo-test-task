export const round = (val: number) => Math.round(val * 100) / 100;

export const safeAvg = (sum: number, count: number) => count > 0 ? round(sum / count) : 0;

export const safePercentage = (count: number, all_count: number) => count > 0 ? round(count * 100 / all_count) : 0;

export const renderThreeFixed = (first?: any, second?: any, third?: any, suffix = "") => `${first.toFixed(2)}${second ? `/${second.toFixed(2)}` : ""}${third ? `/${third.toFixed(2)}` : ""}${suffix}`;
export const renderCRThreeFixed = (first?: any, first_cond?: any, second?: any,  third?: any, suffix = "") => `${first_cond ? first.toFixed(2) : "—"}${second ? `/${second.toFixed(2)}` : ""}${third ? `/${third.toFixed(2)}` : ""}${first_cond || second || third ? suffix : ""}`;
export const renderThree = (first?: any, second?: any, third?: any, suffix = "") => `${first}${second ? `/${second}` : ""}${third ? `/${third}` : ""}${suffix}`;
