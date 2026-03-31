import { formatDistanceToNow, isValid, format } from 'date-fns';

export const safeNewDate = (dateString: string | undefined | null) => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isValid(date) ? date : new Date();
};

export const safeFormatDistanceToNow = (dateString: string | undefined | null) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  if (!isValid(date)) return 'Never';
  return formatDistanceToNow(date);
};

export const safeFormat = (dateString: string | undefined | null, formatStr: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (!isValid(date)) return 'N/A';
  return format(date, formatStr);
};
