import { useEffect, useState } from 'react';

// material-ui
import { Grid } from '@mui/material';

// 3rd party imports
import axios from 'axios';

// project imports
import CatCard from './CatCard';
import TotalVisitsChart from './TotalVisitsChart';
import { gridSpacing } from 'store/constant';
import config from 'config';

// ==============================|| DEFAULT DASHBOARD ||============================== //

const Dashboard = () => {
    const [isLoadingCats, setLoadingCats] = useState(true);
    const [cats, setCats] = useState([{}, {}]);

    useEffect(() => {
        // load cat data for display in cat cards
        axios
            .get(`${config.apiBaseUrl}/cats`)
            .then((response) => {
                setCats(response.data.cats);
                setLoadingCats(false);
            })
            .catch((error) => {
                console.log(error);
            });
    }, []);

    return (
        <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    {cats.map((cat, idx) => (
                        <Grid item lg={6} md={6} sm={6} xs={12} key={idx}>
                            <CatCard isLoading={isLoadingCats} catIndex={idx} cat={cat} />
                        </Grid>
                    ))}
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={12}>
                        <TotalVisitsChart isLoading={isLoadingCats} cats={cats} />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
