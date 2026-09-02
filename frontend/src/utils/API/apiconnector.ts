import axios from "axios"

export const axiosInstance = axios.create({});

export type ApiParamValue = string | number | boolean | undefined | string[] | number[];

export const apiConnector = (method: string, url: string, bodyData?: Record<string, string | number | File | number[] | string[] | Record<string, number>>, headers?: Record<string, string>, params?: Record<string, ApiParamValue>, responseType?: "blob" | "json" | "text", signal?: AbortSignal) => {
    return axiosInstance({
        method:`${method}`,
        url:`${url}`,
        data: bodyData ?? null,
        headers: headers ?? undefined,
        params: params ?? undefined,
        paramsSerializer: { indexes: null },
        withCredentials: true,
        responseType: responseType ?? "json",
        signal,
    });
}
