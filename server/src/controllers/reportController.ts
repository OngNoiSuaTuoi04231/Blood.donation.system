import { Request, Response } from 'express';
import Registration from '../models/Registration';
import BloodDonationEvent from '../models/BloodDonationEvent';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  buildReportData,
  buildSummary,
  generateVietnameseExcel,
  generateVietnameseCSV,
  getAgeDistribution,
  getBloodTypeDistribution,
} from '../services/reportService';

/**
 * GET /api/reports/statistics
 * Get dashboard statistics (admin)
 */
export const getStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalDonors = await User.countDocuments({ role: 'donor', isActive: true });
    const totalMedicalStaff = await User.countDocuments({ role: 'medical_staff', isActive: true });
    const totalEvents = await BloodDonationEvent.countDocuments();
    const openEvents = await BloodDonationEvent.countDocuments({ status: 'open' });
    const totalRegistrations = await Registration.countDocuments();
    const checkedIn = await Registration.countDocuments({ 'checkIn.status': 'checked_in' });
    const eligible = await Registration.countDocuments({ medicalStatus: 'eligible' });
    const ineligible = await Registration.countDocuments({ medicalStatus: 'ineligible' });

    // Registration by event
    const events = await BloodDonationEvent.find().select('title');
    const registrationsByEvent = await Promise.all(
      events.map(async (event) => {
        const count = await Registration.countDocuments({
          eventId: event._id,
          registrationStatus: { $ne: 'cancelled' },
        });
        return { name: event.title, value: count };
      })
    );

    // Age distribution
    const ageDistribution = await getAgeDistribution();

    // Blood type distribution
    const bloodTypeDistribution = await getBloodTypeDistribution();

    // Check-in rate
    const checkInRate = [
      { name: 'Checked In', value: checkedIn },
      { name: 'Not Checked In', value: totalRegistrations - checkedIn },
    ];

    // Medical result distribution
    const medicalPending = await Registration.countDocuments({ medicalStatus: 'pending' });
    const medicalDistribution = [
      { name: 'Eligible', value: eligible },
      { name: 'Ineligible', value: ineligible },
      { name: 'Pending', value: medicalPending },
    ];

    sendSuccess(res, {
      summary: {
        totalDonors,
        totalMedicalStaff,
        totalEvents,
        openEvents,
        totalRegistrations,
        checkedIn,
        eligible,
        ineligible,
      },
      charts: {
        registrationsByEvent,
        ageDistribution,
        bloodTypeDistribution,
        checkInRate,
        medicalDistribution,
      },
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch statistics', 500);
  }
};

/**
 * GET /api/reports/event/:eventId
 * Get report for a specific event
 */
export const getEventReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      eventId: String(req.params.eventId),
      registrationStatus: req.query.registrationStatus as string,
      checkInStatus: req.query.checkInStatus as string,
      medicalStatus: req.query.medicalStatus as string,
      bloodType: req.query.bloodType as string,
      ageGroup: req.query.ageGroup as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const registrations = await buildReportData(filters);
    const summary = buildSummary(registrations);
    const ageDistribution = await getAgeDistribution(String(req.params.eventId));
    const bloodTypeDistribution = await getBloodTypeDistribution(String(req.params.eventId));

    sendSuccess(res, {
      registrations,
      summary,
      ageDistribution,
      bloodTypeDistribution,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch event report', 500);
  }
};

/**
 * GET /api/reports/event/:eventId/export
 * Export event report as CSV or Excel
 */
export const exportEventReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const format = req.query.format as string || 'csv';

    const filters = {
      eventId: String(req.params.eventId),
      registrationStatus: req.query.registrationStatus as string,
      checkInStatus: req.query.checkInStatus as string,
      medicalStatus: req.query.medicalStatus as string,
      bloodType: req.query.bloodType as string,
      ageGroup: req.query.ageGroup as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const registrations = await buildReportData(filters);

    if (format === 'excel') {
      const buffer = generateVietnameseExcel(registrations);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
      res.send(buffer);
    } else {
      const csv = generateVietnameseCSV(registrations);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
      // Add BOM for UTF-8 CSV
      res.send('\uFEFF' + csv);
    }
  } catch (error: any) {
    sendError(res, error.message || 'Failed to export report', 500);
  }
};

/**
 * GET /api/reports/general
 * Get general report with filters
 */
export const getGeneralReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      eventId: req.query.eventId as string,
      registrationStatus: req.query.registrationStatus as string,
      checkInStatus: req.query.checkInStatus as string,
      medicalStatus: req.query.medicalStatus as string,
      bloodType: req.query.bloodType as string,
      ageGroup: req.query.ageGroup as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const registrations = await buildReportData(filters);
    const summary = buildSummary(registrations);

    sendSuccess(res, { registrations, summary });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch report', 500);
  }
};

/**
 * GET /api/reports/general/export
 * Export general report
 */
export const exportGeneralReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const format = req.query.format as string || 'csv';

    const filters = {
      eventId: req.query.eventId as string,
      registrationStatus: req.query.registrationStatus as string,
      checkInStatus: req.query.checkInStatus as string,
      medicalStatus: req.query.medicalStatus as string,
      bloodType: req.query.bloodType as string,
      ageGroup: req.query.ageGroup as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const registrations = await buildReportData(filters);

    if (format === 'excel') {
      const buffer = generateVietnameseExcel(registrations);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
      res.send(buffer);
    } else {
      const csv = generateVietnameseCSV(registrations);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
      res.send('\uFEFF' + csv);
    }
  } catch (error: any) {
    sendError(res, error.message || 'Failed to export report', 500);
  }
};
