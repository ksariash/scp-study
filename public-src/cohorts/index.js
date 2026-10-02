window.SCP_ZMAN_REGISTRY = {
  version: 2,
  defaultZmanId: "2026-summer",
  latestZmanId: "2026-summer",
  zmanim: [
    {
      id: "2026-summer",
      name: "Nat Bar Nat & Stam Ye'enam - Summer 26",
      analyticsKey: "2026-summer",
      status: "current",
      startsOn: "2026-06-01",
      path: "cohorts/2026-summer",
      legacyIds: ["nat-bar-nat-stam-yeinam-summer-26"],
      questionCount: 58,
      essayCount: 14
    }
  ]
};
window.SCP_COHORT_REGISTRY = {
  version: window.SCP_ZMAN_REGISTRY.version,
  defaultCohortId: window.SCP_ZMAN_REGISTRY.defaultZmanId,
  latestZmanId: window.SCP_ZMAN_REGISTRY.latestZmanId,
  cohorts: window.SCP_ZMAN_REGISTRY.zmanim
};
