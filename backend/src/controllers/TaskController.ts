import { Request, Response } from "express";
import { userRepository } from "../repositories/UserRepository";
import { taskRepository } from "../repositories/TaskRepository";
import getCurrentDate from "../utils/getCurrentDate";
import { UpdateResult } from "typeorm";
import differenceInDaysOfTwoDates from "../utils/differenceInDaysOfTwoDates";

export class TaskController {
  async create(req: Request, res: Response) {
    const { title, description, priority, deadline } = req.body;

    try {
      const validated_User_id = await userRepository.findOneBy({
        id: req.userId,
      });

      if (!validated_User_id) {
        return res.status(404).json({ message: "Usuario não encontrado" });
      }

      const notificationStatus = differenceInDaysOfTwoDates(
        deadline,
        getCurrentDate()
      );

      const newTask = taskRepository.create({
        progressStatus: 0,
        title,
        description,
        priority,
        deadline,
        notificationStatus: notificationStatus,
        notificationVisualization: notificationStatus === 0 ? true : false,
        user: validated_User_id,
        isArchived: false,
      });

      await taskRepository.save(newTask);

      return res
        .status(201)
        .json({ message: "Nova tarefa cadastrada com sucesso!" });
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }

  async delete(req: Request, res: Response) {
    const { Task_id } = req.params;

    try {
      const validatedTaskId = await taskRepository.findOneBy({
        id: Task_id,
        user: {
          id: req.userId,
        },
      });

      if (!validatedTaskId) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }

      const deletedTask = await taskRepository.delete({
        id: Task_id,
      });

      if (deletedTask.affected) {
        console.log(deletedTask);
        return res.json({ message: "Tarefa excluida com sucesso" });
      }
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }

  async archive(req: Request, res: Response) {
    const { Task_id } = req.params;

    try {
      const validatedTaskId = await taskRepository.findOneBy({
        id: Task_id,
        user: {
          id: req.userId,
        },
      });

      if (!validatedTaskId) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }

      const task = await taskRepository.update(
        {
          id: Task_id,
        },
        {
          isArchived: !validatedTaskId.isArchived,
        }
      );
      if (task) {
        return res.json({
          status: !validatedTaskId.isArchived,
          message: "Status de arquivo da tarefa atualizado com sucesso",
        });
      }
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }

  async update(req: Request, res: Response) {
    const { title, description, priority, deadline, progressStatus } = req.body;
    const { Task_id } = req.params;
    const validateTaskId = await taskRepository.findBy({
      id: Task_id,
      user: {
        id: req.userId,
      },
    });

    if (!validateTaskId) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const notificationStatus = differenceInDaysOfTwoDates(
      deadline,
      getCurrentDate()
    );

    try {
      const currDataTask = await taskRepository.findOneBy({ id: Task_id });
      const task = await taskRepository.update(
        {
          id: Task_id,
          user: {
            id: req.userId,
          },
        },
        {
          isArchived: progressStatus !== 2 ? false : true,
          progressStatus,
          title,
          description,
          deadline,
          priority,
          notificationStatus: notificationStatus,
          notificationVisualization: notificationStatus === 0 ? true : false,
          finishedDate:
            currDataTask.finishedDate != null
              ? currDataTask.finishedDate
              : progressStatus === 2
              ? getCurrentDate()
              : null,
        }
      );

      if (task) {
        return res.json({ message: "Tarefa atualizada com sucesos" });
      }
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }

  async progressStatusPatch(req: Request, res: Response) {
    const { progressStatus } = req.body;
    const { Task_id } = req.params;

    const validateTaskId = await taskRepository.findBy({
      id: Task_id,
      user: {
        id: req.userId,
      },
    });
    if (!validateTaskId) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    if ([0, 1, 2].indexOf(progressStatus) === -1) {
      return res
        .status(400)
        .json({ message: "Valor invalido para status da tarefa" });
    }

    try {
      let task: UpdateResult;
      if (progressStatus != 2) {
        task = await taskRepository.update(
          {
            id: Task_id,
            user: {
              id: req.userId,
            },
          },
          {
            progressStatus,
            finishedDate: null,
          }
        );
      } else {
        task = await taskRepository.update(
          {
            id: Task_id,
            user: {
              id: req.userId,
            },
          },
          {
            progressStatus,
            finishedDate: getCurrentDate(),
          }
        );
      }

      if (task) {
        return res.json({
          message: "Status de progresso da tarefa atualizado com sucesso",
        });
      }
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }

  async notificationStatusPatch(req: Request, res: Response) {
    const { Task_id } = req.params;
    const validateTaskId = await taskRepository.findBy({
      id: Task_id,
      user: {
        id: req.userId,
      },
    });

    if (!validateTaskId) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    try {
      const task = await taskRepository.update(
        {
          id: Task_id,
          user: {
            id: req.userId,
          },
        },
        {
          notificationVisualization: true,
        }
      );

      if (task) {
        return res.json({
          message:
            "Status de visualização da notificação da tarefa atualizado com sucesso",
        });
      }
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }
}
