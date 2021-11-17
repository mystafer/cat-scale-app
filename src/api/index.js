import axios from 'axios';

import { store } from 'store';

axios.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state.authentication.user && state.authentication.user.signInUserSession.idToken.jwtToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        Promise.reject(error);
    }
);
