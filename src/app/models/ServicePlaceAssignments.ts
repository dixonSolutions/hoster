export interface ServicePlaceAssignments {
  id: number;
  businessID: string;
  serviceID: string;
  placeID: string;
  created_at: Date;
}

export interface CreateServicePlaceAssignmentRequest {
  businessID: string;
  serviceID: string;
  placeID: string;
} 