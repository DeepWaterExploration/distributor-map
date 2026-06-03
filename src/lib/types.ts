export type Distributor = {
  name: string;
  website: string;
  address: string;
  phone: string;
  email: string;
  /** [latitude, longitude] */
  coordinates: [number, number];
};
