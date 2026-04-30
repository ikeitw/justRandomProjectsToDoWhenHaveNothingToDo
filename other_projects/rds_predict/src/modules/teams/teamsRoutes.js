import express from 'express';
import { getTeamById, getTeams } from './teamsController.js';

const router = express.Router();

router.get('/', getTeams);
router.get('/:teamId', getTeamById);

export default router;