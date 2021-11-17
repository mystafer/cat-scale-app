// material-ui
import { Box, Grid, Typography } from '@mui/material';
import logo from 'assets/images/logo.jpg';

// ==============================|| LOGO SVG ||============================== //

const Logo = () => (
    <Grid container>
        <Grid item>
            <img src={logo} alt="Cat Scale" style={{ width: 'auto', height: '60px' }} />
        </Grid>
        <Grid item>
            <Box height="100%" display="flex" justifyContent="center" flexDirection="column" p={2}>
                <Typography component="span" variant="h3" sx={{ fontWeight: 500 }}>
                    Cat Scale
                </Typography>
            </Box>
        </Grid>
    </Grid>
);

export default Logo;
