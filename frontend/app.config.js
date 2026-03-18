const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || "";
const MAPBOX_DOWNLOAD_TOKEN = process.env.MAPBOX_DOWNLOAD_TOKEN || MAPBOX_TOKEN;

module.exports = ({ config }) => {
  const plugins = (config.plugins || []).map((p) => {
    if (p === "@rnmapbox/maps") {
      return [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: MAPBOX_DOWNLOAD_TOKEN,
        },
      ];
    }
    return p;
  });

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      MAPBOX_TOKEN,
    },
  };
};
