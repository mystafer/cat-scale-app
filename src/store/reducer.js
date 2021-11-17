import { combineReducers } from 'redux';

// reducer import
import authenticationReducer from './authenticationReducer';
import customizationReducer from './customizationReducer';

// ==============================|| COMBINE REDUCER ||============================== //

const reducer = combineReducers({
    authentication: authenticationReducer,
    customization: customizationReducer
});

export default reducer;
