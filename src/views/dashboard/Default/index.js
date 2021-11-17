import { useEffect, useState } from 'react';

// material-ui
import { Grid } from '@mui/material';

// 3rd party imports
import axios from 'axios';

// project imports
import CatCard from './CatCard';
import TotalGrowthBarChart from './TotalGrowthBarChart';
import { gridSpacing } from 'store/constant';

// ==============================|| DEFAULT DASHBOARD ||============================== //

const Dashboard = () => {
    const [isLoadingCats, setLoadingCats] = useState(true);
    const [cats, setCats] = useState([{}]);

    useEffect(() => {
        // load cat data for display in cat cards
        axios
            .get('https://eyp1q43kk8.execute-api.us-east-1.amazonaws.com/Prod/cats')
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
                        <TotalGrowthBarChart isLoading={false} />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
