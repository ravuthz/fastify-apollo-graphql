const { PORT, NODE_ENV } = process.env || {};

export default {
  env: NODE_ENV || "development",
  host: "0.0.0.0",
  port: +(PORT || 3000),
};
