const isProd = process.env.NODE_ENV === "production";
const url = isProd ? "https://pm.dartus.fr" : "http://localhost:8080";

module.exports = {
  isProd,
  url,
};
