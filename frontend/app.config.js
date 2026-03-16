const appJson = require("./app.json");

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || "";

module.exports = ({ config }) => {
  // Inject Mapbox download token into the plugin at build time
  const plugins = (config.plugins || []).map((p) => {
    if (p === "@rnmapbox/maps") {
      return [
        "@rnmapbox/maps",
        { RNMapboxMapsDownloadToken: MAPBOX_TOKEN },
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
