import {
  findAllJobs,
  findDeliveryAttemptLogsByJobId,
  findDeliveriesByJobId,
  findJobById,
} from "./job.repository";

export async function getAllJobs(userId: string) {
  return findAllJobs(userId);
}

export async function getJobDetails(jobId: string, userId: string) {
  const job = await findJobById(jobId, userId);

  if (!job) {
    return null;
  }

  const deliveries = await findDeliveriesByJobId(jobId, userId);
  const attempts = await findDeliveryAttemptLogsByJobId(jobId, userId);

  return {
    job,
    deliveries,
    attempts,
  };
}

export async function getJobDeliveries(jobId: string, userId: string) {
  const job = await findJobById(jobId, userId);

  if (!job) {
    return null;
  }

  const deliveries = await findDeliveriesByJobId(jobId, userId);
  const attempts = await findDeliveryAttemptLogsByJobId(jobId, userId);

  return {
    deliveries,
    attempts,
  };
}