import { Resend } from "resend";
import { AnalysisResult } from "./analysis";

interface EmailConfig {
  apiKey: string;
  from: string;
}

interface MeetingReportData {
  meetingTitle: string;
  meetingDate: Date;
  duration: number;
  participants: string[];
  analysis: AnalysisResult;
  dashboardUrl: string;
}

export class EmailService {
  private resend: Resend;
  private from: string;

  constructor(config: EmailConfig) {
    this.resend = new Resend(config.apiKey);
    this.from = config.from;
  }

  async sendMeetingReport(
    to: string,
    data: MeetingReportData
  ): Promise<{ id: string }> {
    const html = this.generateReportHtml(data);

    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `📋 Resumen: ${data.meetingTitle}`,
      html,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { id: result.data?.id || "" };
  }

  private generateReportHtml(data: MeetingReportData): string {
    const {
      meetingTitle,
      meetingDate,
      duration,
      participants,
      analysis,
      dashboardUrl,
    } = data;

    const formatDate = (date: Date) =>
      date.toLocaleDateString("es-EC", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    const formatDuration = (mins: number) => {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumen de Reunión</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #3b82f6;
    }
    h1 {
      margin: 16px 0 8px;
      font-size: 28px;
      color: #1a1a1a;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .summary {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    ul {
      margin: 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .action-item {
      background: #fef3c7;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .action-item .task {
      font-weight: 500;
    }
    .action-item .meta {
      font-size: 13px;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-high { background: #fee2e2; color: #b91c1c; }
    .badge-medium { background: #fef3c7; color: #b45309; }
    .badge-low { background: #dcfce7; color: #15803d; }
    .participants {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .participant {
      background: #e5e7eb;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
    }
    .cta {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .cta a {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📊 MeetAnalyzer</div>
      <h1>${meetingTitle}</h1>
      <div class="meta">
        📅 ${formatDate(meetingDate)} · ⏱️ ${formatDuration(duration)}
      </div>
    </div>

    <div class="section">
      <div class="section-title">👥 Participantes</div>
      <div class="participants">
        ${participants.map((p) => `<span class="participant">${p}</span>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-title">📝 Resumen Ejecutivo</div>
      <div class="summary">${analysis.summary}</div>
    </div>

    <div class="section">
      <div class="section-title">🎯 Puntos Clave</div>
      <ul>
        ${analysis.keyPoints.map((point) => `<li>${point}</li>`).join("")}
      </ul>
    </div>

    ${
      analysis.actionItems.length > 0
        ? `
    <div class="section">
      <div class="section-title">✅ Action Items</div>
      ${analysis.actionItems
        .map(
          (item) => `
        <div class="action-item">
          <div class="task">${item.task}</div>
          <div class="meta">
            ${item.assignee ? `👤 ${item.assignee}` : ""}
            ${item.deadline ? ` · 📅 ${item.deadline}` : ""}
            ${
              item.priority
                ? ` · <span class="badge badge-${item.priority}">${item.priority.toUpperCase()}</span>`
                : ""
            }
          </div>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    ${
      analysis.decisions.length > 0
        ? `
    <div class="section">
      <div class="section-title">🔨 Decisiones Tomadas</div>
      <ul>
        ${analysis.decisions.map((d) => `<li>${d}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }

    ${
      analysis.followUps.length > 0
        ? `
    <div class="section">
      <div class="section-title">🔄 Seguimientos Pendientes</div>
      <ul>
        ${analysis.followUps.map((f) => `<li>${f}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }

    <div class="cta">
      <a href="${dashboardUrl}">Ver Reporte Completo →</a>
    </div>

    <div class="footer">
      Este reporte fue generado automáticamente por MeetAnalyzer.<br>
      © ${new Date().getFullYear()} MeetAnalyzer
    </div>
  </div>
</body>
</html>
    `;
  }
}
