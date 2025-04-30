import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { startDate, endDate, code } = req.query;

  const SHOWS = {
    "backtolife899": {"portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.10, "business_split": {"kaleb": 0.40, "blake": 0.60}},
    "asmrtv2022": {"portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.00, "business_split": {"kaleb": 0.40, "blake": 0.60}},
    "asmrlive22": {"portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.00, "business_split": {"kaleb": 0.40, "blake": 0.60}},
    "petstown": { "portal_split": 0.70, "agency_split": 0.50, "editor_split": 0.10, "business_split": { "kaleb": 0.40, "blake": 0.60 } },
  };

  const fetchMetricsForShow = async (showId, bearerToken, startDate, endDate) => {
    const url = `https://api.snapkit.com/v1/stories/studio/revenue/creator/${showId}/stories`;
    const params = { start_date: startDate, end_date: endDate };
    const headers = { "authorization": `Bearer ${code}` };

    try {
      const response = await axios.get(url, { headers, params });
      const stories = response.data.stories || [];
      const revenue = stories.reduce((sum, story) => sum + (story.aggregated_metrics?.revenue || 0), 0);
      const impressions = stories.reduce((sum, story) => sum + (story.aggregated_metrics?.sold_impressions || 0), 0);
      return { revenue, impressions, error: null };
    } catch (error) {
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
    const { revenue, impressions, error } = await fetchMetricsForShow(show, code, startDate, endDate);
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

  res.status(200).json({
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
  });
}
