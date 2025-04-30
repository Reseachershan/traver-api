// server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 5000;
const BEARER_TOKEN = 
// 'eyJpc3MiOiJodHRwczpcL1wvYWNjb3VudHMuc25hcGNoYXQuY29tXC9hY2NvdW50c1wvb2F1dGgyXC90b2tlbiIsInR5cCI6IkpXVCIsImVuYyI6IkExMjhDQkMtSFMyNTYiLCJhbGciOiJkaXIiLCJraWQiOiJhY2Nlc3MtdG9rZW4tYTEyOGNiYy1oczI1Ni4wIn0..PPouF6HY4JUzwami3xVlEw.vb1hHfwURvbFiSb8oyKoRt6lh0SYR8pj5luDBj_QTCsLXkyfLfjWYUn11La0DfTACxkX6-03CBCJvfcbD4p2IGZNS1FG7dYOA3SombbhjT5REZY5wf5dmn8YkbYm0pY5nv-1MDUheponNpVhh_2dCf3R97ci_169UhUZjzRUN5QyEjW-favne_n82Ymaeq2_L8E-hOdG7depmdoCSPF5ZYEqBgDvsLL5DV7hnoUUsKtmA92PoNincSYlwT1vTgy2OFQ3b84MkvXqRGLS9ZV3flhNPg7qHJMBRqZ02hHHRrpFhRKwpdZBYRXST_dG4DMQldKjQuc1gbb1BhkcwcR37AWy-vSQ5tCXpb70stayJ1x7qcqW7ad9GyZt02BNMe2OX5NApjXrfLaOcZQuQXfqBxStBABm43ZyQ4CeJw7yEU16EHx7cXtfhcN9oN2fu3Cb4mzK9GOU6YxfIFbUKnBb7sSGvMLq_ydjTtB9t-ySIluvbLvVJFj8AAjbY5w3kkO2vuSPgSLanYSn_Hrrgc3kNZQNk1vcHPcamMho3Zl3oZzCNTtvA2eQ0CHxQ3T-SjLmz7XyNg5k7V2AFdG0Q2heOJvgOby9j78kPSYl87an8lf31ARSOQcJFy07joWvKP1GFsHSu3t_uN_FcSIROafB3L2gfmXqt91nj3iApG8_ZEhtO_9JExvKhvo6RQ9GSv387IRRdzGowBwgOI7ta0FIh0zFPUSzNNP60puyr1wf6MO7iMi-nK1yOLp-iyUT44YdFp0YFDo8pZUn2nxFDjhER6ANXUoKbS-9Yl4X7LojKvk.u5AgMH_9NhL0K0aNhFjstQ'
"hCgwKCjE3NDE2Mjk2MjASyQE99_S0RdAYi8XLB6KDlltlu-XP36R-NhU-f0jOgCancUorEvCwb9Cnssl9agCv1XDQmE3_HJgL_tq4iqnf0bEMcCDgJLeM0AKGyB260KLxuEstg4LDn4LOR1W836nUQCa01tVSVrzosbJup7NBvxVOi5LKGTApUKmjtwNUWksH40nE8n4ZIuMRZgtFTFvadOhUUSS8SfIcDcQtzqxmyprHOogCMqkNYavh4s5taPUEF5OqdsO27zooB55m8MnDDyeT6oWJeOuj714"

app.use(cors());
app.use(express.json());

app.get('/fetch-metrics', async (req, res) => {
  const { startDate, endDate, code } = req.query;
  console.log("code", code);
  
  const SHOWS = {
    "backtolife899": {"portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.10, "business_split": {"kaleb": 0.40, "blake": 0.60}},
    "asmrtv2022": {"portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.00, "business_split": {"kaleb": 0.40, "blake": 0.60}},
    "asmrlive22": {"portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.00, "business_split": {"kaleb": 0.40, "blake": 0.60}},
    "petstown": { "portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.10, "business_split": { "kaleb": 0.40, "blake": 0.60 } },
  };

  const fetchMetricsForShow = async (showId, bearerToken, startDate, endDate) => {
    const url = `https://api.snapkit.com/v1/stories/studio/revenue/creator/${showId}/stories`;
    const params = { start_date: startDate, end_date: endDate };
    const headers = { "authorization": `Bearer ${bearerToken}` };

    try {
      const response = await axios.get(url, { headers, params });
      const stories = response.data.stories || [];
      const revenue = stories.reduce((sum, story) => sum + (story.aggregated_metrics?.revenue || 0), 0);
      const impressions = stories.reduce((sum, story) => sum + (story.aggregated_metrics?.sold_impressions || 0), 0);
      return { revenue, impressions, error: null };
    } catch (error) {
      console.error(`Error fetching data for ${showId}:`, error.message);
      return { revenue: 0, impressions: 0, error: `Failed to fetch data for ${showId}: ${error.message}` };
    }
  };

  const resultShows = {};
  const errors = [];
  let totalRevenue = 0;
  let totalImpressions = 0;
  let totalKaleb = 0;
  let totalBlake = 0;
  let trendData = [];

  for (const [show, config] of Object.entries(SHOWS)) {
    const { revenue, impressions, error } = await fetchMetricsForShow(show, BEARER_TOKEN, startDate, endDate);
    if (error) errors.push(error);

    const ecp = impressions ? (revenue / impressions * 1000) : 0;
    const remainingRevenue = revenue * (1 - config.portal_split);
    const kalebCut = remainingRevenue * (1 - config.agency_split - config.editor_split) * config.business_split.kaleb;
    const blakeCut = remainingRevenue * (1 - config.agency_split - config.editor_split) * config.business_split.blake;

    resultShows[show] = {
      revenue,
      impressions,
      averageEcpm: ecp,
      kalebCut,
      blakeCut,
      startDate,
      endDate
    };

    totalRevenue += revenue;
    totalImpressions += impressions;
    totalKaleb += kalebCut;
    totalBlake += blakeCut;

    trendData.push({
      date: endDate,
      revenue,
      impressions,
      ecpm: ecp
    });
  }

  const totalEcpm = totalImpressions ? (totalRevenue / totalImpressions * 1000) : 0;

  const output = {
    dailyData: [{
      date: endDate,
      revenue: totalRevenue,
      kalebs_cut: totalKaleb,
      blakes_cut: totalBlake,
      net_profit: totalBlake,
      impressions: totalImpressions,
      ecpm: totalEcpm
    }],
    aggregated: {
      total_revenue: totalRevenue,
      total_impressions: totalImpressions,
      total_kalebs_cut: totalKaleb,
      total_blakes_cut: totalBlake,
      total_net_profit: totalBlake,
      average_ecpm: totalEcpm
    },
    aggregatedShows: [{
      show_name: "The Daily Tech",
      date_range: { from: startDate, to: endDate },
      revenue: totalRevenue,
      impressions: totalImpressions,
      ecpm: totalEcpm
    }],
    historical: {
      previousPeriod: {
        aggregated: {
          total_revenue: 1378378.42,
          total_impressions: 48646007,
          total_kalebs_cut: 689189.44,
          total_blakes_cut: 344594.77,
          total_net_profit: 344594.77,
          average_ecpm: 28.33
        }
      },
      trend: trendData
    },
    errors 
  };

  res.json(output);
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
