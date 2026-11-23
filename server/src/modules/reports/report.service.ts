import { Types } from 'mongoose';
import { IndividualMeetingModel } from '../meetings/meeting.model';
import { DialogueForumModel } from '../df/df.model';
import { GroupMeetingModel } from '../gm/gm.model';
import { RmmModel, RmmTargetModel } from '../rmm/rmm.model';
import { WorkspaceModel } from '../workspaces/workspace.model';
import { PersonModel } from '../people/person.model';
import { PersonStage } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class ReportService {
  static async getWeeklyReport(
    workspaceId: string,
    startDateStr: string,
    endDateStr: string
  ) {
    const workspace = (await WorkspaceModel.findById(workspaceId).exec()) as any;
    if (!workspace) throw new AppError('Workspace not found', 404);

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // Month boundary: from 1st of the month to endDate
    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    // 1. Weekly Counts
    const weeklyImCount = await IndividualMeetingModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      meetingDate: { $gte: startDate, $lte: endDate }
    });

    const weeklyDfCount = await DialogueForumModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      date: { $gte: startDate, $lte: endDate }
    });

    const weeklyRmmCount = await RmmModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      rmmDate: { $gte: startDate, $lte: endDate }
    });

    const weeklyGmCount = await GroupMeetingModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      date: { $gte: startDate, $lte: endDate }
    });

    // 2. Month Progress (From 1st to Till Date)
    const monthImCount = await IndividualMeetingModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      meetingDate: { $gte: monthStart, $lte: endDate }
    });

    const monthDfCount = await DialogueForumModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      date: { $gte: monthStart, $lte: endDate }
    });

    // 3. Next Week Schedule (From latest RMMs or active Madu/MDF targets)
    const latestRmms = await RmmModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      weekEndDate: { $gte: startDate }
    }).select('_id');

    const rmmIds = latestRmms.map((r) => r._id);

    const rmmTargets = await RmmTargetModel.find({
      rmmId: { $in: rmmIds }
    }).populate('personId', 'fullName currentStage');

    const nextWeekMaduNames: string[] = [];
    const nextWeekMdfNames: string[] = [];

    for (const t of rmmTargets) {
      const name = (t.personId as any)?.fullName;
      if (!name) continue;
      if (t.category === PersonStage.MADU && !nextWeekMaduNames.includes(name)) {
        nextWeekMaduNames.push(name);
      } else if (t.category === PersonStage.MDF && !nextWeekMdfNames.includes(name)) {
        nextWeekMdfNames.push(name);
      }
    }

    // Format WhatsApp text standard matching Part 13.2
    const startFormatted = startDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
    const endFormatted = endDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const whatsappText = `Weekly Dawati Report (${startFormatted} – ${endFormatted})

- IMs: ${weeklyImCount}
- DFs: ${weeklyDfCount}
- RMMs: ${weeklyRmmCount}
- GMs: ${weeklyGmCount}

Month Progress (From 1st to Till Date)
- Total IMs: ${monthImCount}
- Total DFs: ${monthDfCount}

APP SYNCED: YES

Next Week Meetings Schedule
Madu: ${nextWeekMaduNames.length} (${nextWeekMaduNames.join(', ') || 'None'})
MDF: ${nextWeekMdfNames.length} (${nextWeekMdfNames.join(', ') || 'None'})

Regards,
Secretary Dawat ${workspace.name}`;

    return {
      workspaceName: workspace.name,
      startDate: startDateStr,
      endDate: endDateStr,
      weekly: {
        ims: weeklyImCount,
        dfs: weeklyDfCount,
        rmms: weeklyRmmCount,
        gms: weeklyGmCount
      },
      monthProgress: {
        totalIms: monthImCount,
        totalDfs: monthDfCount
      },
      nextWeekSchedule: {
        maduCount: nextWeekMaduNames.length,
        maduNames: nextWeekMaduNames,
        mdfCount: nextWeekMdfNames.length,
        mdfNames: nextWeekMdfNames
      },
      whatsappText
    };
  }

  static async getMonthlyReport(
    workspaceId: string,
    month: number,
    year: number
  ) {
    const workspace = (await WorkspaceModel.findById(workspaceId).exec()) as any;
    if (!workspace) throw new AppError('Workspace not found', 404);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const imCount = await IndividualMeetingModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      meetingDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const dfCount = await DialogueForumModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const rmmCount = await RmmModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      rmmDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const gmCount = await GroupMeetingModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    return {
      workspaceName: workspace.name,
      month,
      year,
      totals: {
        imCount,
        dfCount,
        rmmCount,
        gmCount
      }
    };
  }

  static async exportReport(
    workspaceId: string,
    format: 'csv' | 'doc' | 'txt',
    startDate: string,
    endDate: string
  ) {
    const report = await this.getWeeklyReport(workspaceId, startDate, endDate);

    if (format === 'txt') {
      return {
        contentType: 'text/plain; charset=utf-8',
        filename: `Weekly-Report-${startDate}-to-${endDate}.txt`,
        content: report.whatsappText
      };
    }

    if (format === 'csv') {
      let csv = `Category,Count\n`;
      csv += `Weekly IMs,${report.weekly.ims}\n`;
      csv += `Weekly DFs,${report.weekly.dfs}\n`;
      csv += `Weekly RMMs,${report.weekly.rmms}\n`;
      csv += `Weekly GMs,${report.weekly.gms}\n`;
      csv += `Month Till Date IMs,${report.monthProgress.totalIms}\n`;
      csv += `Month Till Date DFs,${report.monthProgress.totalDfs}\n`;
      csv += `Next Week Madu Targets,${report.nextWeekSchedule.maduCount}\n`;
      csv += `Next Week MDF Targets,${report.nextWeekSchedule.mdfCount}\n`;

      return {
        contentType: 'text/csv; charset=utf-8',
        filename: `Report-${startDate}-to-${endDate}.csv`,
        content: csv
      };
    }

    // Word format: clean HTML document consumable by Microsoft Word
    const htmlWord = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Weekly Dawati Report</title>
<style>
body { font-family: Calibri, sans-serif; line-height: 1.5; color: #252525; }
h1 { color: #C62828; font-size: 18pt; border-bottom: 2px solid #C62828; padding-bottom: 4px; }
h2 { color: #252525; font-size: 14pt; margin-top: 14pt; }
table { width: 100%; border-collapse: collapse; margin-top: 8pt; }
th, td { border: 1px solid #E8E8E8; padding: 6pt 8pt; text-align: left; }
th { background-color: #F7F7F7; font-weight: bold; }
</style>
</head>
<body>
<h1>United Pakistan — Weekly Dawati Report</h1>
<p><strong>Sector:</strong> ${report.workspaceName} | <strong>Period:</strong> ${startDate} to ${endDate}</p>

<h2>Weekly Operational Activity</h2>
<table>
<tr><th>Metric</th><th>Count</th></tr>
<tr><td>Individual Meetings (IMs)</td><td><strong>${report.weekly.ims}</strong></td></tr>
<tr><td>Dialogue Forums (DFs)</td><td><strong>${report.weekly.dfs}</strong></td></tr>
<tr><td>Weekly Planning (RMMs)</td><td><strong>${report.weekly.rmms}</strong></td></tr>
<tr><td>Group Meetings (GMs)</td><td><strong>${report.weekly.gms}</strong></td></tr>
</table>

<h2>Month Progress (From 1st to Till Date)</h2>
<table>
<tr><th>Metric</th><th>Count</th></tr>
<tr><td>Total Completed IMs</td><td><strong>${report.monthProgress.totalIms}</strong></td></tr>
<tr><td>Total Completed DFs</td><td><strong>${report.monthProgress.totalDfs}</strong></td></tr>
</table>

<h2>Next Week Planned Targets</h2>
<p><strong>Madu (${report.nextWeekSchedule.maduCount}):</strong> ${report.nextWeekSchedule.maduNames.join(', ') || 'None'}</p>
<p><strong>MDF (${report.nextWeekSchedule.mdfCount}):</strong> ${report.nextWeekSchedule.mdfNames.join(', ') || 'None'}</p>

<p style="margin-top: 24pt;">Regards,<br><strong>Secretary Dawat ${report.workspaceName}</strong></p>
</body>
</html>`;

    return {
      contentType: 'application/msword; charset=utf-8',
      filename: `Weekly-Report-${startDate}-to-${endDate}.doc`,
      content: htmlWord
    };
  }
}
