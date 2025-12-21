import express from "express";
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  toggleSaveJob,
  getSavedJobs,
  getMyApplications,
  acceptApplication,
  rejectApplication,
  getWorkingModes,
  getDomains,
  getLevels,
  approveJob,
  rejectJob,
  getMyJobs,
  closeJob,
} from "../controllers/JobController.js";
import { uploadResume } from "../middleware/Upload.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/jobs/lookup/working-modes:
 *   get:
 *     summary: Get all working modes (public)
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Working modes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       example: "Full-time"
 */
router.get("/lookup/working-modes", getWorkingModes);

/**
 * @swagger
 * /api/jobs/lookup/domains:
 *   get:
 *     summary: Get all domains (public)
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Domains retrieved successfully
 */
router.get("/lookup/domains", getDomains);

/**
 * @swagger
 * /api/jobs/lookup/levels:
 *   get:
 *     summary: Get all levels (public)
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Levels retrieved successfully
 */
router.get("/lookup/levels", getLevels);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with filters
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *       - in: query
 *         name: domainId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: workingModeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, expired]
 *           default: open
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get("/", getJobs);

/**
 * @swagger
 * /api/jobs/my:
 *   get:
 *     summary: Get my posted jobs (client only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, expired]
 *       - in: query
 *         name: reviewStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: My jobs retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permission denied
 */
router.get("/my", authRequired, getMyJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id", getJobById);

/**
 * @swagger
 * /api/jobs/{jobId}/apply:
 *   post:
 *     summary: Apply for a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 example: "I am interested in this position..."
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Already applied or invalid request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  "/:jobId/apply",
  authRequired,
  uploadResume.single("resume"),
  applyForJob
);

/**
 * @swagger
 * /api/jobs/{jobId}/save:
 *   post:
 *     summary: Save or unsave a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job saved/unsaved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/:jobId/save", authRequired, toggleSaveJob);

/**
 * @swagger
 * /api/jobs/saved/list:
 *   get:
 *     summary: Get saved jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved jobs retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/saved/list", authRequired, getSavedJobs);

/**
 * @swagger
 * /api/jobs/applications/my:
 *   get:
 *     summary: Get my job applications
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/applications/my", authRequired, getMyApplications);

/**
 * @swagger
 * /api/jobs/applications/{applicationId}/accept:
 *   patch:
 *     summary: Accept a job application (client only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application accepted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Application not found
 */
router.patch(
  "/applications/:applicationId/accept",
  authRequired,
  acceptApplication
);

/**
 * @swagger
 * /api/jobs/applications/{applicationId}/reject:
 *   patch:
 *     summary: Reject a job application (client only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application rejected successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Application not found
 */
router.patch(
  "/applications/:applicationId/reject",
  authRequired,
  rejectApplication
);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobCreate'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", authRequired, createJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobUpdate'
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put("/:id", authRequired, updateJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete("/:id", authRequired, deleteJob);

/**
 * @swagger
 * /api/jobs/{id}/close:
 *   patch:
 *     summary: Close a job (company only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job closed successfully
 *       400:
 *         description: Job is already closed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permission denied
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch("/:id/close", authRequired, closeJob);

router.patch("/:id/approve", authRequired, adminOnly, approveJob);
router.patch("/:id/reject", authRequired, adminOnly, rejectJob);

export default router;
