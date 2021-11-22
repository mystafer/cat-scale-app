import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';

import Amplify, { Auth } from 'aws-amplify';

// routing
import Routes from 'routes';

// defaultTheme
import themes from 'themes';

// project imports
import Login from 'views/pages/authentication/Login';
import NavigationScroll from 'layout/NavigationScroll';
import { SET_USER } from 'store/actions';
import secrets from 'secret';

// ==============================|| APP ||============================== //

Amplify.configure(secrets.amplifyConfig);

const App = () => {
    const [checkingLogin, setCheckingLogin] = useState(true);
    const authentication = useSelector((state) => state.authentication);
    const dispatch = useDispatch();

    const customization = useSelector((state) => state.customization);

    // initialize to current user if already logged in
    useEffect(() => {
        Auth.currentAuthenticatedUser()
            .then((user) => {
                dispatch({ type: SET_USER, user });
                setCheckingLogin(false);
            })
            .catch(() => {
                setCheckingLogin(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                {checkingLogin && !authentication.isAuthenticated ? (
                    <LinearProgress color="primary" />
                ) : (
                    <NavigationScroll>{authentication.isAuthenticated ? <Routes /> : <Login />}</NavigationScroll>
                )}
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
