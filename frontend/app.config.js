const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || "";

module.exports = ({ config }) => {
  // Inject Mapbox download token and pin iOS SDK version
  const plugins = (config.plugins || []).map((p) => {
    if (p === "@rnmapbox/maps") {
      return [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: MAPBOX_TOKEN,
          RNMapboxMapsVersion: "11.8.0",
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
