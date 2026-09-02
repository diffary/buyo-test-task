import { apiConnector } from "./apiconnector.ts";
import {setInitialized, setLoading, setUser} from "../slices/authSlice.ts";
import { endpoints } from "./apis.ts";
import type { AppDispatch } from "../store/store.ts";

const {
  LOGIN_API,
  USER_API,
  LOGOUT_API
} = endpoints


export function checkUser() {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("GET", USER_API);
      if (response.data.success) {
        dispatch(setUser(response.data.user));
      } else {
        dispatch(setUser(null));
      }
    } catch {
      dispatch(setUser(null));
    } finally {
      dispatch(setLoading(false));
      dispatch(setInitialized(true));
    }
  };
}

export function loginUser(login: string, password: string) {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", LOGIN_API, {
        login,
        password,
      });

      if (response.data.success) {
        dispatch(setUser(response.data.user));
      }

      return response.data.success
    } catch {
      return false
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function logoutUser() {
  return async (dispatch: AppDispatch) => {
    try {
      await apiConnector("POST", LOGOUT_API)

    } catch {
      return
    }

    dispatch(setUser(null))
  }
}
