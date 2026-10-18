import type { ContactInput, GuidanceRequestInput, NewsletterInput } from '@shared/schemas/forms';
import { api, unwrap } from './client';

type Message = { message: string };

export const formsApi = {
  contact: (input: ContactInput) => unwrap<Message>(api.post('/contact', input)),
  guidanceRequest: (input: GuidanceRequestInput) => unwrap<Message>(api.post('/guidance-requests', input)),
  newsletter: (input: NewsletterInput) => unwrap<Message>(api.post('/newsletter', input)),
};
