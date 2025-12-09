const LOGO_MAP: Record<string, string> = {
  mule: "/logos/Mulesoft-02.png",
  mq: "/logos/IBM-MQ.png",
  salesforce: "/logos/salesforce-img.png",
  sap: "/logos/SAP-img.png",
  "mainframe 400": "/logos/mainframe400.png",
  servicenow: "/logos/servicenowlogo.png",
  jira: "/logos/Jira.jfif",
  zendesk: "/logos/zendesk.png",
  exchange: "/logos/Exchange.png",
  gmail: "/logos/gmail.png",
  slack: "/logos/slack.png",
  teams: "/logos/teamslogo.png",
  zoom: "/logos/zoom.png",
};

export const getEnterpriseLogo = (enterprise?: string | null): string | null => {
  if (!enterprise) return null;
  const key = enterprise.trim().toLowerCase();
  return LOGO_MAP[key] ?? null;
};
