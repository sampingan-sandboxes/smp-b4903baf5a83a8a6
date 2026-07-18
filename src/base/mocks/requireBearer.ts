// PROVIDED — do not modify.
import { HttpResponse } from 'msw';

export function requireBearer(request: Request): HttpResponse<{ message: string }> | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
