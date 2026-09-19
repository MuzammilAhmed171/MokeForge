import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
  updateThumbnail,
  incrementExport
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/duplicate', duplicateProject);
router.put('/:id/thumbnail', updateThumbnail);
router.put('/:id/export', incrementExport);

export default router;
