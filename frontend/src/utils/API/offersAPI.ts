import { apiConnector } from "./apiconnector.ts";
import { endpoints } from "./apis.ts";

const {
  GET_OFFERS_TRAFFIC_API,
  GET_OFFERS_TRAFFIC_OFFER_API,
} = endpoints


export function getOffersTraffic(data: {since: string, until: string, with_lifetime: boolean, with_month: boolean}) {
  return async () => {
    try {
      const response = await apiConnector("GET", GET_OFFERS_TRAFFIC_API, {}, {}, data);

      return response.data
    } catch {
      return {}
    }
  };
}


export function getOffersTrafficOffer(data: {since: string, until: string, group_by: string[]} & Record<string, string | string[]>) {
  return async () => {
    try {
      const response = await apiConnector("GET", GET_OFFERS_TRAFFIC_OFFER_API, {}, {}, data);

      return response.data
    } catch {
      return {}
    }
  };
}
