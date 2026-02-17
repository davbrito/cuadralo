export type Booking = {
  id: string;
  serviceId: string;
  serviceName?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  startTime: Date;
  endTime: Date;
  createdAt?: Date;
};
