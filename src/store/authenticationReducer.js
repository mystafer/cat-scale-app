// action - state management
import * as actionTypes from './actions';

export const initialState = {
    isAuthenticated: false,
    user: null
};

// ==============================|| AUTHENTICATION REDUCER ||============================== //

const authenticationReducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.SET_USER:
            return {
                ...state,
                isAuthenticated: !!action.user,
                user: action.user
            };
        default:
            return state;
    }
};

export default authenticationReducer;
