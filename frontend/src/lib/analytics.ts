import ReactGA from "react-ga4";

const TRACKING_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || "";

export const initGA = () => {
    if (TRACKING_ID) {
        ReactGA.initialize(TRACKING_ID);
        console.log("GA4 Initialized with ID:", TRACKING_ID);
    }
};

export const logPageView = (path: string) => {
    ReactGA.send({ hitType: "pageview", page: path });
};

export const logEvent = (category: string, action: string, label?: string, params?: any) => {
    ReactGA.event({
        category,
        action,
        label,
        ...params
    });
};

export default {
    initGA,
    logPageView,
    logEvent
};
