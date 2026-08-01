import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator';

const router = Router();
const taskController = new TaskController();

router.use(authenticateJWT);

router.post('/', validateRequest(createTaskSchema), taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/metrics', taskController.getDashboardMetrics);
router.get('/:id', taskController.getTaskById);
router.get('/:id/logs', taskController.getTaskLogs);
router.put('/:id', validateRequest(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/retry', taskController.retryTask);

export default router;
