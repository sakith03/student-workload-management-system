module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["src/hooks/**/*.js", "src/steps/**/*.js", "src/support/**/*.js"],
    format: ["progress-bar", "html:reports/report.html"],
    publishQuiet: true,
    parallel: 0
  }
};

